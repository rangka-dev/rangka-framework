import { Type } from '@sinclair/typebox';
import { unlink } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import type { SubprocessManager } from './subprocess-manager.js';
import type { IntrospectType } from './ipc-protocol.js';
import { buildWidgets } from '@rangka/cli/build';
import { DOCS_INDEX, DOCS_CONTENT } from './generated/docs-bundle.js';

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

export function createStudioTools(
  subprocess: SubprocessManager,
  projectRoot?: string,
): ToolDefinition[] {
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
        const root = projectRoot ?? subprocess.getProjectRoot();
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
        try {
          const result = await subprocess.introspect(params.type, params.module);
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }],
            details: { count: result.count },
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: 'text' as const, text: message }],
            details: {},
          };
        }
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
        const baseUrl = subprocess.getBaseUrl();
        const token = subprocess.getSessionToken();
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
        const db = subprocess.getQueryDb();
        if (!db) {
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
          const result = await db
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
        'Restart the framework subprocess to pick up file changes. Call this after modifying model, page, or service definitions. Returns success status, updated resource counts, and any pending schema operations that need user approval.',
      parameters: Type.Object({}),
      execute: async () => {
        try {
          await subprocess.restart();

          const phase = subprocess.getPhase();

          if (phase === 'waiting_for_sync') {
            const ops = subprocess.getPendingOps();
            const warnings = subprocess.getWarnings();
            const summary = [
              `Changes applied. Framework restarted.`,
              `${ops.length} schema ${ops.length === 1 ? 'operation needs' : 'operations need'} user approval before database sync.`,
            ];

            if (warnings.length > 0) {
              summary.push('');
              summary.push('Warnings:');
              for (const w of warnings) {
                summary.push(`- ${w.file}: ${w.message}`);
              }
            }

            return {
              content: [{ type: 'text' as const, text: summary.join('\n') }],
              details: {
                success: true,
                phase: 'waiting_for_sync',
                pendingSchemaOps: ops.length,
                warnings: warnings.length,
              },
            };
          }

          const status = subprocess.getLastStatus();
          const warnings = subprocess.getWarnings();
          const summary = [
            `Changes applied successfully. Framework restarted.`,
            `Models: ${status?.models ?? 0}, Pages: ${status?.pages ?? 0}, Services: ${status?.services ?? 0}`,
          ];

          if (warnings.length > 0) {
            summary.push('');
            summary.push('Warnings:');
            for (const w of warnings) {
              summary.push(`- ${w.file}: ${w.message}`);
            }
          }

          return {
            content: [{ type: 'text' as const, text: summary.join('\n') }],
            details: {
              success: true,
              phase: 'serving',
              ...(status ?? {}),
              pendingSchemaOps: 0,
              warnings: warnings.length,
            },
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: 'text' as const, text: `Apply failed: ${message}` }],
            details: { success: false, error: message },
          };
        }
      },
    },
    {
      name: 'sync_schema',
      label: 'Sync Schema',
      description:
        'Sync the database schema. If there are pending schema operations, this presents them to the user for approval. If no operations are pending, it restarts the framework to recompute the diff. Always call this after creating or modifying models to ensure the database matches.',
      parameters: Type.Object({}),
      execute: async () => {
        // If not waiting for sync, restart to pick up changes and compute diff
        if (!subprocess.isWaitingForSync()) {
          try {
            await subprocess.restart();
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return {
              content: [{ type: 'text' as const, text: `Schema sync failed: ${message}` }],
              details: { status: 'error', error: message },
            };
          }
        }

        const ops = subprocess.getPendingOps();
        if (ops.length === 0) {
          return {
            content: [
              { type: 'text' as const, text: 'Schema is already up to date. No changes needed.' },
            ],
            details: { status: 'up_to_date', operations: 0 },
          };
        }

        // Return pending ops info — the actual approval flow is handled
        // by the agent-engine monkey-patch which broadcasts to UI and waits
        return {
          content: [
            {
              type: 'text' as const,
              text: `${ops.length} schema ${ops.length === 1 ? 'operation' : 'operations'} pending approval.`,
            },
          ],
          details: {
            status: 'pending_approval',
            operations: ops.map((op) => ({ type: op.type, table: op.table, detail: op.detail })),
          },
        };
      },
    },
    {
      name: 'get_status',
      label: 'Get Status',
      description:
        'Get the current status of the framework subprocess. Returns the lifecycle phase, resource counts, pending schema operations, and any errors.',
      parameters: Type.Object({}),
      execute: async () => {
        try {
          const status = await subprocess.getStatus();
          const lines: string[] = [`Phase: ${status.phase}`];

          if (status.runtime) {
            lines.push(
              `Models: ${status.runtime.models}, Pages: ${status.runtime.pages}, Services: ${status.runtime.services}, Hooks: ${status.runtime.hooks}, Jobs: ${status.runtime.jobs}`,
            );
            if (status.runtime.modules.length > 0) {
              lines.push(`Modules: ${status.runtime.modules.join(', ')}`);
            }
          }

          if (status.serverPort) {
            lines.push(`Server: http://localhost:${status.serverPort}`);
          }

          if (status.pendingOps.length > 0) {
            lines.push(`${status.pendingOps.length} schema operation(s) pending approval.`);
          } else {
            lines.push('No pending schema operations.');
          }

          if (status.error) {
            lines.push(`Error: ${status.error}`);
          }

          return {
            content: [{ type: 'text' as const, text: lines.join('\n') }],
            details: { ...status },
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: 'text' as const, text: `Failed to get status: ${message}` }],
            details: { success: false, error: message },
          };
        }
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
        const root = projectRoot ?? subprocess.getProjectRoot();
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
      name: 'list_docs',
      label: 'List Docs',
      description:
        'List available framework documentation. Returns titles and paths. Use read_doc to get the full content. Categories: concepts, guides, reference, contributing, spec, ui.',
      parameters: Type.Object({
        category: Type.Optional(
          Type.String({
            description:
              'Filter by category (concepts, guides, reference, contributing, spec, ui). Omit to list all.',
          }),
        ),
      }),
      execute: async (_toolCallId: string, params: { category?: string }) => {
        const entries = params.category
          ? DOCS_INDEX.filter((d) => d.category === params.category)
          : DOCS_INDEX;
        const listing = entries.map((d) => `${d.path} — ${d.title}`).join('\n');
        return {
          content: [{ type: 'text' as const, text: listing || 'No docs found for that category.' }],
          details: { count: entries.length, category: params.category ?? 'all' },
        };
      },
    },
    {
      name: 'read_doc',
      label: 'Read Doc',
      description:
        'Read the full content of a framework documentation page. Call list_docs first to discover available paths.',
      parameters: Type.Object({
        path: Type.String({
          description:
            'Documentation path (e.g., "concepts/models", "reference/define-model", "guides/custom-widgets")',
        }),
      }),
      execute: async (_toolCallId: string, params: { path: string }) => {
        const doc = DOCS_CONTENT[params.path];
        if (!doc) {
          const suggestions = DOCS_INDEX.filter((d) => d.path.includes(params.path))
            .map((d) => d.path)
            .slice(0, 5);
          const hint = suggestions.length
            ? ` Did you mean: ${suggestions.join(', ')}?`
            : ' Call list_docs to see available paths.';
          return {
            content: [{ type: 'text' as const, text: `Doc not found: "${params.path}".${hint}` }],
            details: { found: false },
          };
        }
        return {
          content: [{ type: 'text' as const, text: doc }],
          details: { found: true, path: params.path },
        };
      },
    },
  ];
}
