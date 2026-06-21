import {
  ProjectScanner,
  MemoryDiscoverySource,
  boot,
  DiffEngine,
  SchemaToDesired,
  introspect,
  SchemaRegistry,
  loadSchemas,
  mergeSchemas,
  getCoreModels,
  getCoreApp,
} from '@rangka/core';
import type { BootResult, CoreDdlOperation } from '@rangka/core';
import type { PageDefinition, ModuleConfig } from '@rangka/shared';
import type {
  ResourceModule,
  ResourceItem,
  ModelGraphData,
  ModelGraphNode,
  ModelGraphEdge,
  DdlOperation,
} from './protocol.js';
import fastifyStatic from '@fastify/static';
import { sql } from 'kysely';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { createRequire } from 'node:module';

export interface RuntimeManagerConfig {
  projectRoot: string;
  frameworkPort?: number;
}

export class RuntimeManager {
  private config: RuntimeManagerConfig;
  private bootResult: BootResult | null = null;
  private sessionToken: string | null = null;
  private pages: Array<{ module: string; page: PageDefinition }> = [];
  private modules: ModuleConfig[] = [];
  private hooks: Array<{ model: string }> = [];
  private pendingOperations: Map<string, DdlOperation> = new Map();
  private serverPort: number = 3000;
  private rangkaStaticRegistered: boolean = false;

  constructor(config: RuntimeManagerConfig) {
    this.config = config;
  }

  async boot(): Promise<void> {
    const scanner = new ProjectScanner(this.config.projectRoot);
    const { app, rangkaConfig } = await scanner.scan();

    this.pages = app.pages ?? [];
    this.modules = app.modules ?? [];
    this.hooks = (app.hooks ?? []).map((h) => ({ model: h.model }));

    const dbConfig = rangkaConfig.database;
    if (!dbConfig) {
      throw new Error('No database config found. Add database settings to rangka.config.ts');
    }

    const databaseConfig = {
      host: dbConfig.host ?? 'localhost',
      port: dbConfig.port ?? 5432,
      database: dbConfig.database ?? 'rangka',
      user: dbConfig.user ?? 'postgres',
      password: dbConfig.password ?? '',
    };

    const serverPort = this.config.frameworkPort ?? rangkaConfig.server?.port ?? 3000;
    this.serverPort = serverPort;

    this.bootResult = await boot({
      discoverySource: new MemoryDiscoverySource([]),
      apps: [app],
      database: databaseConfig,
      skipAutoSync: true,
      server: { port: serverPort },
    });

    await this.computeDiff();
    await this.createStudioSession();
    await this.serveClientShell();
    await this.bootResult.server!.listen({ port: serverPort });
  }

  private async createStudioSession(): Promise<void> {
    if (!this.bootResult?.db) return;

    const db = this.bootResult.db;

    const user = (await db
      .selectFrom('core.user')
      .selectAll()
      .where('email', '=', 'system@rangka.local')
      .executeTakeFirst()) as { id: string } | undefined;

    if (!user) {
      console.warn(`[studio] Admin user not found, preview will require manual login`);
      return;
    }

    const { randomBytes } = await import('node:crypto');
    const token = randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await db
      .insertInto('core.session')
      .values({
        id: crypto.randomUUID(),
        token,
        user_id: user.id,
        expires_at: expiresAt.toISOString(),
        created_at: now.toISOString(),
      })
      .execute();

    this.sessionToken = token;
    console.log(`[studio] Auto-authenticated as system@rangka.local`);
  }

  private async serveClientShell(): Promise<void> {
    if (!this.bootResult?.server) return;

    const server = this.bootResult.server;
    const token = this.sessionToken;

    // Studio bootstrap endpoint — sets auth token in localStorage and redirects to app
    server.get('/__studio/init', async (request, reply) => {
      const redirect = (request.query as { redirect?: string }).redirect || '/';
      const html = `<!DOCTYPE html><html><head><script>
localStorage.setItem('rangka:token','${token ?? ''}');
window.location.replace('${redirect}');
</script></head><body></body></html>`;
      return reply.type('text/html').send(html);
    });

    const shellDir = this.resolveShellDir();
    await server.register(fastifyStatic, {
      root: shellDir,
      wildcard: false,
      prefix: '/',
    });

    const rangkaDir = path.join(this.config.projectRoot, '.rangka');
    if (fs.existsSync(rangkaDir)) {
      await server.register(fastifyStatic, {
        root: rangkaDir,
        prefix: '/_rangka/',
        decorateReply: false,
      });
      this.rangkaStaticRegistered = true;
    }

    server.setNotFoundHandler((_req, reply) => {
      return reply.sendFile('index.html');
    });
  }

  private resolveShellDir(): string {
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

  async registerRangkaStatic(): Promise<void> {
    if (this.rangkaStaticRegistered) return;
    if (!this.bootResult?.server) return;

    const rangkaDir = path.join(this.config.projectRoot, '.rangka');
    if (!fs.existsSync(rangkaDir)) return;

    await this.bootResult.server.register(fastifyStatic, {
      root: rangkaDir,
      prefix: '/_rangka/',
      decorateReply: false,
    });
    this.rangkaStaticRegistered = true;
  }

  getSessionToken(): string | null {
    return this.sessionToken;
  }

  getBaseUrl(): string {
    return `http://localhost:${this.serverPort}`;
  }

  getStatus(): { models: number; pages: number; services: number } {
    if (!this.bootResult) {
      return { models: 0, pages: 0, services: 0 };
    }
    return {
      models: this.bootResult.registry.getAllModels().length,
      pages: this.pages.length,
      services: this.bootResult.serviceRegistry?.getAll?.()?.length ?? 0,
    };
  }

  getResources(): ResourceModule[] {
    if (!this.bootResult) return [];

    const moduleMap = new Map<string, ResourceItem[]>();

    const ensureModule = (name: string) => {
      if (!moduleMap.has(name)) moduleMap.set(name, []);
      return moduleMap.get(name)!;
    };

    for (const [moduleName, models] of this.bootResult.registry.getModelsByModule()) {
      const items = ensureModule(moduleName);
      for (const model of models) {
        items.push({ name: model.name, type: 'model' });
      }
    }

    for (const { module: moduleName, page } of this.pages) {
      const items = ensureModule(moduleName);
      items.push({ name: page.key.split('.').pop() ?? page.key, type: 'page' });
    }

    for (const service of this.bootResult.serviceRegistry?.getAll?.() ?? []) {
      const parts = service.name.split('.');
      const moduleName = parts.length > 1 ? parts[0] : 'core';
      const items = ensureModule(moduleName);
      items.push({ name: parts.slice(1).join('.') || service.name, type: 'service' });
    }

    for (const hook of this.hooks) {
      const parts = hook.model.split('.');
      const moduleName = parts.length > 1 ? parts[0] : 'core';
      const items = ensureModule(moduleName);
      items.push({ name: parts.slice(1).join('.') || hook.model, type: 'hook' });
    }

    const localModuleNames = new Set(this.modules.map((m) => m.name));

    const result: ResourceModule[] = [];
    for (const [name, resources] of moduleMap) {
      const mod = this.modules.find((m) => m.name === name);
      const source = name === 'core' ? 'core' : localModuleNames.has(name) ? 'local' : 'external';
      result.push({ name, label: mod?.label, source, resources });
    }

    return result;
  }

  getModelGraph(): ModelGraphData {
    if (!this.bootResult) return { nodes: [], edges: [] };

    const registry = this.bootResult.registry;
    const models = registry.getAllModels();
    const relationships = registry.getRelationships();

    const nodes: ModelGraphNode[] = models.map((model) => ({
      id: model.qualifiedName,
      label: model.label ?? model.name,
      module: model.module,
      fields: model.fields
        .filter((f) => f.config.type !== 'computed')
        .map((f) => ({
          name: f.name,
          type: f.config.type,
          nullable: 'required' in f.config ? !f.config.required : true,
        })),
    }));

    const edges: ModelGraphEdge[] = relationships
      .filter((r) => r.type !== 'dynamicLink')
      .map((r) => {
        if (r.type === 'link') {
          // link: "from" holds the FK field, "to" is the parent
          return {
            id: `${r.from}.${r.field}->${r.to}`,
            source: r.to,
            sourceField: '__node',
            target: r.from,
            targetField: r.field,
            type: r.type as ModelGraphEdge['type'],
          };
        }
        // hasMany/children: "from" is the parent, "to" holds the FK
        return {
          id: `${r.from}.${r.field}->${r.to}`,
          source: r.from,
          sourceField: '__node',
          target: r.to,
          targetField: r.foreignKey ?? `${r.from.split('.').pop()}_id`,
          type: r.type as ModelGraphEdge['type'],
        };
      });

    return { nodes, edges };
  }

  getBootResult(): BootResult | null {
    return this.bootResult;
  }

  getProjectRoot(): string {
    return this.config.projectRoot;
  }

  async rescan(): Promise<{ success: boolean; error?: string; operations?: DdlOperation[] }> {
    try {
      const scanner = new ProjectScanner(this.config.projectRoot);
      const { app } = await scanner.scan();

      this.pages = app.pages ?? [];
      this.modules = app.modules ?? [];
      this.hooks = (app.hooks ?? []).map((h) => ({ model: h.model }));

      if (this.bootResult?.pages) {
        this.bootResult.pages.length = 0;
        this.bootResult.pages.push(...this.pages);
      }
      if (this.bootResult?.modules) {
        this.bootResult.modules.length = 0;
        this.bootResult.modules.push(...this.modules);
      }

      // Rebuild registry from rescanned app so new/modified models are detected
      if (this.bootResult) {
        const coreApp = getCoreApp();
        const allApps = [coreApp, app];
        const loadResult = loadSchemas(allApps);
        const mergeResult = mergeSchemas(loadResult);
        const coreModels = getCoreModels();
        const existingNames = new Set(mergeResult.models.map((m) => m.qualifiedName));
        const missingCoreModels = coreModels.filter((m) => !existingNames.has(m.qualifiedName));
        this.bootResult.registry = new SchemaRegistry([
          ...missingCoreModels,
          ...mergeResult.models,
        ]);
      }

      const operations = await this.computeDiff();
      return { success: true, operations };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  }

  private async computeDiff(): Promise<DdlOperation[]> {
    if (!this.bootResult?.db) return [];

    const registry = this.bootResult.registry;
    const db = this.bootResult.db;

    const desired = new SchemaToDesired().convert(registry);
    const actual = await introspect(db.kysely);
    const coreOps = new DiffEngine().diff(desired, actual);

    this.pendingOperations.clear();
    const operations: DdlOperation[] = coreOps.map((op: CoreDdlOperation) => {
      const protocolOp: DdlOperation = {
        id: crypto.randomUUID(),
        type: op.type.toLowerCase() as DdlOperation['type'],
        table: op.table,
        ddl: op.sql,
        destructive: op.destructive,
        detail: op.detail,
      };
      this.pendingOperations.set(protocolOp.id, protocolOp);
      return protocolOp;
    });

    return operations;
  }

  async applyOperations(ids: string[]): Promise<{ applied: string[]; error?: string }> {
    if (!this.bootResult?.db) {
      return { applied: [], error: 'Database not available' };
    }

    const db = this.bootResult.db;
    const applied: string[] = [];

    for (const id of ids) {
      const op = this.pendingOperations.get(id);
      if (!op) continue;

      try {
        await sql.raw(op.ddl).execute(db.kysely);
        this.pendingOperations.delete(id);
        applied.push(id);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { applied, error: `Failed on ${op.table}: ${message}` };
      }
    }

    return { applied };
  }

  rejectOperations(): void {
    this.pendingOperations.clear();
  }

  getPendingOperations(): DdlOperation[] {
    return Array.from(this.pendingOperations.values());
  }

  async shutdown(): Promise<void> {
    if (!this.bootResult) return;
    if (this.bootResult.server) {
      await this.bootResult.server.close();
    }
    if (this.bootResult.db) {
      await this.bootResult.db.destroy();
    }
    this.bootResult = null;
  }
}
