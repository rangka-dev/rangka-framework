# Data Access Layer

> **Status: To be implemented**

## Motivation

Services currently query data via `ctx.db` (raw Kysely). This works for internal models but has limitations:

- Cannot access external models (they have no SQL table)
- No automatic field permission enforcement at the query level
- No automatic relationship resolution
- No field mapping or computed field evaluation
- Services must know table naming conventions (`sales__order` vs `sales.Order`)

A unified data access API (`ctx.models`) provides a single interface for querying any model regardless of its data source. It handles dispatch, permissions, relationships, and field resolution automatically.

## Postgres-only

The framework uses PostgreSQL as its only local data source. There is no database abstraction layer. No MySQL, SQLite, or other SQL databases will be supported as internal storage.

Other databases (MySQL, MSSQL, MongoDB, DynamoDB, etc.) connect through `defineExternalModel` with a plugin adapter. This is a deliberate constraint:

- No dialect translation layer to maintain
- Every filter operator maps to one known Postgres behavior
- Tests run against real Postgres (no fakes, no mocks for internal queries)
- DiffEngine, auto-sync, and migrations target Postgres DDL only
- `ctx.db` exposes full Postgres/Kysely power without compromise

## Not a database abstraction

`ctx.models` is a convenience and dispatch layer, not an ORM or database abstraction. For internal models it translates directly to Kysely/Postgres with zero indirection beyond field name mapping and permission enforcement. There is no pluggable backend for internal models.

The dispatch logic:

- Internal model (no `source`) → Kysely query against Postgres
- External model (has `source`) → plugin adapter

## Testing

| What                              | How to test                           |
| --------------------------------- | ------------------------------------- |
| `ctx.models` with internal models | Real Postgres (integration tests)     |
| `ctx.models` with external models | Mock adapter (unit tests)             |
| Cross-boundary relationships      | Mock external adapter + real Postgres |
| Adapter plugins                   | Unit test the adapter in isolation    |

No in-memory database fakes. No SQLite pretending to be Postgres. The only test double is the adapter interface for external sources.

## Design

### ctx.models API

```typescript
interface ModelAccess {
  // Single record
  get(model: string, id: string): Promise<Record<string, unknown> | null>;

  // Query builder
  query(model: string): ModelQuery;

  // Mutations
  create(model: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
  update(
    model: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
  delete(model: string, id: string): Promise<void>;
}
```

### ModelQuery builder

A chainable query builder that works across all data sources.

```typescript
interface ModelQuery {
  filter(conditions: FilterExpression): ModelQuery;
  sort(field: string, direction?: 'asc' | 'desc'): ModelQuery;
  limit(count: number): ModelQuery;
  offset(count: number): ModelQuery;
  include(relation: string): ModelQuery;
  fields(fieldNames: string[]): ModelQuery;
  exec(): Promise<QueryResult>;
  first(): Promise<Record<string, unknown> | null>;
  count(): Promise<number>;
}

interface QueryResult {
  data: Record<string, unknown>[];
  total?: number;
  hasMore?: boolean;
}
```

### Filter expressions

Filters use a declarative object syntax. Each key is a field name, each value is a condition.

```typescript
// Simple equality
{ status: 'confirmed' }

// Operators
{ total: { gt: 100 } }
{ email: { contains: '@acme.com' } }
{ createdAt: { gte: '2026-01-01', lt: '2026-02-01' } }
{ status: { in: ['confirmed', 'shipped'] } }
{ deletedAt: { is: null } }

// Combined (AND)
{ status: 'confirmed', total: { gt: 100 } }
```

Supported operators:

| Operator     | Description                                         |
| ------------ | --------------------------------------------------- |
| `eq`         | Equal (default when value is not an object)         |
| `neq`        | Not equal                                           |
| `gt`         | Greater than                                        |
| `gte`        | Greater than or equal                               |
| `lt`         | Less than                                           |
| `lte`        | Less than or equal                                  |
| `in`         | In array                                            |
| `notIn`      | Not in array                                        |
| `contains`   | String contains (case-insensitive)                  |
| `startsWith` | String starts with                                  |
| `endsWith`   | String ends with                                    |
| `is`         | Null check (`{ is: null }` or `{ is: 'not_null' }`) |

### Relationship resolution

`include()` loads related records. For internal models this translates to SQL joins or subqueries. For external models and cross-boundary relationships it uses the DataLoader pattern (batch-fetch by collected IDs).

```typescript
const orders = await ctx.models
  .query('sales.Order')
  .filter({ status: 'confirmed' })
  .include('customer')
  .include('lineItems')
  .exec();

// orders.data[0].customer → resolved record
// orders.data[0].lineItems → array of resolved records
```

Include resolution strategy:

| Relationship  | Same source          | Cross-boundary                                |
| ------------- | -------------------- | --------------------------------------------- |
| `link`        | SQL join or subquery | Collect IDs → batchGet on target adapter      |
| `hasMany`     | SQL subquery         | Collect parent IDs → filter on target adapter |
| `dynamicLink` | Subquery per type    | Collect IDs per type → batchGet per adapter   |

### Field selection

`fields()` limits which fields are returned. Reduces payload size and can avoid expensive computed fields.

```typescript
const names = await ctx.models.query('billing.Customer').fields(['id', 'name', 'email']).exec();
```

## Dispatch

`ctx.models` resolves the model name against the schema registry and dispatches to the correct data source:

1. Look up model in registry
2. If internal model (no `source`): translate to Kysely query, execute against Postgres
3. If external model (has `source`): delegate to the adapter registered by the plugin
4. Apply field mapping (external models)
5. Evaluate computed fields
6. Apply field permissions (strip hidden, enforce read-only)
7. Resolve includes (DataLoader for cross-boundary)

```
ctx.models.query('billing.Customer')
  │
  ├─ internal? → Kysely selectFrom → Postgres
  │
  └─ external? → adapter.list() / adapter.filter()
                   │
                   ├─ adapter has 'filter'? → pass filters to adapter
                   └─ adapter lacks 'filter'? → fetch all, filter in memory
```

## Internal model translation

For internal models, `ctx.models` translates to Kysely queries. The translation is straightforward:

| ModelQuery method                 | Kysely equivalent                    |
| --------------------------------- | ------------------------------------ |
| `filter({ status: 'confirmed' })` | `.where('status', '=', 'confirmed')` |
| `filter({ total: { gt: 100 } })`  | `.where('total', '>', 100)`          |
| `sort('createdAt', 'desc')`       | `.orderBy('created_at', 'desc')`     |
| `limit(10)`                       | `.limit(10)`                         |
| `offset(20)`                      | `.offset(20)`                        |
| `count()`                         | `.select(sql\`count(\*)\`)`          |

Field names are translated from model field names to column names automatically.

## Scope and permission enforcement

`ctx.models` automatically applies:

1. **Scope filters** — if the model has a scope and the request context has scope values, WHERE conditions are added
2. **Field permissions** — hidden fields are stripped from results, read-only fields are enforced on write
3. **Owner-only rules** — if the model has owner-only permissions, a created_by filter is added

This happens transparently. Services don't need to apply permissions manually.

```typescript
// Developer writes this
const orders = await ctx.models.query('sales.Order').exec();

// Framework adds scope filter automatically
// → WHERE tenant_id = :currentTenantId

// Framework strips hidden fields from result
// → removes fields the user doesn't have permission to see
```

### Bypassing enforcement

For system-level operations (migrations, admin tasks, internal service logic), services can bypass enforcement:

```typescript
const allOrders = await ctx.models
  .query('sales.Order')
  .unscoped() // skip scope filters
  .exec();
```

`unscoped()` is only available when the service is called internally (not from an API request). Boot-time validation warns if an API-facing service uses `unscoped()`.

## Relationship to ctx.db

`ctx.db` remains available for raw Postgres queries. It is not deprecated.

|                        | `ctx.models`      | `ctx.db`          |
| ---------------------- | ----------------- | ----------------- |
| Internal models        | Yes               | Yes               |
| External models        | Yes               | No                |
| Auto permissions       | Yes               | No (manual)       |
| Auto relationships     | Yes               | No (manual joins) |
| Complex joins          | No                | Yes               |
| CTEs, window functions | No                | Yes               |
| Aggregations           | Limited (`count`) | Full              |
| Bulk operations        | No                | Yes               |
| Raw SQL                | No                | Yes               |

Services can mix both in the same handler:

```typescript
async handler(ctx) {
  // Unified API for cross-source query
  const customer = await ctx.models.get('billing.Customer', customerId);

  // Raw SQL for complex reporting
  const report = await ctx.db.selectFrom('sales.Order')
    .select(sql`sum(total)`.as('revenue'))
    .where('customer_id', '=', customerId)
    .execute();
}
```

## Mutations

### Create

```typescript
const order = await ctx.models.create('sales.Order', {
  customer: customerId,
  total: 250.0,
  status: 'draft',
});
```

For internal models:

1. Validate fields against model schema
2. Apply trait stamps (created_at, created_by if timestamped)
3. Run hook pipeline (validate → beforeSave → beforeCreate → insert → afterCreate → afterSave)
4. Return created record

For external models:

1. Validate fields against model schema (local validation)
2. Apply field mapping (reverse: local names → source names)
3. Call `adapter.create(model, mappedData)`
4. Apply field mapping on response (source → local)
5. Return created record

### Update

Same pattern. Internal models run the hook pipeline. External models validate locally then delegate to the adapter.

### Delete

Internal models run beforeDelete/afterDelete hooks and respect soft_delete trait. External models call `adapter.delete(model, id)` directly.

## Hooks and ctx.models

Hooks continue to run inside the transaction for internal models. The hook context gains access to `ctx.models` for cross-source lookups:

```typescript
defineHooks('sales.Order', {
  async afterSave(ctx) {
    // Look up external customer during hook
    const customer = await ctx.models.get('billing.Customer', ctx.record.customer);
    // Do something with customer data
  },
});
```

Hooks do not run for external model mutations. External sources manage their own lifecycle. If you need to react to external changes, use the event/webhook trigger pattern from the unified services spec.

## Open questions

- Should `ctx.models.query()` support OR conditions, or only AND?
- Should `count()` be a separate adapter capability (some APIs don't support counting)?
- Should there be a `ctx.models.raw(model, fn)` escape hatch that gives access to the underlying Kysely builder for internal models?
- How does pagination work for `include()`? If an order has 10,000 line items, does include load all of them?
