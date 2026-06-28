import {
  ProjectScanner,
  MemoryDiscoverySource,
  boot,
  DiffEngine,
  SchemaToDesired,
  introspect,
  introspectSqlite,
  SqliteDiffEngine,
  buildSqliteDesiredState,
  seedCoreData,
  validatePageBindings,
} from '@rangka/core';
import type { BootResult, CoreDdlOperation } from '@rangka/core';
import type { AppConfig } from '@rangka/shared';
import fastifyStatic from '@fastify/static';
import { sql } from 'kysely';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { createRequire } from 'node:module';
import type {
  ChildMessage,
  ParentMessage,
  ChildPhase,
  RuntimeStatus,
  SerializedDdlOperation,
  ChildStatusSnapshot,
  IntrospectType,
  DatabaseConfig,
  DdlOperationType,
} from './ipc-protocol.js';

const projectRoot = process.env.RANGKA_PROJECT_ROOT!;
const frameworkPort = parseInt(process.env.RANGKA_FRAMEWORK_PORT || '3000', 10);

if (!projectRoot) {
  send({ type: 'child:boot_error', error: 'RANGKA_PROJECT_ROOT not set', phase: 'resolving' });
  process.exit(1);
}

let bootResult: BootResult | null = null;
let currentPhase: ChildPhase = 'stopped';
let sessionToken: string | null = null;
let pendingOps: SerializedDdlOperation[] = [];
let serverPort: number | null = null;
let lastError: string | null = null;
let dbConfig: DatabaseConfig | null = null;
let pages: Array<{ app: string; page: unknown }> = [];
let apps: AppConfig[] = [];
let hooks: Array<{ model: string }> = [];

function send(msg: ChildMessage): void {
  if (process.send) {
    process.send(msg);
  }
}

function setPhase(phase: ChildPhase): void {
  currentPhase = phase;
  send({ type: 'child:phase', phase });
}

process.on('message', (msg: ParentMessage) => {
  switch (msg.type) {
    case 'parent:get_status':
      handleGetStatus(msg.requestId);
      break;
    case 'parent:introspect':
      handleIntrospect(msg.requestId, msg.resource, msg.app);
      break;
    case 'parent:shutdown':
      handleShutdown();
      break;
    case 'parent:sync_approve':
      handleSyncApprove(msg.operationIds);
      break;
    case 'parent:sync_reject':
      handleSyncReject(msg.reason);
      break;
  }
});

function handleGetStatus(requestId: string): void {
  const status: ChildStatusSnapshot = {
    phase: currentPhase,
    runtime: bootResult ? getRuntimeStatus() : null,
    pendingOps,
    serverPort,
    sessionToken,
    error: lastError,
  };
  send({ type: 'child:status_response', requestId, status });
}

function getRuntimeStatus(): RuntimeStatus {
  if (!bootResult) {
    return { models: 0, pages: 0, services: 0, hooks: 0, jobs: 0, apps: [] };
  }
  return {
    models: bootResult.registry.getAllModels().length,
    pages: pages.length,
    services: bootResult.serviceRegistry?.getAll?.()?.length ?? 0,
    hooks: hooks.length,
    jobs: bootResult.jobRegistry?.getAll?.()?.length ?? 0,
    apps: apps.map((m) => m.name),
  };
}

function handleIntrospect(requestId: string, type: IntrospectType, app?: string): void {
  if (!bootResult) {
    send({ type: 'child:introspect_error', requestId, error: 'Framework not booted yet.' });
    return;
  }

  try {
    const result = introspectResource(type, app);
    if ('error' in result) {
      send({ type: 'child:introspect_error', requestId, error: result.error });
    } else {
      send({
        type: 'child:introspect_response',
        requestId,
        data: result.data,
        count: result.count,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    send({ type: 'child:introspect_error', requestId, error: message });
  }
}

function introspectResource(
  type: IntrospectType,
  app?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): { data: any[]; count: number } | { error: string } {
  if (!bootResult) return { error: 'Framework not booted yet.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filterByApp = (items: any[], key = 'app') =>
    app ? items.filter((i) => i[key] === app) : items;

  switch (type) {
    case 'models': {
      const allModels = bootResult.registry.getAllModels();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filtered = filterByApp(allModels as any[]);

      const resolveTarget = (name: string, currentModule: string): string => {
        if (name.includes('.')) return name;
        const qualified = `${currentModule}.${name}`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((allModels as any[]).find((m: any) => m.qualifiedName === qualified)) return qualified;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const elsewhere = (allModels as any[]).find((m: any) => m.name === name);
        if (elsewhere) return elsewhere.qualifiedName;
        return qualified;
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = filtered.map((model: any) => ({
        qualifiedName: `${model.app}.${model.name}`,
        label: model.label ?? model.name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fields: model.fields.map((f: any) => {
          const base: Record<string, unknown> = {
            name: f.name,
            type: f.config?.type ?? 'unknown',
            required: f.config?.required ?? false,
          };
          const cfg = f.config;
          if (cfg) {
            if (cfg.type === 'link') base.target = resolveTarget(cfg.model, model.app);
            if (cfg.type === 'hasMany') {
              base.target = resolveTarget(cfg.model, model.app);
              base.foreignKey = cfg.foreignKey;
            }
            if (cfg.type === 'children') {
              base.target = resolveTarget(cfg.model, model.app);
              base.foreignKey = cfg.foreignKey;
            }
            if (cfg.type === 'manyToMany') {
              base.target = resolveTarget(cfg.model, model.app);
              base.through = cfg.through;
            }
            if (cfg.type === 'dynamicLink') base.modelField = cfg.modelField;
            if (cfg.type === 'enum') base.options = cfg.options;
          }
          return base;
        }),
        traits: model.traits ?? [],
      }));
      return { data, count: data.length };
    }

    case 'pages': {
      const allPages = bootResult.pages ?? [];
      const filtered = filterByApp(allPages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = filtered.map((p: any) => ({
        key: p.page?.key ?? `${p.app}.${p.page?.name}`,
        module: p.app,
        type: p.page?.type,
        model: p.page?.model,
        label: p.page?.label ?? p.page?.title,
      }));
      return { data, count: data.length };
    }

    case 'services': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const services = (bootResult.serviceRegistry as any)?.getAll?.() ?? [];
      const data = services.map((s: { name: string; app?: string }) => ({
        name: s.name,
        app: s.app,
      }));
      const filtered = filterByApp(data);
      return { data: filtered, count: filtered.length };
    }

    case 'hooks': {
      const hookItems = hooks.map((h) => {
        const parts = h.model.split('.');
        return { model: h.model, app: parts.length > 1 ? parts[0] : 'core' };
      });
      const filtered = filterByApp(hookItems);
      return { data: filtered, count: filtered.length };
    }

    case 'roles': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const permissionRegistry = bootResult.permissionRegistry as any;
      if (!permissionRegistry?.getAllRoles) {
        return { error: 'Role introspection not available.' };
      }
      const roles = permissionRegistry.getAllRoles();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = roles.map((r: any) => ({
        name: r.name,
        label: r.label ?? r.name,
        inherits: r.inherits ?? [],
      }));
      return { data, count: data.length };
    }

    case 'jobs': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jobRegistry = bootResult.jobRegistry as any;
      if (!jobRegistry?.getAll) {
        return { error: 'Job introspection not available.' };
      }
      const jobs = jobRegistry.getAll();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = jobs.map((j: any) => ({
        name: j.name,
        module: j.app,
        schedule: j.schedule,
      }));
      const filtered = filterByApp(data);
      return { data: filtered, count: filtered.length };
    }

    case 'fixtures': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fixtureRegistry = bootResult.fixtureRegistry as any;
      if (!fixtureRegistry?.getAll) {
        return { error: 'Fixture introspection not available.' };
      }
      const fixtures = fixtureRegistry.getAll();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = fixtures.map((f: any) => ({
        model: f.model,
        module: f.app,
        recordCount: f.records?.length ?? 0,
      }));
      const filtered = filterByApp(data);
      return { data: filtered, count: filtered.length };
    }

    case 'widgets': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const widgetRegistry = bootResult.widgetRegistry as any;
      if (!widgetRegistry?.getAll) {
        return { error: 'Widget introspection not available.' };
      }
      const widgets = widgetRegistry.getAll();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = widgets.map((w: any) => ({
        name: w.name,
        label: w.label ?? w.name,
        props: w.props ?? [],
      }));
      return { data, count: data.length };
    }

    case 'apps': {
      const data = apps.map((m) => ({
        name: m.name,
        label: m.label ?? m.name,
        icon: m.icon,
        color: m.color,
      }));
      return { data, count: data.length };
    }

    case 'navigation': {
      const filtered = app ? apps.filter((m) => m.name === app) : apps;
      const data = filtered.map((m) => ({
        app: m.name,
        navigation: m.navigation,
      }));
      return { data, count: data.length };
    }
  }
}

async function handleShutdown(): Promise<void> {
  if (bootResult?.server) {
    await bootResult.server.close();
  }
  if (bootResult?.db) {
    await bootResult.db.destroy();
  }
  process.exit(0);
}

let syncGateResolve: ((result: { approved: boolean; operationIds: string[] }) => void) | null =
  null;

function handleSyncApprove(operationIds: string[]): void {
  if (syncGateResolve) {
    syncGateResolve({ approved: true, operationIds });
    syncGateResolve = null;
  }
}

function handleSyncReject(_reason?: string): void {
  if (syncGateResolve) {
    syncGateResolve({ approved: false, operationIds: [] });
    syncGateResolve = null;
  }
}

function waitForSyncDecision(): Promise<{ approved: boolean; operationIds: string[] }> {
  return new Promise((resolve) => {
    syncGateResolve = resolve;

    process.once('disconnect', () => {
      if (syncGateResolve) {
        syncGateResolve({ approved: false, operationIds: [] });
        syncGateResolve = null;
      }
    });
  });
}

async function main(): Promise<void> {
  try {
    // Step 1: Resolve
    setPhase('resolving');
    const scanner = new ProjectScanner(projectRoot);
    const { app, rangkaConfig, warnings: scanWarnings } = await scanner.scan();

    pages = app.pages ?? [];
    apps = app.config ? [app.config] : [];
    hooks = (app.hooks ?? []).map((h) => ({ model: h.model }));

    const rawDbConfig = rangkaConfig.database;
    let bootDatabase: import('@rangka/core').DatabaseClientConfig;

    if (!rawDbConfig || rawDbConfig.dialect === 'sqlite') {
      // Default to SQLite for zero-config dev/Studio usage
      const sqlitePath = (rawDbConfig as { path?: string } | undefined)?.path ?? '.rangka/dev.db';
      bootDatabase = { dialect: 'sqlite', path: sqlitePath };
      dbConfig = { dialect: 'sqlite', path: sqlitePath };
    } else {
      // PostgreSQL config (dialect: 'pg' in rangka.config.ts)
      const pgConfig = {
        dialect: 'postgres' as const,
        host: rawDbConfig.host ?? 'localhost',
        port: rawDbConfig.port ?? 5432,
        database: rawDbConfig.database ?? 'rangka',
        user: rawDbConfig.user ?? 'postgres',
        password: rawDbConfig.password ?? '',
      };
      bootDatabase = {
        host: pgConfig.host,
        port: pgConfig.port,
        database: pgConfig.database,
        user: pgConfig.user,
        password: pgConfig.password,
      };
      dbConfig = pgConfig;
    }

    bootResult = await boot({
      discoverySource: new MemoryDiscoverySource([]),
      apps: [app],
      database: bootDatabase,
      skipAutoSync: true,
      server: { port: frameworkPort },
    });

    // Validate page bindings post-boot (requires registry)
    if (pages.length > 0) {
      const bindWarnings = validatePageBindings(
        pages as Array<{
          app: string;
          page: import('@rangka/shared').PageDefinition;
          file?: string;
        }>,
        bootResult.registry,
      );
      for (const w of bindWarnings) {
        const location = w.file ? `modules/${w.pageKey.split('.')[0]}/pages/${w.file}` : w.pageKey;
        scanWarnings.push({
          file: location,
          message: `${w.pageKey} (${w.location}): ${w.message}`,
        });
      }
    }

    // Step 2: Introspect
    setPhase('introspecting');
    const registry = bootResult.registry;
    const db = bootResult.db!;
    const isSqlite = dbConfig?.dialect === 'sqlite';

    const desired = isSqlite
      ? buildSqliteDesiredState(registry)
      : new SchemaToDesired().convert(registry);
    const actual = isSqlite ? await introspectSqlite(db.kysely) : await introspect(db.kysely);
    const coreOps = isSqlite
      ? new SqliteDiffEngine().diff(desired, actual)
      : new DiffEngine().diff(desired, actual);

    const safeOps: SerializedDdlOperation[] = coreOps
      .filter((op: CoreDdlOperation) => !op.destructive)
      .map((op: CoreDdlOperation) => ({
        id: crypto.randomUUID(),
        type: op.type.toLowerCase() as DdlOperationType,
        table: op.table,
        ddl: op.sql,
        destructive: false,
        detail: op.detail,
      }));

    pendingOps = safeOps;

    // Step 3: Sync gate
    if (safeOps.length > 0) {
      setPhase('waiting_for_sync');
      send({
        type: 'child:sync_pending',
        operations: safeOps,
        status: getRuntimeStatus(),
        dbConfig: dbConfig!,
        warnings: scanWarnings,
      });

      const decision = await waitForSyncDecision();

      if (decision.approved) {
        setPhase('syncing');
        const appliedIds: string[] = [];

        for (const id of decision.operationIds) {
          const op = safeOps.find((o) => o.id === id);
          if (!op) continue;

          try {
            await sql.raw(op.ddl).execute(db.kysely);
            appliedIds.push(id);
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            send({
              type: 'child:sync_error',
              error: `Failed on ${op.table}: ${message}`,
              appliedIds,
            });
            pendingOps = safeOps.filter((o) => !appliedIds.includes(o.id));
            break;
          }
        }

        if (appliedIds.length === decision.operationIds.length) {
          send({ type: 'child:sync_applied', appliedIds });
          pendingOps = [];
        }
      } else {
        pendingOps = [];
      }
    }

    // Step 4: Serve
    await seedCoreData(db);
    await createStudioSession(db);
    await serveClientShell();

    serverPort = frameworkPort;
    await bootResult.server!.listen({ port: frameworkPort });

    setPhase('serving');
    send({ type: 'child:serving', port: frameworkPort });
    send({
      type: 'child:boot_success',
      status: getRuntimeStatus(),
      sessionToken,
      dbConfig: dbConfig!,
      warnings: scanWarnings,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const details = err instanceof Error ? err.stack : undefined;
    lastError = message;
    send({ type: 'child:boot_error', error: message, phase: currentPhase, details });
    process.exit(1);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createStudioSession(db: any): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (await (db as any)
    .selectFrom('core.user')
    .selectAll()
    .where('email', '=', 'system@rangka.local')
    .executeTakeFirst()) as { id: string } | undefined;

  if (!user) {
    send({
      type: 'child:log',
      level: 'warn',
      message: 'Admin user not found, preview will require manual login',
    });
    return;
  }

  const { randomBytes } = await import('node:crypto');
  const token = randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any)
    .insertInto('core.session')
    .values({
      id: crypto.randomUUID(),
      token,
      user_id: user.id,
      expires_at: expiresAt.toISOString(),
      created_at: now.toISOString(),
    })
    .execute();

  sessionToken = token;
  send({ type: 'child:log', level: 'info', message: 'Auto-authenticated as system@rangka.local' });
}

async function serveClientShell(): Promise<void> {
  if (!bootResult?.server) return;

  const server = bootResult.server;
  const token = sessionToken;

  server.get('/__studio/init', async (request, reply) => {
    const redirect = (request.query as { redirect?: string }).redirect || '/';
    const html = `<!DOCTYPE html><html><head><script>
localStorage.setItem('rangka:token',${JSON.stringify(token ?? '')});
window.location.replace(${JSON.stringify(redirect)});
</script></head><body></body></html>`;
    return reply.type('text/html').send(html);
  });

  const shellDir = resolveShellDir();
  await server.register(fastifyStatic, {
    root: shellDir,
    wildcard: false,
    prefix: '/',
  });

  const rangkaDir = path.join(projectRoot, '.rangka');
  if (fs.existsSync(rangkaDir)) {
    await server.register(fastifyStatic, {
      root: rangkaDir,
      prefix: '/_rangka/',
      decorateReply: false,
    });
  }

  server.setNotFoundHandler((_req, reply) => {
    return reply.sendFile('index.html');
  });
}

function resolveShellDir(): string {
  const require = createRequire(import.meta.url);

  try {
    const lookupPaths = require.resolve.paths('@rangka/client') ?? [];
    for (const base of lookupPaths) {
      const candidate = path.join(base, '@rangka', 'client', 'dist', 'shell');
      if (fs.existsSync(path.join(candidate, 'index.html'))) {
        return fs.realpathSync(candidate);
      }
    }
  } catch {
    /* lookup failed */
  }

  throw new Error('Missing shell build. Run `pnpm build` in @rangka/client first.');
}

main();
