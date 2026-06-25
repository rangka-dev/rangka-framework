/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FrameworkContext } from '@rangka/shared';
import type { FastifyInstance } from 'fastify';
import type { DiscoverySource, DiscoveredApp } from './types.js';
import { dependencySort } from './dependency-sort.js';
import { loadSchemas } from './schema-loader.js';
import { mergeSchemas } from './schema-merger.js';
import { SchemaRegistry } from '../schema/registry.js';
import { DatabaseClient } from '../db/client.js';
import type { DatabaseClientConfig } from '../db/client.js';
import { autoSync } from '../db/auto-sync.js';
import { createServer } from '../api/server.js';
import { generateRoutes } from '../api/route-generator.js';
import type { ServerConfig } from '../api/types.js';
import { PermissionRegistry } from '../auth/permission-registry.js';
import { HookRegistry } from '../hooks/registry.js';
import { JobRegistry } from '../jobs/registry.js';
import { JobWorker } from '../jobs/worker.js';
import { ScheduleManager } from '../jobs/scheduler.js';
import { EventBus } from '../events/bus.js';
import { ServiceRegistry } from '../services/registry.js';
import { FixtureRegistry } from '../fixtures/registry.js';
import { createFrameworkContext } from '../context.js';
import { getCoreApp, getCoreModels } from '../auth/core-module.js';
import { seedCoreData } from '../auth/seed.js';
import { ScopeRegistry } from '../auth/scope-registry.js';
import { WidgetRegistry } from '../widgets/widget-registry.js';
import { AdapterRegistry } from '../plugins/adapter-registry.js';
import { PluginLifecycleManager } from '../plugins/lifecycle.js';
import { loadPlugins } from '../plugins/loader.js';
import { validateApps } from './validator.js';
import { validateModelReferences } from './cross-validator.js';
import { validatePageBindings } from './page-utils.js';
import type { PluginDefinition } from '../plugins/types.js';
import type { RolesConfig, JobConfig } from '@rangka/shared';
import type { JobWorkerConfig } from '../jobs/types.js';
import type { ServiceDefinition } from '../services/types.js';
import type { FixtureDefinition } from '../fixtures/types.js';

export interface BootOptions {
  discoverySource: DiscoverySource;
  apps: DiscoveredApp[];
  database?: DatabaseClientConfig;
  server?: ServerConfig;
  skipAutoSync?: boolean;
  roles?: Array<{ config: RolesConfig; app: string }>;
  jobs?: Array<{ name: string; config: JobConfig }>;
  services?: ServiceDefinition[];
  fixtures?: FixtureDefinition[];
  worker?: JobWorkerConfig;
  config?: Record<string, unknown>;
  plugins?: PluginDefinition[];
  pluginConfig?: Record<string, Record<string, unknown>>;
}

export interface BootResult {
  registry: SchemaRegistry;
  permissionRegistry: PermissionRegistry;
  hookRegistry: HookRegistry;
  jobRegistry: JobRegistry;
  eventBus: EventBus;
  serviceRegistry: ServiceRegistry;
  fixtureRegistry: FixtureRegistry;
  widgetRegistry: WidgetRegistry;
  adapterRegistry: AdapterRegistry;
  pluginLifecycle: PluginLifecycleManager;
  frameworkContext?: FrameworkContext;
  jobWorker?: JobWorker;
  scheduleManager?: ScheduleManager;
  db?: DatabaseClient;
  server?: FastifyInstance;
  pages?: Array<{ module: string; page: import('@rangka/shared').PageDefinition }>;
  modules?: import('@rangka/shared').ModuleConfig[];
}

// Boot sequence:
// 1. Discover and sort apps by dependency order
// 2. Load and merge schemas from all apps
// 3. Build registries (hooks, permissions, jobs, services, fixtures)
// 4. If database configured: connect, sync schema, seed, start workers
// 5. If server configured: create HTTP server and mount routes
export async function boot(options: BootOptions): Promise<BootResult> {
  const sortedApps = await discoverAndSortApps(options);
  validateApps(sortedApps);

  // Load plugins and build adapter registry
  const { adapterRegistry, lifecycleManager } = await loadPluginSystem(options);
  await lifecycleManager.emit('beforeBoot');

  const registry = buildSchemaRegistry(sortedApps);

  // Warn about invalid widget bindings (does not halt boot)
  const allPagesForValidation: Array<{
    module: string;
    page: import('@rangka/shared').PageDefinition;
    file?: string;
  }> = [];
  for (const app of sortedApps) {
    if (app.pages) allPagesForValidation.push(...app.pages);
  }
  if (allPagesForValidation.length > 0) {
    const bindWarnings = validatePageBindings(allPagesForValidation, registry);
    for (const warning of bindWarnings) {
      const location = warning.file ?? warning.pageKey;
      console.warn(
        `[rangka] ${location} → ${warning.pageKey} (${warning.location}): ${warning.message}`,
      );
    }
  }

  const registries = buildRegistries(sortedApps, registry, options);

  if (!options.database) {
    // Default to SQLite when no database config is provided
    options.database = { dialect: 'sqlite' };
  }

  const { db, frameworkContext, jobWorker, scheduleManager } = await initDatabase(
    options,
    registry,
    registries.eventBus,
    registries.jobRegistry,
    registries.serviceRegistry,
  );

  if (!options.server) {
    await lifecycleManager.emit('afterBoot');
    return {
      registry,
      ...registries,
      adapterRegistry,
      pluginLifecycle: lifecycleManager,
      frameworkContext,
      jobWorker,
      scheduleManager,
      db,
    };
  }

  const { server, pages, modules } = await initServer(
    options,
    sortedApps,
    registry,
    db,
    registries,
    adapterRegistry,
  );

  await lifecycleManager.emit('afterBoot');

  return {
    registry,
    ...registries,
    adapterRegistry,
    pluginLifecycle: lifecycleManager,
    frameworkContext,
    jobWorker,
    scheduleManager,
    db,
    server,
    pages,
    modules,
  };
}

// --- Phase 1: Discovery ---

async function loadPluginSystem(options: BootOptions) {
  if (!options.plugins || options.plugins.length === 0) {
    return {
      adapterRegistry: new AdapterRegistry(),
      lifecycleManager: new PluginLifecycleManager(),
    };
  }

  return loadPlugins({
    plugins: options.plugins,
    config: options.pluginConfig,
  });
}

async function discoverAndSortApps(options: BootOptions): Promise<DiscoveredApp[]> {
  await options.discoverySource.findRangkaPackages();

  const coreApp = getCoreApp();
  const userHasCoreApp = options.apps.some((a) => a.config.name === 'core');
  const allApps = userHasCoreApp ? options.apps : [coreApp, ...options.apps];

  const sorted = dependencySort(allApps.map((a) => a.config));

  return sorted.map((config) => {
    const app = allApps.find((a) => a.config.name === config.name);
    if (!app) throw new Error(`App "${config.name}" not found in provided apps`);
    return app;
  });
}

// --- Phase 2: Schema ---

function buildSchemaRegistry(sortedApps: DiscoveredApp[]): SchemaRegistry {
  const loadResult = loadSchemas(sortedApps);
  const mergeResult = mergeSchemas(loadResult);

  const coreModels = getCoreModels();
  const existingNames = new Set(mergeResult.models.map((m) => m.qualifiedName));
  const missingCoreModels = coreModels.filter((m) => !existingNames.has(m.qualifiedName));

  const registry = new SchemaRegistry([...missingCoreModels, ...mergeResult.models]);

  validateModelReferences(registry, loadResult.extensions);

  return registry;
}

// --- Phase 3: Registries ---

interface Registries {
  permissionRegistry: PermissionRegistry;
  hookRegistry: HookRegistry;
  jobRegistry: JobRegistry;
  eventBus: EventBus;
  serviceRegistry: ServiceRegistry;
  fixtureRegistry: FixtureRegistry;
  scopeRegistry: ScopeRegistry;
  widgetRegistry: WidgetRegistry;
}

function buildRegistries(
  sortedApps: DiscoveredApp[],
  registry: SchemaRegistry,
  options: BootOptions,
): Registries {
  const allModules: import('@rangka/shared').ModuleConfig[] = [];
  for (const app of sortedApps) {
    if (app.modules) allModules.push(...app.modules);
  }

  return {
    hookRegistry: buildHookRegistry(sortedApps),
    permissionRegistry: buildPermissionRegistry(sortedApps, registry, options),
    jobRegistry: buildJobRegistry(sortedApps, options),
    eventBus: buildEventBus(sortedApps, options),
    serviceRegistry: buildServiceRegistry(sortedApps, options),
    fixtureRegistry: buildFixtureRegistry(sortedApps, options),
    scopeRegistry: new ScopeRegistry(allModules, registry),
    widgetRegistry: buildWidgetRegistry(sortedApps),
  };
}

function buildHookRegistry(sortedApps: DiscoveredApp[]): HookRegistry {
  const hookRegistry = new HookRegistry();
  for (const app of sortedApps) {
    if (!app.hooks) continue;
    for (const { model, hooks } of app.hooks) {
      hookRegistry.register(model, hooks, app.config.name);
    }
  }
  return hookRegistry;
}

function buildPermissionRegistry(
  sortedApps: DiscoveredApp[],
  registry: SchemaRegistry,
  options: BootOptions,
): PermissionRegistry {
  const permissionRegistry = new PermissionRegistry();

  // Administrator role gets full access to all models
  const adminModels: Record<string, Record<string, boolean>> = {};
  for (const model of registry.getAllModels()) {
    adminModels[model.qualifiedName] = {
      create: true,
      read: true,
      write: true,
      delete: true,
    };
  }
  permissionRegistry.registerRoles(
    { Administrator: { label: 'Administrator', models: adminModels } },
    'core',
  );

  // Register roles discovered from each app's modules/<name>/roles.ts
  for (const app of sortedApps) {
    if (!app.roles) continue;
    for (const { config, app: appName } of app.roles) {
      permissionRegistry.registerRoles(config, appName);
    }
  }

  // Register roles passed explicitly via boot options (override/legacy)
  if (options.roles) {
    for (const { config, app } of options.roles) {
      permissionRegistry.registerRoles(config, app);
    }
  }

  return permissionRegistry;
}

function buildJobRegistry(sortedApps: DiscoveredApp[], options: BootOptions): JobRegistry {
  const jobRegistry = new JobRegistry();

  for (const app of sortedApps) {
    if (!app.jobs) continue;
    for (const { name, config } of app.jobs) {
      jobRegistry.register(name, config);
    }
  }

  if (options.jobs) {
    for (const { name, config } of options.jobs) {
      if (!jobRegistry.has(name)) {
        jobRegistry.register(name, config);
      }
    }
  }

  return jobRegistry;
}

function buildEventBus(sortedApps: DiscoveredApp[], options: BootOptions): EventBus {
  const eventBus = new EventBus();
  const jobRegistry = buildJobRegistry(sortedApps, options);

  for (const job of jobRegistry.getAll()) {
    if (job.name.startsWith('__event:')) {
      const eventName = job.name.slice('__event:'.length);
      eventBus.on(eventName, async (payload: unknown) => {
        await job.config.handler(payload, {} as any);
      });
    }
  }

  return eventBus;
}

function buildServiceRegistry(sortedApps: DiscoveredApp[], options: BootOptions): ServiceRegistry {
  const serviceRegistry = new ServiceRegistry();

  for (const app of sortedApps) {
    if (!app.services) continue;
    for (const def of app.services) {
      if (!serviceRegistry.has(def.name)) {
        serviceRegistry.register(def);
      }
    }
  }

  if (options.services) {
    for (const def of options.services) {
      if (!serviceRegistry.has(def.name)) {
        serviceRegistry.register(def);
      }
    }
  }

  serviceRegistry.detectCircularDependencies();
  return serviceRegistry;
}

function buildFixtureRegistry(sortedApps: DiscoveredApp[], options: BootOptions): FixtureRegistry {
  const fixtureRegistry = new FixtureRegistry();

  for (const app of sortedApps) {
    if (!app.fixtures) continue;
    for (const def of app.fixtures) {
      fixtureRegistry.register(def);
    }
  }

  if (options.fixtures) {
    for (const def of options.fixtures) {
      fixtureRegistry.register(def);
    }
  }

  return fixtureRegistry;
}

// --- Phase 4: Database ---

async function initDatabase(
  options: BootOptions,
  registry: SchemaRegistry,
  eventBus: EventBus,
  jobRegistry: JobRegistry,
  serviceRegistry: ServiceRegistry,
) {
  const db = new DatabaseClient(options.database!, registry);
  const dialect = db.dialect;

  try {
    await db.verifyConnection();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Boot failed: ${message}`, { cause: err });
  }

  eventBus.setDialect(dialect);
  eventBus.setDb(db.kysely);

  if (!options.skipAutoSync) {
    await autoSync(registry, db.kysely, { dialect });
    await seedCoreData(db);
  }

  const frameworkContext = createFrameworkContext({
    db,
    schema: registry,
    eventBus,
    serviceRegistry,
    config: options.config ?? {},
  });

  let jobWorker: JobWorker | undefined;
  let scheduleManager: ScheduleManager | undefined;

  // Jobs require PostgreSQL (row-level locking for safe concurrent claiming)
  if (dialect === 'postgres' && options.worker?.enabled !== false) {
    jobWorker = new JobWorker(db.kysely, jobRegistry, frameworkContext, options.worker);
    scheduleManager = new ScheduleManager(db.kysely, jobRegistry);
    await scheduleManager.syncSchedules();
    jobWorker.start();
    scheduleManager.start();
  }

  return { db, frameworkContext, jobWorker, scheduleManager };
}

// --- Phase 5: Server ---

async function initServer(
  options: BootOptions,
  sortedApps: DiscoveredApp[],
  registry: SchemaRegistry,
  db: DatabaseClient,
  registries: Registries,
  adapterRegistry?: AdapterRegistry,
): Promise<{
  server: FastifyInstance;
  pages: Array<{ module: string; page: import('@rangka/shared').PageDefinition }>;
  modules: import('@rangka/shared').ModuleConfig[];
}> {
  const moduleTags = [...registry.getModelsByModule().keys()].map((name) => ({ name }));
  const server = await createServer({ ...options.server!, tags: moduleTags });

  const allPages: Array<{ module: string; page: import('@rangka/shared').PageDefinition }> = [];
  const allModules: import('@rangka/shared').ModuleConfig[] = [];

  for (const app of sortedApps) {
    if (app.pages) allPages.push(...app.pages);
    if (app.modules) allModules.push(...app.modules);
  }

  generateRoutes(server, registry, db, {
    permissionRegistry: registries.permissionRegistry,
    hookRegistry: registries.hookRegistry,
    serviceRegistry: registries.serviceRegistry,
    eventBus: registries.eventBus,
    scopeRegistry: registries.scopeRegistry,
    config: options.config ?? {},
    pages: allPages.length > 0 ? allPages : undefined,
    modules: allModules.length > 0 ? allModules : undefined,
    widgets: registries.widgetRegistry.getAll(),
    adapterRegistry,
  });

  for (const app of sortedApps) {
    if (!app.apiDefinitions) continue;
    for (const def of app.apiDefinitions) {
      server.route({ method: def.method, url: def.path, handler: def.handler });
    }
  }

  return { server, pages: allPages, modules: allModules };
}

function buildWidgetRegistry(sortedApps: DiscoveredApp[]): WidgetRegistry {
  const widgetRegistry = new WidgetRegistry();
  for (const app of sortedApps) {
    if (!app.widgets) continue;
    for (const widget of app.widgets) {
      widgetRegistry.register(widget);
    }
  }
  return widgetRegistry;
}
