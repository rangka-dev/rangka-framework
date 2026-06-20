---
status: stable
since: 0.1.0
last-updated: 2026-06-19
description: definePlugin() — create plugins that provide adapters, lifecycle hooks, and custom routes
---

# definePlugin

Declares a plugin that extends the framework with external capabilities. Plugins provide data adapters for external models, lifecycle hooks, and custom routes.

## Signature

```typescript
import { definePlugin } from 'rangka';

export default definePlugin({
  name: 'mysql',
  version: '0.1.0',
  config: {
    host: { type: 'string', required: true },
    port: { type: 'number', default: 3306 },
    database: { type: 'string', required: true },
    user: { type: 'string', required: true },
    password: { type: 'string', required: true },
  },
  provides: {
    adapters: ['mysql'],
  },
  async boot(ctx) {
    const pool = await createPool(ctx.config);

    ctx.adapters.mysql.implement({
      async get(model, id) {
        const { table, primaryKey } = model.source;
        const row = await pool.query(`SELECT * FROM ${table} WHERE ${primaryKey} = ?`, [id]);
        return row[0] ?? null;
      },
      async list(model, query) {
        // ...
      },
      async create(model, data) {
        // ...
      },
    });

    ctx.on('beforeShutdown', async () => {
      await pool.end();
    });
  },
});
```

## PluginDefinition

```typescript
interface PluginDefinition {
  name: string;
  version: string;
  config?: Record<string, ConfigField>;
  provides?: PluginProvides;
  boot: (ctx: PluginBootContext) => Promise<void> | void;
}
```

| Field      | Type                          | Description                                           |
| ---------- | ----------------------------- | ----------------------------------------------------- |
| `name`     | `string`                      | **Required.** Unique plugin identifier.               |
| `version`  | `string`                      | **Required.** Semver version string.                  |
| `config`   | `Record<string, ConfigField>` | Configuration schema. Validated at boot.              |
| `provides` | `PluginProvides`              | Declares what this plugin provides (adapters, etc.).  |
| `boot`     | `(ctx) => Promise<void>`      | **Required.** Initialization function called at boot. |

## Config schema

Declare expected configuration fields. The framework validates user-provided config against this schema at boot time.

```typescript
interface ConfigField {
  type: 'string' | 'number' | 'boolean';
  required?: boolean;
  default?: unknown;
}
```

| Field      | Type      | Description                                      |
| ---------- | --------- | ------------------------------------------------ |
| `type`     | `string`  | Expected value type.                             |
| `required` | `boolean` | If `true`, boot fails when the field is missing. |
| `default`  | `unknown` | Default value when not provided by the user.     |

Missing required fields throw `PluginConfigError` at boot.

## Provides

Declares what capabilities this plugin offers. The framework uses this for boot-time validation.

```typescript
interface PluginProvides {
  adapters?: string[];
}
```

Every adapter name listed in `provides.adapters` must be implemented during `boot()`. If the boot function finishes without implementing a declared adapter, the framework throws `MissingAdapterImplementationError`.

> **Planned** — future `provides` slots: `auth`, `storage`, `email`, `queue`.

## Boot context

The `boot` function receives a `PluginBootContext` with tools to register capabilities and listen to lifecycle events.

```typescript
interface PluginBootContext {
  config: Record<string, unknown>;
  adapters: Record<string, { implement: (adapter: DataAdapter) => void }>;
  on: (event: PluginLifecycleEvent, handler: (...args: unknown[]) => Promise<void>) => void;
}
```

| Property   | Description                                                                    |
| ---------- | ------------------------------------------------------------------------------ |
| `config`   | Resolved configuration (user values merged with defaults).                     |
| `adapters` | Proxy object keyed by declared adapter names. Call `.implement()` to register. |
| `on`       | Register lifecycle event handlers.                                             |

## Data adapter interface

Adapters implement data operations for external models. Only `get` is required. All other methods are optional and determine what operations the model supports.

```typescript
interface DataAdapter {
  get(model: AdapterModelInfo, id: string): Promise<Record<string, unknown> | null>;
  list?(model: AdapterModelInfo, query?: ListQuery): Promise<ListResult>;
  create?(model: AdapterModelInfo, data: Record<string, unknown>): Promise<Record<string, unknown>>;
  update?(
    model: AdapterModelInfo,
    id: string,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
  delete?(model: AdapterModelInfo, id: string): Promise<void>;
  filter?(
    model: AdapterModelInfo,
    conditions: Record<string, unknown>,
  ): Promise<Record<string, unknown>[]>;
  batchGet?(model: AdapterModelInfo, ids: string[]): Promise<Record<string, unknown>[]>;
}
```

### Adapter methods

| Method     | Required | Description                                                                            |
| ---------- | -------- | -------------------------------------------------------------------------------------- |
| `get`      | Yes      | Fetch a single record by primary key.                                                  |
| `list`     | No       | Fetch a paginated list of records.                                                     |
| `create`   | No       | Insert a new record. Return the created record with its ID.                            |
| `update`   | No       | Update an existing record. Return the updated record.                                  |
| `delete`   | No       | Delete a record by primary key.                                                        |
| `filter`   | No       | Fetch records matching filter conditions. If absent, filtering happens in memory.      |
| `batchGet` | No       | Fetch multiple records by IDs in a single call. Prevents N+1 queries on relationships. |

### AdapterModelInfo

The adapter receives model metadata on every call. This includes the source config and field mappings.

```typescript
interface AdapterModelInfo {
  name: string;
  source: Record<string, unknown>;
  fields: Record<string, { column: string; type: string }>;
  primaryKey: string;
}
```

| Field        | Description                                                          |
| ------------ | -------------------------------------------------------------------- |
| `name`       | Qualified model name (e.g., `'crm.customer'`).                       |
| `source`     | The `source` object from `defineExternalModel`.                      |
| `fields`     | Map of field names to column names and types.                        |
| `primaryKey` | The primary key column name from source config (defaults to `'id'`). |

### ListQuery

```typescript
interface ListQuery {
  page?: number;
  pageSize?: number;
  sort?: { field: string; direction: 'asc' | 'desc' };
  filters?: Record<string, unknown>;
}
```

### ListResult

```typescript
interface ListResult {
  data: Record<string, unknown>[];
  total: number;
  hasMore?: boolean;
}
```

## Lifecycle events

Plugins can hook into framework lifecycle events.

| Event            | Fires when                                           |
| ---------------- | ---------------------------------------------------- |
| `beforeBoot`     | After plugin loads, before schema and database init. |
| `afterBoot`      | After all boot phases complete, server ready.        |
| `beforeRequest`  | Before each HTTP request is processed.               |
| `afterRequest`   | After each HTTP request completes.                   |
| `beforeShutdown` | On graceful shutdown (SIGINT/SIGTERM).               |

```typescript
async boot(ctx) {
  ctx.on('beforeShutdown', async () => {
    await pool.end();
  });

  ctx.on('afterBoot', async () => {
    await verifyConnection();
  });
}
```

Handlers execute sequentially in registration order. If a handler throws, the error propagates and halts the lifecycle.

## Loading plugins

Declare plugins in `rangka.config.ts`:

```typescript
import { defineConfig } from 'rangka';

export default defineConfig({
  database: { dialect: 'pg', host: 'localhost', database: 'myapp' },
  plugins: [
    {
      package: '@rangka/plugin-mysql',
      config: {
        host: 'legacy-db.internal',
        database: 'legacy_crm',
        user: 'readonly',
        password: process.env.LEGACY_DB_PASSWORD,
      },
    },
  ],
});
```

> **Planned** — plugin loading from `rangka.config.ts` is not yet implemented. Currently plugins are passed to the `boot()` function programmatically.

## Validation

The framework validates plugin setup at boot time:

| Check                                     | Error                               |
| ----------------------------------------- | ----------------------------------- |
| Duplicate plugin names                    | `DuplicatePluginError`              |
| Required config field missing             | `PluginConfigError`                 |
| Declared adapter not implemented          | `MissingAdapterImplementationError` |
| External model references unknown adapter | Unresolved source error             |
| Adapter lacks `batchGet`                  | Warning (N+1 query risk)            |

All validation runs before the server starts. Errors surface immediately with clear messages.

## Example: REST API adapter

```typescript
import { definePlugin } from 'rangka';

export default definePlugin({
  name: 'rest',
  version: '0.1.0',
  config: {
    baseUrl: { type: 'string', required: true },
    headers: { type: 'string' },
  },
  provides: { adapters: ['rest'] },
  async boot(ctx) {
    const baseUrl = ctx.config.baseUrl;

    ctx.adapters.rest.implement({
      async get(model, id) {
        const res = await fetch(`${baseUrl}/${model.source.endpoint}/${id}`);
        return res.ok ? await res.json() : null;
      },
      async list(model, query) {
        const params = new URLSearchParams();
        if (query?.page) params.set('page', String(query.page));
        if (query?.pageSize) params.set('limit', String(query.pageSize));
        const res = await fetch(`${baseUrl}/${model.source.endpoint}?${params}`);
        const body = await res.json();
        return { data: body.data, total: body.total };
      },
    });
  },
});
```

## File structure convention

```
packages/rangka-plugin-mysql/
  src/
    index.ts        ← definePlugin(...)
    adapter.ts      ← DataAdapter implementation
  package.json      ← { "name": "@rangka/plugin-mysql" }
```

Plugins are published as npm packages and installed via `pnpm add @rangka/plugin-mysql`.
