# Spec: Stable Model API

Status: Draft
Packages affected: shared (interface + contract tests + reference impl), core (implementation)

---

## Context

`ctx.models` is the unified data access API used by both the framework internally and app developers in hooks, services, and jobs. It abstracts query operations for internal (PostgreSQL/Kysely) and external (adapter-backed) models.

Today the API covers basic CRUD and query building but lacks bulk operations, aggregations, explicit transactions, and field-level access enforcement. App developers fall back to `ctx.db` for these gaps, creating inconsistency.

The goal is to stabilize `ctx.models` as a complete, ORM-like public API with:

- A contract-tested interface that guarantees stability across releases
- Consistent behavior whether the model is internal or external
- Feature coverage sufficient for building business apps and ERP systems without escaping to raw queries for common operations

---

## Design Decisions

- The interface in `@rangka/shared` is the public contract. App developers depend on it.
- An abstract test suite in shared defines every behavior guarantee. It runs against any `ModelAccess` implementation.
- An in-memory reference implementation in shared enables fast contract tests and serves as documentation.
- `@rangka/core` provides the real implementation (Kysely for internal, adapters for external).
- External adapters implement the same interface. Unsupported operations throw at call time (no capability declarations).
- Field-level access (`hidden`, `readOnly`) is enforced by `ctx.models` directly, not deferred to the API layer.
- Internal-only escape hatches (`.unsafe()`) exist in core but are NOT on the shared interface.
- One level of `$or` in filters. Arbitrary nesting is not supported. Use `ctx.db` for complex queries.
- Transactions are scoped to model operations only. No mixing with events or job enqueue inside a transaction.

---

## API Surface

### ModelAccess (top-level)

```typescript
interface ModelAccess {
  // Single record operations
  get(model: string, id: string): Promise<Record<string, unknown> | null>;
  create(model: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
  update(
    model: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
  delete(model: string, id: string): Promise<Record<string, unknown>>;

  // Bulk create
  createMany(model: string, data: Record<string, unknown>[]): Promise<Record<string, unknown>[]>;

  // Query builder
  query(model: string): ModelQuery;

  // Explicit transaction
  transaction(fn: (tx: ModelAccess) => Promise<void>): Promise<void>;
}
```

### ModelQuery (query builder)

```typescript
interface ModelQuery {
  // Filtering
  filter(conditions: FilterExpression): ModelQuery;
  search(term: string, fields?: string[]): ModelQuery;

  // Ordering
  sort(field: string, direction?: 'asc' | 'desc'): ModelQuery;

  // Pagination
  limit(count: number): ModelQuery;
  offset(count: number): ModelQuery;
  page(num: number): ModelQuery;

  // Selection
  fields(fieldNames: string[]): ModelQuery;
  include(relation: string): ModelQuery;

  // Scope control
  unscoped(): ModelQuery;
  includeArchived(): ModelQuery;

  // Aggregation
  groupBy(field: string): ModelQuery;
  groupBy(fields: string[]): ModelQuery;

  // Terminals — fetch
  exec(): Promise<QueryResult>;
  execWithMeta(): Promise<QueryResultWithMeta>;
  first(): Promise<Record<string, unknown> | null>;
  count(): Promise<number>;
  aggregate(spec: AggregateSpec): Promise<AggregateResult | GroupedAggregateResult>;

  // Terminals — bulk mutate
  updateAll(data: Record<string, unknown>): Promise<{ count: number }>;
  deleteAll(): Promise<{ count: number }>;
}
```

### Result Types

```typescript
interface QueryResult {
  data: Record<string, unknown>[];
  total?: number;
  hasMore?: boolean;
}

interface QueryResultWithMeta {
  data: Record<string, unknown>[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface AggregateResult {
  sum?: Record<string, number>;
  avg?: Record<string, number>;
  min?: Record<string, unknown>;
  max?: Record<string, unknown>;
  count?: number;
}

interface GroupedAggregateResult {
  groups: Array<{
    key: Record<string, unknown>;
    sum?: Record<string, number>;
    avg?: Record<string, number>;
    min?: Record<string, unknown>;
    max?: Record<string, unknown>;
    count?: number;
  }>;
}
```

---

## Filter Language

### Operators

```typescript
type FilterExpression = Record<string, FieldFilter> & { $or?: FilterExpression[] };

type FieldFilter =
  | unknown // equality shorthand
  | { eq: unknown }
  | { neq: unknown }
  | { gt: unknown }
  | { gte: unknown }
  | { lt: unknown }
  | { lte: unknown }
  | { in: unknown[] }
  | { notIn: unknown[] }
  | { contains: string } // case-insensitive substring
  | { startsWith: string }
  | { endsWith: string }
  | { is: null | 'not_null' }
  | { between: [unknown, unknown] }; // inclusive range
```

### Rules

- Multiple keys in one `.filter()` call are AND.
- Chained `.filter()` calls are AND.
- `$or` accepts an array of filter expressions. Each item is a flat AND group.
- One level of `$or` only. No nested `$or` inside `$or`.
- External adapters that cannot support `$or` throw "not supported" at call time.

### Examples

```typescript
// Simple equality + range
ctx.models.query('sales.invoice').filter({ status: 'paid', total: { gte: 1000 } });

// OR with AND groups
ctx.models.query('sales.invoice').filter({
  customer: customerId,
  $or: [
    { status: 'paid', total: { gte: 10000 } },
    { status: 'partial', due_date: { lt: today } },
  ],
});

// Date range + null check
ctx.models.query('hr.leave_request').filter({
  start_date: { between: ['2026-01-01', '2026-06-30'] },
  approved_by: { is: 'not_null' },
});
```

---

## Aggregate API

### Spec

```typescript
type AggregateSpec = {
  sum?: string | string[];
  avg?: string | string[];
  min?: string | string[];
  max?: string | string[];
  count?: true | string; // true = count(*), string = count(field)
};
```

### Usage

```typescript
// Without groupBy — returns AggregateResult
const result = await ctx.models
  .query('sales.invoice')
  .filter({ status: 'paid' })
  .aggregate({ sum: 'total', count: true });
// { sum: { total: 458000 }, count: 124 }

// With groupBy — returns GroupedAggregateResult
const result = await ctx.models
  .query('sales.invoice')
  .filter({ status: 'paid' })
  .groupBy('customer')
  .aggregate({ sum: 'total', count: true });
// { groups: [{ key: { customer: 'c1' }, sum: { total: 120000 }, count: 15 }, ...] }

// Multiple fields + multiple groups
const result = await ctx.models
  .query('sales.invoice')
  .groupBy(['status', 'currency'])
  .aggregate({ sum: ['total', 'tax'], count: true });
```

### Rules

- Scopes apply to aggregates (you only aggregate records you have access to).
- `.unscoped()` bypasses scope on aggregates as usual.
- `.aggregate()` without `.groupBy()` returns `AggregateResult`.
- `.aggregate()` with `.groupBy()` returns `GroupedAggregateResult`.

---

## Transaction API

### Usage

```typescript
await ctx.models.transaction(async (tx) => {
  const invoice = await tx.create('sales.invoice', { customer, total });
  await tx.createMany(
    'sales.invoice_item',
    items.map((i) => ({
      invoice: invoice.id,
      ...i,
    })),
  );
  await tx.update('sales.customer', customer, { last_invoice_date: today });
});
```

### Rules

- `tx` implements `ModelAccess`. Same interface, all ops share the transaction.
- Callback throws: transaction rolls back.
- Callback returns normally: transaction commits.
- Nested transactions throw (`tx.transaction()` is an error).
- Hooks triggered by writes inside a transaction run within that same transaction.
- External adapters that cannot support transactions throw "not supported" at call time.

---

## Field-Level Access Enforcement

### Behavior

| Field attribute  | On read (get/query/include) | On create             | On update           |
| ---------------- | --------------------------- | --------------------- | ------------------- |
| `hidden: true`   | Field stripped from result  | Allowed               | Allowed             |
| `readOnly: true` | Returned normally           | Allowed (initial set) | Rejected with error |

### Rules

- `hidden` fields are stripped from ALL read paths: `get`, `query().exec()`, `query().first()`, `.include()` results.
- `readOnly` fields are rejected on `update`, `updateAll`. Allowed on `create`, `createMany`.
- `.unscoped()` bypasses scope filtering but does NOT bypass field-level access.
- Internal-only `.unsafe()` (not on shared interface) bypasses field enforcement for framework internals (hook pipeline, audit, sync engine).

### Example

```typescript
// Model definition
defineModel({
  name: 'hr.employee',
  fields: {
    name: { type: 'string' },
    salary: { type: 'decimal', hidden: true },
    employee_id: { type: 'string', readOnly: true },
  },
});

// App developer experience
const emp = await ctx.models.get('hr.employee', id);
// emp.salary is NOT present

await ctx.models.update('hr.employee', id, { salary: 9000 });
// Throws: field "salary" is read-only

await ctx.models.create('hr.employee', { name: 'John', employee_id: 'E001', salary: 5000 });
// OK — readOnly and hidden fields allowed on create
```

---

## Error Types

```typescript
class ModelNotFoundError extends Error {
  model: string;
  id: string;
}

class ReadOnlyViolationError extends Error {
  model: string;
  field: string;
}

class UnsupportedOperationError extends Error {
  model: string;
  operation: string;
  reason: string; // e.g., "external adapter does not support transactions"
}

class ValidationError extends Error {
  model: string;
  issues: Array<{ field: string; message: string }>;
}
```

---

## Testing Architecture

### Abstract Contract Suite

Lives in `shared`. Defines every behavior guarantee. Parameterized to run against any implementation.

```typescript
// shared/src/model-api/__tests__/contract.ts
export function defineModelAccessContract(
  factory: () => Promise<{
    models: ModelAccess;
    seed: SeedFn;
    teardown: () => Promise<void>;
  }>,
) {
  describe('ModelAccess contract', () => {
    describe('get', () => {
      it('returns record by id');
      it('returns null for non-existent id');
      it('strips hidden fields');
    });

    describe('create', () => {
      it('returns created record with generated id');
      it('allows hidden fields in input');
      it('allows readOnly fields on create');
    });

    describe('update', () => {
      it('returns updated record');
      it('rejects readOnly field writes');
      it('throws ModelNotFoundError for non-existent id');
    });

    describe('delete', () => {
      it('returns deleted record');
      it('soft-deletes when model has soft_delete trait');
      it('throws ModelNotFoundError for non-existent id');
    });

    describe('createMany', () => {
      it('creates all records and returns them');
      it('is atomic — all or none');
    });

    describe('query.filter', () => {
      it('eq: exact match');
      it('neq: excludes value');
      it('gt/gte/lt/lte: numeric comparison');
      it('gt/gte/lt/lte: date comparison');
      it('in: set membership');
      it('notIn: set exclusion');
      it('contains: case-insensitive substring');
      it('startsWith: prefix match');
      it('endsWith: suffix match');
      it('is null');
      it('is not_null');
      it('between: inclusive range');
      it('$or: top-level disjunction');
      it('$or with AND groups');
      it('chained filters are AND');
    });

    describe('query.sort', () => {
      it('ascending by field');
      it('descending by field');
      it('multiple sort calls chain');
    });

    describe('query.pagination', () => {
      it('limit restricts result count');
      it('offset skips records');
      it('page calculates offset from limit');
      it('execWithMeta returns pagination metadata');
    });

    describe('query.include', () => {
      it('resolves link relationship');
      it('resolves hasMany relationship');
      it('resolves manyToMany relationship');
      it('strips hidden fields from included records');
    });

    describe('query.fields', () => {
      it('returns only specified fields');
      it('always includes id');
    });

    describe('query.search', () => {
      it('matches across specified fields');
      it('case-insensitive');
    });

    describe('scoping', () => {
      it('applies scope filter automatically');
      it('unscoped() bypasses scope');
      it('unscoped() does NOT bypass field access');
      it('includeArchived() includes soft-deleted');
    });

    describe('aggregate', () => {
      it('sum without groupBy');
      it('avg without groupBy');
      it('min/max without groupBy');
      it('count without groupBy');
      it('groupBy single field');
      it('groupBy multiple fields');
      it('respects filters');
      it('respects scopes');
    });

    describe('updateAll', () => {
      it('updates all matching records');
      it('returns affected count');
      it('respects scope');
      it('rejects readOnly fields');
    });

    describe('deleteAll', () => {
      it('deletes all matching records');
      it('returns affected count');
      it('respects scope');
      it('soft-deletes when applicable');
    });

    describe('transaction', () => {
      it('commits on normal return');
      it('rolls back on throw');
      it('nested transaction throws error');
      it('operations within use same transaction');
    });
  });
}
```

### Test Consumers

| Location                          | Implementation              | Purpose                                       |
| --------------------------------- | --------------------------- | --------------------------------------------- |
| `shared/src/model-api/__tests__/` | In-memory reference impl    | Fast contract tests, defines correct behavior |
| `tests/integration/model-api/`    | KyselyModelOps + PostgreSQL | Verifies real implementation correctness      |
| External adapter packages         | Adapter-specific            | Adapter authors prove compliance              |

---

## Architecture

```
shared/src/model-api/
├── types.ts                 — ModelAccess, ModelQuery, FilterExpression, AggregateSpec
├── errors.ts                — ModelNotFoundError, ReadOnlyViolation, UnsupportedOperation
├── in-memory.ts             — Reference implementation
└── __tests__/
    └── contract.ts          — Abstract test suite

core/src/model-api/
├── index.ts                 — createModelAccess() factory
├── query-builder.ts         — ModelQueryBuilder implements ModelQuery
├── kysely-ops.ts            — KyselyModelOps (PostgreSQL)
├── external-ops.ts          — ExternalModelOps (adapter delegation)
├── field-access.ts          — stripHidden(), enforceReadOnly()
├── scope-enforcer.ts        — applyScopeEnforcement()
├── include-resolver.ts      — relationship eager loading
├── transaction.ts           — transaction() wrapper
└── __tests__/
    └── integration.test.ts  — runs contract suite against PostgreSQL
```

### Package boundaries

- `shared` owns: interface types, error types, contract test suite, in-memory reference impl.
- `core` owns: real implementation (Kysely, adapters, scopes, permissions, transactions).
- App developers see: only what `shared` exports as `ModelAccessInterface` and `ModelQueryInterface`.
- Internal-only methods (`.unsafe()`, `.withAuth()`, `.filterRaw()`) exist in core implementation but are NOT on the shared interface.

---

## Migration Requirements

When implementing this spec:

1. **Refactor all internal framework usage** of `ctx.models` to use the new API consistently. Grep all `ctx.models` and `ctx.db` usage in core. Where `ctx.db` is used for operations the new API covers (bulk updates, simple aggregations), migrate to `ctx.models`.

2. **Update all developer-facing documentation:**
   - `CLAUDE.md` "Reusable logic" table must reflect new methods
   - `docs/concepts/` pages on models and hooks
   - `docs/reference/` API reference tables

3. **Update agent artifacts:**
   - Studio system prompts that reference `ctx.models` patterns
   - Any code generation templates that produce hook/service code

4. **Deprecation of direct `ctx.db` for covered operations:** Document that `ctx.db` is the escape hatch for operations beyond the model API (complex joins, raw SQL, window functions). It is not the recommended path for operations the model API supports.

---

## Implementation Order

1. Define types in `shared/src/model-api/types.ts`
2. Define error types in `shared/src/model-api/errors.ts`
3. Write the abstract contract test suite
4. Implement the in-memory reference implementation (make contract tests pass)
5. Refactor `core/src/model-api/` to implement the new interface
6. Add field-level access enforcement to core implementation
7. Add aggregate support to `KyselyModelOps`
8. Add `createMany`, `updateAll`, `deleteAll` to `KyselyModelOps`
9. Add `transaction()` wrapper
10. Run contract suite against real PostgreSQL (integration tests)
11. Migrate internal framework usage
12. Update documentation and agent artifacts

---

## Verification

1. `pnpm build` passes across all packages
2. Contract tests pass against in-memory implementation
3. Contract tests pass against PostgreSQL implementation (integration)
4. All existing tests still pass (no regression)
5. Field-level access is enforced consistently (hidden stripped, readOnly rejected)
6. Transactions commit/rollback correctly
7. Aggregates respect scopes
8. External model operations throw clear errors for unsupported ops
9. No internal framework code uses `ctx.db` for operations the model API now covers
