# Spec: Model API Execution Abstraction (ModelOps)

**Status:** Implemented

## Problem

`model-api/` previously mixed two concerns:

1. **Query description.** Building an immutable representation of what to fetch (filters, sorts, pagination, scopes).
2. **Query execution.** Calling Kysely's `.execute()`, building SQL, running it against PostgreSQL.

This coupling caused:

- External models needed a parallel implementation (`ExternalModelQueryBuilder`)
- `createModelAccess()` had `if (model.source)` branching
- `scope-enforcer.ts` and `filter-applier.ts` called `.where()` on Kysely query objects but lived in `model-api/`
- Two separate mutation paths existed (handlers vs hooks/middleware)
- Include resolution was duplicated between `api/` and `db/`

## Solution

Separated **query description** from **query execution**:

- `model-api/` is a pure, DB-agnostic query DSL + interfaces
- `db/` contains all PostgreSQL/Kysely execution logic
- `external-model/` conforms to the same `ModelOps` interface
- Mutation paths are unified. Hooks use `ops.withTransaction(trx)` instead of raw Kysely.
- Shared helpers extracted to `helpers/` for stamping, ownership, validation, and coercion.

---

## Interface: `ModelOps`

```typescript
// model-api/types.ts

export interface ModelOps {
  find(state: QueryState): Promise<QueryResult>;
  findWithMeta(state: QueryState): Promise<QueryResultWithMeta>;
  findOne(state: QueryState): Promise<Record<string, unknown> | null>;
  count(state: QueryState): Promise<number>;
  get(id: string): Promise<Record<string, unknown> | null>;
  create(data: Record<string, unknown>, auth?: RequestContext): Promise<Record<string, unknown>>;
  update(
    id: string,
    data: Record<string, unknown>,
    auth?: RequestContext,
  ): Promise<Record<string, unknown>>;
  delete(id: string, auth?: RequestContext): Promise<Record<string, unknown>>;
  withTransaction?(trx: unknown): ModelOps;
  compile?(state: QueryState): unknown;
  compileCount?(state: QueryState): unknown;
}
```

Key design decisions:

- `delete()` returns the deleted record (needed by hooks for `afterDelete`).
- `withTransaction(trx)` returns a new instance bound to the transaction. Optional because external adapters do not support transactions.
- `ModelOps` is a pure DB executor. It does not stamp timestamps or validate required fields. Callers handle that.

---

## Implementation: `KyselyModelOps`

```typescript
// db/model-ops.ts

export class KyselyModelOps implements ModelOps {
  private readonly db: DbLike;
  private readonly model: ResolvedModel;
  private readonly registry: SchemaRegistry;
  private readonly tableName: string;

  constructor(config: KyselyModelOpsConfig) {
    this.db = config.db;
    this.model = config.model;
    this.registry = config.registry;
    this.tableName = config.tableName ?? config.model.qualifiedName;
  }

  withTransaction(trx: unknown): ModelOps {
    return new KyselyModelOps({
      db: trx,
      model: this.model,
      registry: this.registry,
      tableName: modelToTableName(this.model.qualifiedName),
    });
  }
}
```

When constructed normally, `this.db` is a `DatabaseClient` which resolves qualified names (e.g., `sales.customer` to `sales__customer`). The `tableName` defaults to `model.qualifiedName` and `DatabaseClient` handles translation.

When created via `withTransaction(trx)`, the raw Kysely transaction does not resolve names. So `withTransaction` passes the pre-resolved `tableName` via `modelToTableName()`.

---

## Implementation: `ExternalModelOps`

```typescript
// external-model/external-model-ops.ts

export class ExternalModelOps implements ModelOps {
  private readonly queryExecutor: ExternalQueryExecutor;
  private readonly mutationExecutor: ExternalMutationExecutor;

  async delete(id: string): Promise<Record<string, unknown>> {
    const record = await this.get(id);
    if (!record) throw new Error(`Record not found: ${id}`);
    await this.mutationExecutor.delete(id);
    return record;
  }
}
```

External models do not implement `withTransaction`. Adapter errors propagate to the caller. When an adapter lacks `filter` or `sort` capabilities, `ExternalModelOps` falls back to client-side filtering via `in-memory-ops.ts`.

---

## Stamping

Timestamp stamping (`created_at`, `updated_at`, `created_by`, `updated_by`) is the **caller's responsibility**, not ModelOps.

```typescript
// helpers/stamping.ts

export function stampCreate(body, model, auth): void { ... }
export function stampUpdate(body, model, auth): void { ... }
```

Call sites:

- `api/handlers.ts` — `createHandler` calls `stampCreate`, `updateHandler` calls `stampUpdate`
- `hooks/middleware.ts` — `withHooksCreate` calls `stampCreate`, `withHooksUpdate` calls `stampUpdate`

Both stamp **before** passing data to `ModelOps`. Hooks see already-stamped data in `beforeCreate`/`beforeSave`.

---

## Validation

Required field validation is also a caller responsibility.

```typescript
// helpers/validation.ts

export function findMissingRequiredFields(model, body): string[] { ... }
```

Call sites:

- `api/handlers.ts` — `createHandler` validates before stamping
- `hooks/middleware.ts` — `withHooksCreate` validates before stamping

`ModelOps` trusts that data is validated before it arrives.

---

## Ownership checks

```typescript
// helpers/assert-ownership.ts

export function assertOwnership(permissions, model, record, userId, operation): void { ... }
```

Throws `ForbiddenError` if the user does not own the record and the permission is `own`-scoped. Used by `api/handlers.ts` (update, delete) and `hooks/middleware.ts` (update, delete).

---

## Hooks and ModelOps boundary

`ModelOps` does not run hooks. The hooks pipeline calls `ModelOps` methods inside its `execute` callback via `ops.withTransaction(trx)`.

```typescript
// hooks/middleware.ts

export function withHooksCreate(ctx: WithHooksContext) {
  return async (request, reply) => {
    // ... validate, stamp ...
    const result = await executeHookPipeline(
      buildPipelineOptions(ctx, 'create', body, auth, async (doc, trx) => {
        const txOps = ctx.ops.withTransaction!(trx);
        return txOps.create(doc);
      }),
    );
  };
}
```

Route handlers check `hookRegistry.hasHooks(model)`:

- If hooks exist: use `withHooksCreate/Update/Delete` (wraps ModelOps in a transaction with hook pipeline)
- If no hooks: handler calls `ModelAccess.create/update/delete` directly (no transaction)

---

## Include resolution

A single unified resolver handles all relation types and both internal and external models.

```typescript
// db/model-include-resolver.ts

export type IncludeSpec = string | { relation: string; nested?: IncludeSpec[] };

export async function resolveModelIncludes(
  records: Record<string, unknown>[],
  includes: IncludeSpec[],
  registry: SchemaRegistry,
  db: Kysely<any>,
  sourceModel: string,
  options?: IncludeResolverOptions,
): Promise<void> { ... }
```

Supports:

- `link` — batch-loads by foreign key IDs
- `hasMany` / `children` — batch-loads by parent IDs
- `manyToMany` — joins through a junction table
- `dynamicLink` — polymorphic resolution grouped by target model type
- External models — resolves via adapter `batchGet`/`list`
- Nested includes — recursive resolution

`api/include-resolver.ts` is a thin adapter that converts `ParsedInclude[]` to `IncludeSpec[]` and delegates to `resolveModelIncludes`.

`CompositeIncludeResolver` (in `db/include-resolver.ts`) implements the `IncludeResolver` interface for use by `ModelQueryBuilder`.

---

## File layout

```
model-api/
  types.ts              — ModelOps, ModelQuery, QueryState, FilterExpression, results
  query-builder.ts      — ModelQueryBuilder (immutable builder, delegates to ModelOps)
  filter-translator.ts  — pure transform: FilterExpression → TranslatedFilter[]
  field-access.ts       — stripHiddenFields, enforceReadOnly
  index.ts              — createModelAccess factory
  include-resolver.ts   — re-export from db/model-include-resolver
  scope-enforcer.ts     — re-export from db/scope-enforcer + field-access

db/
  client.ts             — DatabaseClient (Kysely connection with table name resolution)
  model-ops.ts          — KyselyModelOps implements ModelOps
  filter-applier.ts     — applies TranslatedFilter[] as .where() chains
  scope-enforcer.ts     — applies auth scopes as .where() chains
  model-include-resolver.ts — unified include resolution (all relation types + external)
  include-resolver.ts   — CompositeIncludeResolver class

external-model/
  external-model-ops.ts — ExternalModelOps implements ModelOps
  query-executor.ts     — adapter list/get execution
  mutation-executor.ts  — adapter create/update/delete
  in-memory-ops.ts      — client-side filter/sort/paginate

helpers/
  coerce.ts             — toBool, toInt, isNil, toCount
  stamping.ts           — stampCreate, stampUpdate
  assert-ownership.ts   — assertOwnership
  validation.ts         — findMissingRequiredFields

api/
  handlers.ts           — CRUD route handlers (stamps, validates, calls ModelAccess)
  include-resolver.ts   — thin adapter: ParsedInclude[] → IncludeSpec[]
  route-generator.ts    — registers routes, decides hooks vs direct handlers
  query-parser.ts       — parses HTTP query strings
```

No file in `model-api/` imports from `kysely`.
No file in `model-api/` calls `.execute()`.

---

## Dependency graph

```
api/ → model-api/ → (types only)
api/ → helpers/
hooks/ → helpers/
hooks/ → model-api/ (ModelQueryBuilder, ModelOps type)

model-api/index.ts → db/model-ops.ts (KyselyModelOps)
model-api/index.ts → external-model/external-model-ops.ts (ExternalModelOps)
model-api/index.ts → db/include-resolver.ts (CompositeIncludeResolver)

db/model-ops.ts → db/filter-applier.ts
db/model-ops.ts → db/scope-enforcer.ts
db/model-ops.ts → db/field-mapper.ts (modelToTableName)
```

---

## Auth contract

Auth is caller-driven. Route handlers call `.withAuth(auth)` on the query builder before executing. If `.withAuth()` is not called, scope enforcement does not apply.

`get/update/delete` on `ModelAccess` do not apply scope enforcement at the query level. Ownership checks happen at the handler/middleware level via `assertOwnership()`.

---

## Testing impact

- **Unit tests for `ModelQueryBuilder`**: Mock `ModelOps` instead of a full Kysely DB. Test that builder methods accumulate correct `QueryState` and delegate to ops.
- **Unit tests for `KyselyModelOps`**: Test SQL generation and execution with a mock DB.
- **Integration tests**: Unchanged. They test the full stack through HTTP → handler → ModelOps → real DB.
- **External model tests**: Unchanged. `ExternalModelOps` wraps existing executors.

---

## Public API

Exports from `@rangka/core`:

- `createModelAccess(opts)` → returns `ModelAccess`
- `ModelQuery` interface (unchanged)
- `ModelOps` interface (useful for plugin authors writing custom backends)
- `KyselyModelOps` class
- `stampCreate`, `stampUpdate` helpers

Breaking changes from the spec's original design: `ModelOps.delete()` returns `Record<string, unknown>` instead of `void`.
