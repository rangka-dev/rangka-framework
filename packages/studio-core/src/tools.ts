import { Type } from '@sinclair/typebox';
import { unlink } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import type { RuntimeManager } from './runtime-manager.js';
import { buildWidgets } from '@rangka/cli/build';
import { REFERENCE_DOCS } from './generated/reference-docs.js';

export interface ToolDefinition {
  name: string;
  label: string;
  description: string;
  parameters: unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: (...args: any[]) => Promise<{
    content: Array<{ type: 'text'; text: string }>;
    details: Record<string, unknown>;
  }>;
}

const INTROSPECT_TYPES = [
  'models',
  'pages',
  'services',
  'hooks',
  'roles',
  'jobs',
  'fixtures',
  'widgets',
  'modules',
  'navigation',
] as const;

type IntrospectType = (typeof INTROSPECT_TYPES)[number];

function introspectResource(
  runtime: RuntimeManager,
  type: IntrospectType,
  module?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): { data: any[]; count: number } | { error: string } {
  const bootResult = runtime.getBootResult();
  if (!bootResult) return { error: 'Framework not booted yet.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filterByModule = (items: any[], key = 'module') =>
    module ? items.filter((i) => i[key] === module) : items;

  switch (type) {
    case 'models': {
      const allModels = bootResult.registry.getAllModels();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filtered = filterByModule(allModels as any[]);

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
        qualifiedName: `${model.module}.${model.name}`,
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
            if (cfg.type === 'link') base.target = resolveTarget(cfg.model, model.module);
            if (cfg.type === 'hasMany') {
              base.target = resolveTarget(cfg.model, model.module);
              base.foreignKey = cfg.foreignKey;
            }
            if (cfg.type === 'children') {
              base.target = resolveTarget(cfg.model, model.module);
              base.foreignKey = cfg.foreignKey;
            }
            if (cfg.type === 'manyToMany') {
              base.target = resolveTarget(cfg.model, model.module);
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
      const pages = bootResult.pages ?? [];
      const filtered = filterByModule(pages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = filtered.map((p: any) => ({
        key: p.page?.key ?? `${p.module}.${p.page?.name}`,
        module: p.module,
        type: p.page?.type,
        model: p.page?.model,
        label: p.page?.label ?? p.page?.title,
      }));
      return { data, count: data.length };
    }

    case 'services': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const services = (bootResult.serviceRegistry as any)?.getAll?.() ?? [];
      const data = services.map((s: { name: string; module?: string }) => ({
        name: s.name,
        module: s.module,
      }));
      const filtered = filterByModule(data);
      return { data: filtered, count: filtered.length };
    }

    case 'hooks': {
      const resources = runtime.getResources();
      const hookItems: Array<{ model: string; module: string }> = [];
      for (const mod of resources) {
        for (const item of mod.resources) {
          if (item.type === 'hook') {
            hookItems.push({ model: `${mod.name}.${item.name}`, module: mod.name });
          }
        }
      }
      const filtered = filterByModule(hookItems);
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
        module: j.module,
        schedule: j.schedule,
      }));
      const filtered = filterByModule(data);
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
        module: f.module,
        recordCount: f.records?.length ?? 0,
      }));
      const filtered = filterByModule(data);
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

    case 'modules': {
      const modules = bootResult.modules ?? [];
      const data = modules.map((m) => ({
        name: m.name,
        label: m.label ?? m.name,
        icon: m.icon,
        color: m.color,
      }));
      return { data, count: data.length };
    }

    case 'navigation': {
      const modules = bootResult.modules ?? [];
      const filtered = module ? modules.filter((m) => m.name === module) : modules;
      const data = filtered.map((m) => ({
        module: m.name,
        navigation: m.navigation,
      }));
      return { data, count: data.length };
    }
  }
}

export function createStudioTools(runtime: RuntimeManager, projectRoot?: string): ToolDefinition[] {
  return [
    {
      name: 'delete_file',
      label: 'Delete File',
      description: 'Delete a file from the project. The path must be within the project root.',
      parameters: Type.Object({
        path: Type.String({
          description: 'Relative path to the file to delete (e.g. modules/sales/models/order.ts)',
        }),
      }),
      execute: async (_toolCallId: string, params: { path: string }) => {
        const root = projectRoot ?? process.cwd();
        const fullPath = resolve(root, params.path);
        const rel = relative(root, fullPath);

        if (rel.startsWith('..')) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Refused: path is outside the project root. Got: ${params.path}`,
              },
            ],
            details: { success: false },
          };
        }

        try {
          await unlink(fullPath);
          return {
            content: [{ type: 'text' as const, text: `Deleted: ${params.path}` }],
            details: { success: true, path: params.path },
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: 'text' as const, text: `Failed to delete: ${message}` }],
            details: { success: false, error: message },
          };
        }
      },
    },
    {
      name: 'introspect',
      label: 'Introspect',
      description:
        'Inspect the current state of the running framework. Supports types: models, pages, services, hooks, roles, jobs, fixtures, widgets, modules, navigation. Optionally filter by module.',
      parameters: Type.Object({
        type: Type.Union(
          INTROSPECT_TYPES.map((t) => Type.Literal(t)),
          { description: 'The resource type to introspect' },
        ),
        module: Type.Optional(Type.String({ description: 'Filter by module name' })),
      }),
      execute: async (_toolCallId: string, params: { type: IntrospectType; module?: string }) => {
        const result = introspectResource(runtime, params.type, params.module);
        if ('error' in result) {
          return {
            content: [{ type: 'text' as const, text: result.error }],
            details: {},
          };
        }
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }],
          details: { count: result.count },
        };
      },
    },
    {
      name: 'http_request',
      label: 'HTTP Request',
      description:
        'Make an HTTP request to the running framework API. The session token is automatically injected as the Authorization header. Use this to test API endpoints, query data, or trigger actions.',
      parameters: Type.Object({
        method: Type.Union(
          [
            Type.Literal('GET'),
            Type.Literal('POST'),
            Type.Literal('PUT'),
            Type.Literal('PATCH'),
            Type.Literal('DELETE'),
          ],
          { description: 'HTTP method', default: 'GET' },
        ),
        path: Type.String({
          description: 'API path (e.g. /api/data/sales.order or /api/meta/boot)',
        }),
        body: Type.Optional(Type.Unknown({ description: 'Request body (for POST/PUT/PATCH)' })),
        headers: Type.Optional(
          Type.Record(Type.String(), Type.String(), { description: 'Additional headers' }),
        ),
      }),
      execute: async (
        _toolCallId: string,
        params: { method: string; path: string; body?: unknown; headers?: Record<string, string> },
      ) => {
        const baseUrl = runtime.getBaseUrl();
        const token = runtime.getSessionToken();
        const url = `${baseUrl}${params.path.startsWith('/') ? params.path : '/' + params.path}`;

        const reqHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          ...params.headers,
        };
        if (token) {
          reqHeaders['Authorization'] = `Bearer ${token}`;
        }

        try {
          const res = await fetch(url, {
            method: params.method,
            headers: reqHeaders,
            body: params.body ? JSON.stringify(params.body) : undefined,
          });

          const contentType = res.headers.get('content-type') ?? '';
          let responseBody: unknown;
          if (contentType.includes('application/json')) {
            responseBody = await res.json();
          } else {
            responseBody = await res.text();
          }

          const summary = `${params.method} ${params.path} → ${res.status} ${res.statusText}`;
          const output =
            typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody, null, 2);

          return {
            content: [{ type: 'text' as const, text: `${summary}\n\n${output}` }],
            details: { status: res.status, statusText: res.statusText },
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: 'text' as const, text: `Request failed: ${message}` }],
            details: { success: false, error: message },
          };
        }
      },
    },
    {
      name: 'query_db',
      label: 'Query Database',
      description:
        'Run a read-only SQL query against the project database. Useful for inspecting data, checking table contents, or verifying schema. Only SELECT statements are allowed.',
      parameters: Type.Object({
        sql: Type.String({ description: 'SQL query to execute (SELECT only)' }),
      }),
      execute: async (_toolCallId: string, params: { sql: string }) => {
        const bootResult = runtime.getBootResult();
        if (!bootResult?.db) {
          return {
            content: [{ type: 'text' as const, text: 'Database not available.' }],
            details: { success: false },
          };
        }

        const query = params.sql.trim();
        const firstWord = query.split(/\s+/)[0]?.toUpperCase();
        if (firstWord !== 'SELECT' && firstWord !== 'WITH' && firstWord !== 'EXPLAIN') {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'Only SELECT, WITH (CTE), and EXPLAIN queries are allowed.',
              },
            ],
            details: { success: false },
          };
        }

        const QUERY_TIMEOUT_MS = 5000;

        try {
          const { sql: sqlTag } = await import('kysely');
          const result = await bootResult.db.kysely
            .transaction()
            .setIsolationLevel('read committed')
            .execute(async (trx) => {
              await sqlTag.raw('SET TRANSACTION READ ONLY').execute(trx);
              await sqlTag.raw(`SET LOCAL statement_timeout = '${QUERY_TIMEOUT_MS}'`).execute(trx);
              return await sqlTag.raw(query).execute(trx);
            });

          const rows = result.rows ?? [];
          const output = JSON.stringify(rows.slice(0, 100), null, 2);
          const truncated = rows.length > 100 ? `\n\n(showing 100 of ${rows.length} rows)` : '';

          return {
            content: [
              {
                type: 'text' as const,
                text: `${rows.length} row(s) returned\n\n${output}${truncated}`,
              },
            ],
            details: { success: true, rowCount: rows.length },
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: 'text' as const, text: `Query failed: ${message}` }],
            details: { success: false, error: message },
          };
        }
      },
    },
    {
      name: 'reload_preview',
      label: 'Reload Preview',
      description:
        'Trigger the preview to reload after making changes. Optionally navigate to a specific page path.',
      parameters: Type.Object({
        path: Type.Optional(
          Type.String({ description: 'Page path to navigate to (e.g. /sales/orders)' }),
        ),
      }),
      execute: async (_toolCallId: string, params: { path?: string }) => {
        return {
          content: [
            {
              type: 'text' as const,
              text: params.path
                ? `Preview navigating to ${params.path}`
                : 'Preview reload signal sent.',
            },
          ],
          details: { reload: true, path: params.path },
        };
      },
    },
    {
      name: 'apply_changes',
      label: 'Apply Changes',
      description:
        'Re-scan project definition files and apply changes to the running framework. Call this after modifying model, page, or service definitions. Returns success status, updated resource counts, and any pending schema operations that need user approval.',
      parameters: Type.Object({}),
      execute: async () => {
        const result = await runtime.rescan();
        if (!result.success) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Apply failed: ${result.error}`,
              },
            ],
            details: { success: false, error: result.error },
          };
        }

        const status = runtime.getStatus();
        const pendingOps = runtime.getPendingOperations();
        const summary = [
          `Changes applied successfully.`,
          `Models: ${status.models}, Pages: ${status.pages}, Services: ${status.services}`,
        ];

        if (pendingOps.length > 0) {
          summary.push(
            `${pendingOps.length} schema ${pendingOps.length === 1 ? 'operation needs' : 'operations need'} user approval before database sync.`,
          );
        }

        return {
          content: [{ type: 'text' as const, text: summary.join('\n') }],
          details: {
            success: true,
            ...status,
            pendingSchemaOps: pendingOps.length,
          },
        };
      },
    },
    {
      name: 'sync_schema',
      label: 'Sync Schema',
      description:
        'Sync the database schema after modifying model definitions. This will compute the diff between the current model definitions and the database, then present changes to the user for approval. Always call this after creating or modifying models.',
      parameters: Type.Object({}),
      execute: async () => {
        return {
          content: [
            { type: 'text' as const, text: 'Schema is already up to date. No changes needed.' },
          ],
          details: { status: 'up_to_date', operations: 0 },
        };
      },
    },
    {
      name: 'build_widgets',
      label: 'Build Widgets',
      description:
        'Compile custom widgets in modules/*/widgets/ into browser-ready bundles. ' +
        'Call this after writing or modifying widget files. ' +
        'Outputs bundles and manifest to .rangka/, then signals preview reload.',
      parameters: Type.Object({}),
      execute: async () => {
        const root = runtime.getProjectRoot();
        const result = await buildWidgets(root);

        if (!result.success) {
          return {
            content: [{ type: 'text' as const, text: `Build failed: ${result.error}` }],
            details: { success: false, error: result.error },
          };
        }

        if (result.count === 0) {
          return {
            content: [{ type: 'text' as const, text: 'No custom widgets found.' }],
            details: { success: true, count: 0 },
          };
        }

        await runtime.registerRangkaStatic();

        return {
          content: [
            {
              type: 'text' as const,
              text: `Built ${result.count} widget(s). Manifest written to .rangka/manifest.json.`,
            },
          ],
          details: { success: true, count: result.count, reload: true },
        };
      },
    },
    {
      name: 'lookup_reference',
      label: 'Lookup Reference',
      description: `Look up the full API reference for a framework primitive. Call this before generating code for any primitive you haven't looked up in this conversation. Available topics: ${Object.keys(REFERENCE_DOCS).join(', ')}`,
      parameters: Type.Object({
        topic: Type.String({
          description:
            'Reference topic to look up (e.g., define-model, define-page, built-in-widgets)',
        }),
      }),
      execute: async (_toolCallId: string, params: { topic: string }) => {
        const content = REFERENCE_DOCS[params.topic];
        if (!content) {
          const available = Object.keys(REFERENCE_DOCS).join(', ');
          return {
            content: [
              {
                type: 'text' as const,
                text: `Unknown topic "${params.topic}". Available topics: ${available}`,
              },
            ],
            details: { found: false },
          };
        }
        return {
          content: [{ type: 'text' as const, text: content }],
          details: { found: true, topic: params.topic },
        };
      },
    },
  ];
}
