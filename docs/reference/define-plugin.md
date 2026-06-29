---
status: stable
since: 0.1.0
last-updated: 2026-06-29
description: definePlugin() - create plugins that provide adapters, lifecycle hooks, and custom routes
---

# definePlugin

Declares a plugin that extends the framework with external capabilities. Plugins provide data adapters for external models and hook into framework lifecycle events.

## Signature

```typescript
import { definePlugin } from '@rangka/core';

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
    adapters: [
      { name: 'mysql', capabilities: ['read', 'list', 'filter', 'create', 'update', 'delete'] },
    ],
  },
  async boot(ctx) {
    const pool = await createPool(ctx.config);

    ctx.adapters.mysql.implement({
      async get(model, id) {
        const row = await pool.query(`SELECT * FROM ${model} WHERE id = ?`, [id]);
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
  config?: Record<string, PluginConfigField>;
  provides?: PluginProvides;
  boot: (ctx: PluginBootContext) => Promise<void> | void;
}
```

| Field      | Type                                | Description                                           |
| ---------- | ----------------------------------- | ----------------------------------------------------- |
| `name`     | `string`                            | **Required.** Unique plugin identifier.               |
| `version`  | `string`                            | **Required.** Semver version string.                  |
| `config`   | `Record<string, PluginConfigField>` | Configuration schema. Validated at boot.              |
| `provides` | `PluginProvides`                    | Declares what this plugin provides (adapters, etc.).  |
| `boot`     | `(ctx) => Promise\<void\> \| void`  | **Required.** Initialization function called at boot. |

## Config schema

Declare expected configuration fields. The framework validates user-provided config against this schema at boot time.

```typescript
interface PluginConfigField {
  type: string;
  required?: boolean;
  default?: unknown;
}
```

| Field      | Type      | Description                                                     |
| ---------- | --------- | --------------------------------------------------------------- |
| `type`     | `string`  | Expected value type (e.g. `'string'`, `'number'`, `'boolean'`). |
| `required` | `boolean` | If `true`, boot fails when the field is missing.                |
| `default`  | `unknown` | Default value when not provided by the user.                    |

Missing required fields throw `PluginConfigError` at boot.

## Provides

Declares what capabilities this plugin offers.

```typescript
interface PluginProvides {
  adapters?: Array<{ name: string; capabilities: AdapterCapability[] }>;
}

type AdapterCapability = 'read' | 'list' | 'filter' | 'sort' | 'create' | 'update' | 'delete';
```

Each adapter entry declares its name and the operations it supports. Every adapter listed in `provides.adapters` must be implemented during `boot()`. If the boot function finishes without implementing a declared adapter, the framework throws `MissingAdapterImplementationError`.

```typescript
provides: {
  adapters: [
    { name: 'mysql', capabilities: ['read', 'list', 'filter', 'create', 'update', 'delete'] },
  ],
}
```

> **Planned** — future `provides` slots: `auth`, `storage`, `email`, `queue`.

## Boot context

The `boot` function receives a `PluginBootContext` with tools to register capabilities and listen to lifecycle events.

```typescript
interface PluginBootContext {
  config: Record<string, unknown>;
  adapters: Record<string, { implement(impl: DataAdapter): void }>;
  on(event: PluginLifecycleEvent, handler: (...args: unknown[]) => Promise<void>): void;
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
  get(model: string, id: string): Promise<Record<string, unknown> | null>;
  list?(model: string, query: ListQuery): Promise<ListResult>;
  create?(model: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
  update?(
    model: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
  delete?(model: string, id: string): Promise<void>;
  filter?(model: string, filters: FilterExpression[]): Promise<ListResult>;
  batchGet?(model: string, ids: string[]): Promise<Record<string, unknown>[]>;
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
| `filter`   | No       | Fetch records matching filter expressions. If absent, filtering happens in memory.     |
| `batchGet` | No       | Fetch multiple records by IDs in a single call. Prevents N+1 queries on relationships. |

### ListQuery

```typescript
interface ListQuery {
  page?: number;
  pageSize?: number;
  sort?: { field: string; direction: 'asc' | 'desc' };
  filters?: FilterExpression[];
}
```

### FilterExpression

```typescript
interface FilterExpression {
  field: string;
  operator: string;
  value: unknown;
}
```

### ListResult

```typescript
interface ListResult {
  data: Record<string, unknown>[];
  total?: number;
  hasMore?: boolean;
}
```

## Capability-driven behavior

The framework generates API routes based on what the adapter declares it can do. If an adapter only supports read operations, the model is automatically read-only.

| Adapter capability | API route generated    | HTTP method |
| ------------------ | ---------------------- | ----------- |
| `read`             | `/api/:app/:model/:id` | GET         |
| `list`             | `/api/:app/:model`     | GET         |
| `create`           | `/api/:app/:model`     | POST        |
| `update`           | `/api/:app/:model/:id` | PUT         |
| `delete`           | `/api/:app/:model/:id` | DELETE      |

Routes for missing capabilities return `405 Method Not Allowed`.

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
import { definePlugin } from '@rangka/core';

export default definePlugin({
  name: 'rest',
  version: '0.1.0',
  config: {
    baseUrl: { type: 'string', required: true },
  },
  provides: {
    adapters: [{ name: 'rest', capabilities: ['read', 'list'] }],
  },
  async boot(ctx) {
    const baseUrl = ctx.config.baseUrl as string;

    ctx.adapters.rest.implement({
      async get(model, id) {
        const res = await fetch(`${baseUrl}/${model}/${id}`);
        return res.ok ? await res.json() : null;
      },
      async list(model, query) {
        const params = new URLSearchParams();
        if (query?.page) params.set('page', String(query.page));
        if (query?.pageSize) params.set('limit', String(query.pageSize));
        const res = await fetch(`${baseUrl}/${model}?${params}`);
        const body = await res.json();
        return { data: body.data, total: body.total };
      },
    });
  },
});
```
