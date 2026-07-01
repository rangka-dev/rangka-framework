# Model API enhancements

> Status: Proposed
> Packages affected: `@rangka/shared` (types), `@rangka/core` (implementation)

Eight features that bring `ctx.models` closer to Odoo's ORM power while preserving Rangka's TypeScript-first, explicit, no-magic philosophy. Each feature is independently implementable and backward-compatible.

1. [Relation traversal in filters (dot notation)](#1-relation-traversal-in-filters)
2. [Nested boolean logic](#2-nested-boolean-logic)
3. [Stored computed fields](#3-stored-computed-fields)
4. [Context switching](#4-context-switching)
5. [Hierarchy operators](#5-hierarchy-operators)
6. [Result helpers](#6-result-helpers)
7. [Write-through relations](#7-write-through-relations)
8. [Aggregate enhancements](#8-aggregate-enhancements)

---

## 1. Relation traversal in filters

### Motivation

Odoo supports `('partner_id.country_id.code', '=', 'US')` to filter through relations without manual joins. Currently Rangka requires pre-fetching related IDs or dropping to raw Kysely. Dot-notation filters auto-resolve through the SchemaRegistry and generate JOINs transparently.

### API

```typescript
// Single hop (link/many-to-one)
ctx.models.query('sales.order').filter({ 'customer.country.code': 'US' }).exec();

// Works with all operators
ctx.models
  .query('sales.order')
  .filter({ 'customer.status': { in: ['active', 'vip'] } })
  .exec();

// hasMany/children: uses EXISTS subquery (no row multiplication)
ctx.models.query('sales.order').filter({ 'lines.product': 'widget' }).exec();
```

### Mechanics

1. `filter-translator.ts` detects dots in field names.
2. Resolves the path via `SchemaRegistry.getRelationshipsForModel()`, walking each segment.
3. For `link` relations: generates LEFT JOIN with table alias (`_j0`, `_j1`, ...).
4. For `hasMany`/`children`: generates `EXISTS (SELECT 1 FROM child_table WHERE fk = parent.id AND ...)`.
5. Stores join specs in `QueryState.joins`.
6. `KyselyModelOps.buildBaseQuery()` applies joins before filters.

Generated SQL (link traversal):

```sql
SELECT sales__order.*
FROM sales__order
LEFT JOIN sales__customer AS _j0 ON _j0.id = sales__order.customer
LEFT JOIN core__country AS _j1 ON _j1.id = _j0.country
WHERE _j1.code = 'US'
```

Generated SQL (hasMany traversal):

```sql
SELECT sales__order.*
FROM sales__order
WHERE EXISTS (
  SELECT 1 FROM sales__order_line
  WHERE sales__order_line.order_id = sales__order.id
    AND sales__order_line.product = 'widget'
)
```

### Type additions

```typescript
interface JoinSpec {
  alias: string;
  table: string;
  on: { left: string; right: string };
  type: 'left' | 'inner';
}

interface QueryState {
  // ...existing
  joins?: JoinSpec[];
}
```

### Constraints

- Max traversal depth: 3 hops. Deeper paths throw `UnsupportedOperationError`.
- `manyToMany` and `dynamicLink` not supported for traversal (ambiguous semantics). Throw with clear message.
- Scope enforcement applies to the root table only. Joined tables are not scope-filtered.
- Deduplication: `link` JOINs cannot produce duplicates (many-to-one). `hasMany` uses EXISTS which also cannot.

### SQLite

Identical behavior. SQLite supports LEFT JOIN and EXISTS. String operators use `LIKE` instead of `ILIKE` (already handled by `likeOp(dialect)`).

---

## 2. Nested boolean logic

### Motivation

Current `$or` is flat (one level). Nested `$or` throws `UnsupportedOperationError`. Odoo uses prefix-notation domains with arbitrary composition. We adopt a JSON-tree approach natural to TypeScript.

### API

```typescript
// Nested $or/$and
ctx.models
  .query('sales.order')
  .filter({
    $or: [
      { $and: [{ status: 'draft' }, { amount: { gte: 1000 } }] },
      { priority: { in: ['urgent', 'high'] } },
    ],
  })
  .exec();

// $not
ctx.models
  .query('sales.order')
  .filter({ $not: { status: 'cancelled' } })
  .exec();

// Arbitrary depth
ctx.models
  .query('sales.order')
  .filter({
    $or: [
      { $and: [{ status: 'draft' }, { $not: { archived: true } }] },
      { $and: [{ status: 'sent' }, { due_date: { lt: '2026-01-01' } }] },
    ],
  })
  .exec();
```

### Type changes

```typescript
export interface FilterExpression {
  $or?: FilterExpression[];
  $and?: FilterExpression[];
  $not?: FilterExpression;
  [field: string]: FilterValue | FilterExpression[] | FilterExpression | undefined;
}
```

### Mechanics

1. `translateFilters()` becomes recursive. Produces a tree of `BooleanFilter` nodes:

```typescript
export interface BooleanFilter {
  operator: '$or' | '$and' | '$not';
  children: AppliedFilter[];
}

export type AppliedFilter = TranslatedFilter | OrFilter | BooleanFilter;
```

2. `filter-applier.ts` handles the tree recursively via Kysely's expression builder (`eb.or(...)`, `eb.and(...)`, `eb.not(...)`).

3. Existing flat `$or` remains valid (backward-compatible). The existing `OrFilter` type is preserved as a fast path.

### Constraints

- Max nesting depth: 4 levels. Deeper throws to prevent pathological query plans.
- Empty `$or: []` evaluates to `FALSE` (no rows match).
- Empty `$and: []` evaluates to `TRUE` (no constraint).
- `$not: {}` evaluates to `TRUE`.
- Top-level keys remain implicitly AND'd (unchanged).

### SQLite

Full compatibility. SQLite WHERE supports arbitrary AND/OR/NOT nesting.

---

## 3. Stored computed fields

### Motivation

Odoo's `@api.depends` with `store=True` lets you define derived fields that auto-recompute on dependency writes. The value is persisted, making the field filterable, sortable, and aggregatable. Currently Rangka has `ComputedFieldConfig` but only for external models (evaluated post-fetch, never stored).

### API

Model definition:

```typescript
import { defineModel, field } from 'rangka';

export default defineModel({
  name: 'sales.order_line',
  fields: {
    quantity: field.decimal(),
    unit_price: field.decimal(),
    discount: field.decimal({ default: 0 }),
    subtotal: field.computed({
      resultType: 'decimal',
      depends: ['quantity', 'unit_price', 'discount'],
      store: true,
      compute(doc) {
        const qty = Number(doc.quantity ?? 0);
        const price = Number(doc.unit_price ?? 0);
        const disc = Number(doc.discount ?? 0);
        return qty * price * (1 - disc / 100);
      },
    }),
  },
});
```

YAML alternative:

```yaml
fields:
  subtotal:
    type: computed
    resultType: decimal
    depends: [quantity, unit_price, discount]
    store: true
    compute: 'doc.quantity * doc.unit_price * (1 - doc.discount / 100)'
```

Usage (stored fields behave like regular columns):

```typescript
ctx.models
  .query('sales.order_line')
  .filter({ subtotal: { gte: 500 } })
  .sort('subtotal', 'desc')
  .aggregate({ sum: 'subtotal' });
```

### Type changes

```typescript
export interface ComputedFieldConfig {
  type: 'computed';
  depends: string[];
  compute: (doc: Record<string, unknown>, ctx?: FrameworkContext) => unknown | Promise<unknown>;
  store?: boolean; // default: false. When true, creates DB column.
  resultType: 'string' | 'int' | 'decimal' | 'boolean' | 'date' | 'datetime' | 'text';
}
```

### Mechanics

**Schema/DDL:**

- `store: true` causes DiffEngine to create a real column based on `resultType`.
- Column type maps to the same types as regular scalar fields.

**Write pipeline (auto-recomputation):**

1. A built-in recomputation step runs between `beforeSave` hooks and the DB write.
2. On `create`: evaluate all stored computed fields, include values in INSERT.
3. On `update`: check if any `depends` fields are in the update payload. If yes, re-evaluate and include new value.
4. Topological sort ensures correct order when computed fields depend on other computed fields. Circular deps throw at boot.

**Read pipeline:**

- `store: true`: read directly from column. No post-fetch evaluation.
- `store: false`: evaluated post-fetch (like external model computed fields today).

**Bulk operations:**

- `updateAll()` on models with stored computed fields that depend on affected columns: throw `UnsupportedOperationError`. Bulk recomputation requires fetching every record which defeats the purpose of `updateAll`.
- Provide `ctx.models.recompute('model', ids?)` for explicit batch recomputation (maintenance tool).

### Constraints

- `depends` must reference fields on the same model. Cross-model deps use `afterSave` hooks on the child model to trigger parent recomputation.
- `ctx` param in compute: available during writes (hook context). NOT available during post-fetch evaluation of non-stored fields.
- Async compute functions: supported (hook pipeline is already async).
- Boot validation: all `depends` fields must exist, no circular deps.

### SQLite

Full compatibility. Stored computed fields are regular columns. Compute runs in Node.js.

---

## 4. Context switching

### Motivation

Odoo's `self.sudo()` bypasses access rules for system operations. Rangka has `.unscoped()` on the query builder but not on direct CRUD. Hooks and services often need to read/write records outside the current user's scope.

### API

```typescript
// Unscoped: bypasses scope filters, keeps field permissions
ctx.models.unscoped().get('model', id);
ctx.models.unscoped().create('model', data);
ctx.models.unscoped().update('model', id, data);
ctx.models.unscoped().delete('model', id);
ctx.models.unscoped().createMany('model', data);
ctx.models.unscoped().query('model'); // returns unscoped query builder

// Elevated: bypasses scopes AND field permissions (hidden fields visible, readOnly writable)
ctx.models.elevated().get('model', id);
ctx.models.elevated().update('model', id, data);
ctx.models.elevated().create('model', data);
ctx.models.elevated().delete('model', id);
ctx.models.elevated().query('model');

// Works within transactions
await ctx.models.transaction(async (tx) => {
  await tx.elevated().update('core.counter', id, { value: newValue });
});
```

### Type changes

```typescript
export interface ModelAccessInterface {
  // ...existing methods...

  /** Bypasses scope filters. Field permissions still apply. */
  unscoped(): ModelAccessInterface;

  /** Bypasses scopes AND field-level permissions. */
  elevated(): ModelAccessInterface;
}
```

### Mechanics

1. `createModelAccess` returns a proxy that can produce modified instances:
   - `unscoped()`: clears `auth.scopeFilters` from the internal options. Field access enforcement still runs.
   - `elevated()`: clears `auth` entirely AND disables `stripHiddenFields` + `enforceReadOnly`.

2. Internal mode:

```typescript
type ModelAccessMode = 'normal' | 'unscoped' | 'elevated';
```

3. `elevated()` is a superset of `unscoped()`. Calling both produces elevated.

### Constraints

- `elevated()` is for system-level operations in hooks/services. Should never be exposed to API routes directly.
- Audit trail preserved: `created_by`/`updated_by` still records the current auth user (if any).
- Transaction propagation: `tx.elevated()` shares the transaction, just changes mode.

### SQLite

No SQL differences. Purely application-level check toggling.

---

## 5. Hierarchy operators

### Motivation

Odoo's `child_of`/`parent_of` operators query tree structures efficiently. Rangka already has the `tree` field type with `materialized_path` strategy that stores a `path` column. The missing piece is filter operators that leverage it.

### API

```typescript
// All descendants (inclusive)
ctx.models
  .query('accounting.account')
  .filter({ id: { childOf: parentAccountId } })
  .exec();

// All descendants (exclusive)
ctx.models
  .query('accounting.account')
  .filter({ id: { childOf: { id: parentAccountId, includeSelf: false } } })
  .exec();

// All ancestors (inclusive)
ctx.models
  .query('accounting.account')
  .filter({ id: { parentOf: leafAccountId } })
  .exec();

// Combine with other filters
ctx.models
  .query('accounting.account')
  .filter({ id: { childOf: parentId }, active: true })
  .exec();
```

### Type changes

```typescript
export interface FilterOperators {
  // ...existing...
  childOf?: string | { id: string; includeSelf?: boolean };
  parentOf?: string | { id: string; includeSelf?: boolean };
}
```

### Mechanics

Depends on the model's tree strategy.

**materialized_path** (recommended):

The `path` column stores `/root-id/parent-id/self-id/`.

- `childOf(parentId)`: fetch parent's `path`, then `WHERE path LIKE '{parentPath}%'`.
- `parentOf(leafId)`: fetch leaf's `path`, extract ancestor IDs, then `WHERE id IN (ancestors)`.

```sql
-- childOf
SELECT path FROM accounting__account WHERE id = $1;
-- Returns: '/root-id/parent-id/'

SELECT * FROM accounting__account WHERE path LIKE '/root-id/parent-id/%';
```

```sql
-- parentOf
SELECT path FROM accounting__account WHERE id = $1;
-- Returns: '/root-id/parent-id/leaf-id/'
-- Extracted ancestors: ['root-id', 'parent-id', 'leaf-id']

SELECT * FROM accounting__account WHERE id IN ('root-id', 'parent-id', 'leaf-id');
```

**closure_table**:

- `childOf`: `WHERE id IN (SELECT descendant_id FROM {closure} WHERE ancestor_id = $1)`
- `parentOf`: `WHERE id IN (SELECT ancestor_id FROM {closure} WHERE descendant_id = $1)`

**nested_set**:

- `childOf`: fetch parent's `lft`/`rgt`, then `WHERE lft >= $parentLft AND rgt <= $parentRgt`
- `parentOf`: fetch leaf's `lft`/`rgt`, then `WHERE lft <= $leafLft AND rgt >= $leafRgt`

### Implementation detail

The filter translator produces a `HierarchyFilter` variant:

```typescript
export interface HierarchyFilter {
  operator: 'childOf' | 'parentOf';
  field: string;
  targetId: string;
  includeSelf: boolean;
  treeField: string;
}
```

`KyselyModelOps` handles this by performing a preliminary query (fetch target's path/lft/rgt) then applying the appropriate WHERE clause to the main query.

### Constraints

- Model must have a `tree` field. Using `childOf`/`parentOf` on a model without one throws `UnsupportedOperationError`.
- Target record not found: returns empty result set (not an error).
- `includeSelf` defaults to `true`.
- Performance: `materialized_path` LIKE prefix is index-friendly with `text_pattern_ops` on PostgreSQL. Document that apps should index the `path` column.
- One tree field per model. Boot validation throws if multiple exist.

### SQLite

Full compatibility. LIKE prefix, IN subqueries, and comparison operators all work identically.

---

## 6. Result helpers

### Motivation

Odoo recordsets provide `mapped()`, `filtered()`, `sorted()` directly on results. Rangka intentionally avoids lazy-proxy recordsets but can provide utility methods on `QueryResult` for common post-fetch operations.

### API

```typescript
const result = await ctx.models.query('sales.order').filter({ status: 'confirmed' }).exec();

result.ids();
// ['id-1', 'id-2', 'id-3']

result.pluck('amount');
// [1500, 2300, 800]

result.pluck('amount', 'customer');
// [{ amount: 1500, customer: 'c1' }, { amount: 2300, customer: 'c2' }]

result.groupBy('status');
// { confirmed: [...], shipped: [...] }

result.sumBy('amount');
// 4600

result.where((r) => Number(r.amount) > 1000);
// QueryResult with filtered data

result.sortBy('amount', 'desc');
// QueryResult with re-sorted data
```

### Type changes

```typescript
export interface QueryResult {
  data: Record<string, unknown>[];
  total?: number;
  hasMore?: boolean;

  ids(): string[];
  pluck(field: string): unknown[];
  pluck(...fields: string[]): Record<string, unknown>[];
  groupBy(field: string): Record<string, Record<string, unknown>[]>;
  sumBy(field: string): number;
  where(predicate: (record: Record<string, unknown>) => boolean): QueryResult;
  sortBy(field: string, direction?: 'asc' | 'desc'): QueryResult;
}
```

### Mechanics

Introduce `QueryResultSet` class that implements `QueryResult`:

```typescript
class QueryResultSet implements QueryResult {
  readonly data: Record<string, unknown>[];
  readonly total?: number;
  readonly hasMore?: boolean;

  ids() {
    return this.data.map((r) => r.id as string);
  }

  pluck(...fields: string[]) {
    if (fields.length === 1) return this.data.map((r) => r[fields[0]]);
    return this.data.map((r) => Object.fromEntries(fields.map((f) => [f, r[f]])));
  }

  groupBy(field: string) {
    const groups: Record<string, Record<string, unknown>[]> = {};
    for (const r of this.data) {
      const key = String(r[field] ?? '');
      (groups[key] ??= []).push(r);
    }
    return groups;
  }

  sumBy(field: string) {
    return this.data.reduce((sum, r) => sum + Number(r[field] ?? 0), 0);
  }

  where(predicate: (r: Record<string, unknown>) => boolean) {
    return new QueryResultSet(this.data.filter(predicate), this.total, this.hasMore);
  }

  sortBy(field: string, direction: 'asc' | 'desc' = 'asc') {
    const sorted = [...this.data].sort((a, b) => {
      const cmp = a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0;
      return direction === 'desc' ? -cmp : cmp;
    });
    return new QueryResultSet(sorted, this.total, this.hasMore);
  }
}
```

`ModelQueryBuilder.exec()` returns `QueryResultSet` instead of a plain object. Backward-compatible since it satisfies the existing shape (data/total/hasMore are still accessible).

### Constraints

- `ids()` assumes records have `id`. The query builder always includes `id` in SELECT.
- `sumBy()` on non-numeric fields returns `NaN`. Caller's responsibility.
- `where()` and `sortBy()` are immutable (return new instance).
- These are in-memory utilities on fetched data. No additional queries.
- `execWithMeta()` also returns enriched results. `meta` property preserved.

### SQLite

No SQL involvement. Pure JavaScript utilities.

---

## 7. Write-through relations

### Motivation

Odoo uses Command tuples for relational writes in a single call. Creating an order with its lines currently requires a manual transaction with separate `create` calls. Write-through lets you express parent + children atomically in one call.

### API

```typescript
// Create with children
await ctx.models.create('sales.order', {
  customer: customerId,
  status: 'draft',
  lines: {
    create: [
      { product: 'widget', quantity: 5, unit_price: 10 },
      { product: 'gadget', quantity: 2, unit_price: 25 },
    ],
  },
});

// Update with mixed child operations
await ctx.models.update('sales.order', orderId, {
  status: 'confirmed',
  lines: {
    create: [{ product: 'extra', quantity: 1, unit_price: 5 }],
    update: [{ id: 'line-1', quantity: 10 }],
    delete: ['line-2', 'line-3'],
  },
});

// Many-to-many: set/add/remove
await ctx.models.update('hr.employee', empId, {
  skills: {
    set: ['skill-1', 'skill-2'], // replace all
    add: ['skill-3'], // append
    remove: ['skill-4'], // detach
  },
});
```

### Type additions

```typescript
// For hasMany/children relations
export interface HasManyWriteCommands {
  create?: Record<string, unknown>[];
  update?: Array<{ id: string } & Record<string, unknown>>;
  delete?: string[];
}

// For manyToMany relations
export interface ManyToManyWriteCommands {
  set?: string[];
  add?: string[];
  remove?: string[];
}
```

Detection is based on the field's type in SchemaRegistry. When the value for a relational field is an object with `create`/`update`/`delete`/`set`/`add`/`remove` keys, it's treated as a write command.

### Mechanics

1. Before the main write, inspect data payload for keys matching relational fields.
2. Extract relational commands from payload (not written to parent row).
3. All operations run in a single transaction.

**Order of operations:**

1. Parent `beforeSave` hooks
2. Parent DB write (INSERT or UPDATE)
3. Child `delete` operations (free constraints first)
4. Child `update` operations
5. Child `create` operations (foreign key set to parent ID)
6. Many-to-many junction table operations (`set`/`add`/`remove`)
7. Parent `afterSave` hooks

**For hasMany/children:**

- `create`: INSERT with `foreignKey` set to parent's ID.
- `update`: UPDATE by `id`. Validates record belongs to parent (FK check).
- `delete`: DELETE by `id`. Validates record belongs to parent.

**For manyToMany:**

- `set`: DELETE all existing junction rows for parent, INSERT new ones.
- `add`: INSERT junction rows (skip duplicates via ON CONFLICT DO NOTHING).
- `remove`: DELETE specific junction rows.

Child writes trigger the child model's own hook pipeline (validation runs).

### Constraints

- One level deep only. Nested commands within child `create` data throw.
- `link` fields not supported (just set the ID directly on the parent).
- `update` commands must include `id`. `delete` is an array of IDs.
- Ownership validation: child's FK must point to the parent. Throws `ValidationError` otherwise.
- Return value: parent record only. Use `.include()` after to fetch children.
- `createMany` does not support nested writes. Throws if detected.

### SQLite

Full compatibility. Standard INSERT/UPDATE/DELETE on related tables.

---

## 8. Aggregate enhancements

### Motivation

The current `AggregateSpec` covers `sum`, `avg`, `min`, `max`, `count`. Missing functions needed for reporting: `countDistinct`, `arrayAgg`, and date-based grouping (by month/quarter/year).

### API

```typescript
// countDistinct
await ctx.models.query('sales.order').aggregate({ countDistinct: 'customer' });
// → { countDistinct: { customer: 42 } }

// arrayAgg
await ctx.models.query('sales.order').groupBy('customer').aggregate({ arrayAgg: 'status' });
// → { groups: [{ key: 'cust-1', arrayAgg: { status: ['draft', 'sent', 'done'] } }] }

// Date-based grouping with truncation
await ctx.models
  .query('sales.order')
  .groupBy('created_at:month')
  .aggregate({ sum: 'amount', count: true });
// → { groups: [{ key: '2026-01', sum: { amount: 15000 }, count: 34 }, ...] }

// Quarter grouping
await ctx.models.query('sales.order').groupBy('created_at:quarter').aggregate({ sum: 'amount' });
// → { groups: [{ key: '2026-Q1', ... }, { key: '2026-Q2', ... }] }

// Year grouping
await ctx.models.query('sales.order').groupBy('date_order:year').aggregate({ count: true });

// Week grouping
await ctx.models.query('sales.order').groupBy('created_at:week').aggregate({ sum: 'amount' });
```

### Type changes

```typescript
export interface AggregateSpec {
  sum?: string | string[];
  avg?: string | string[];
  min?: string | string[];
  max?: string | string[];
  count?: true | string;
  countDistinct?: string | string[]; // NEW
  arrayAgg?: string | string[]; // NEW
}

export interface AggregateResult {
  sum?: Record<string, number>;
  avg?: Record<string, number>;
  min?: Record<string, unknown>;
  max?: Record<string, unknown>;
  count?: number;
  countDistinct?: Record<string, number>; // NEW
  arrayAgg?: Record<string, unknown[]>; // NEW
}

// Date-based groupBy accepts 'field:truncation' syntax
// Supported truncations: 'year', 'quarter', 'month', 'week', 'day'
```

### Mechanics

**countDistinct:**

```sql
SELECT COUNT(DISTINCT customer) AS countDistinct_customer FROM sales__order
```

**arrayAgg:**

```sql
-- PostgreSQL
SELECT customer, ARRAY_AGG(status) AS arrayAgg_status
FROM sales__order GROUP BY customer

-- SQLite: use GROUP_CONCAT then split in JS
SELECT customer, GROUP_CONCAT(status, '|||') AS arrayAgg_status
FROM sales__order GROUP BY customer
```

**Date truncation in groupBy:**

Parse the `:truncation` suffix from the groupBy field. Generate dialect-specific date truncation:

```sql
-- PostgreSQL
SELECT DATE_TRUNC('month', created_at) AS _group_key, SUM(amount)
FROM sales__order GROUP BY _group_key

-- SQLite
SELECT STRFTIME('%Y-%m', created_at) AS _group_key, SUM(amount)
FROM sales__order GROUP BY _group_key
```

Format mapping:

| Truncation | PostgreSQL                   | SQLite                                                                                | Key format   |
| ---------- | ---------------------------- | ------------------------------------------------------------------------------------- | ------------ |
| year       | `DATE_TRUNC('year', col)`    | `STRFTIME('%Y', col)`                                                                 | `2026`       |
| quarter    | `DATE_TRUNC('quarter', col)` | `STRFTIME('%Y', col) \|\| '-Q' \|\| ((CAST(STRFTIME('%m', col) AS INT) - 1) / 3 + 1)` | `2026-Q1`    |
| month      | `DATE_TRUNC('month', col)`   | `STRFTIME('%Y-%m', col)`                                                              | `2026-01`    |
| week       | `DATE_TRUNC('week', col)`    | `STRFTIME('%Y-W%W', col)`                                                             | `2026-W01`   |
| day        | `DATE_TRUNC('day', col)`     | `STRFTIME('%Y-%m-%d', col)`                                                           | `2026-01-15` |

### Constraints

- `arrayAgg` on SQLite uses `GROUP_CONCAT` with a delimiter. Values containing the delimiter break parsing. Use `'|||'` (unlikely in real data). Document the limitation.
- `arrayAgg` without `groupBy` returns a single array of all values for that field.
- `countDistinct` with null values: nulls are excluded (standard SQL behavior).
- Date truncation requires the field to be `date` or `datetime` type. Throw if used on other types (boot-time validation not possible, runtime check).

### SQLite

- `countDistinct`: `COUNT(DISTINCT col)` works natively.
- `arrayAgg`: uses `GROUP_CONCAT` + JS split. Documented delimiter limitation.
- Date truncation: uses `STRFTIME` (see table above). Quarter requires a computed expression.

---

## Implementation priority

Recommended order based on impact vs effort:

| Priority | Feature                 | Effort | Impact                                                 |
| -------- | ----------------------- | ------ | ------------------------------------------------------ |
| 1        | Nested boolean logic    | Small  | Unblocks complex reporting filters                     |
| 2        | Context switching       | Small  | Immediate DX win for hooks/services                    |
| 3        | Result helpers          | Small  | Reduces boilerplate in every query consumer            |
| 4        | Relation traversal      | Medium | Highest daily-use impact                               |
| 5        | Aggregate enhancements  | Medium | Unlocks dashboards and reporting                       |
| 6        | Write-through relations | Medium | Simplifies parent-child writes                         |
| 7        | Hierarchy operators     | Medium | Required for chart of accounts, categories             |
| 8        | Stored computed fields  | Large  | Biggest architectural change, biggest long-term payoff |

---

## External model compatibility

External models are adapter-backed (no local SQL table). They route operations through `ExternalModelOps` with capabilities declared per adapter (`['read']`, `['read', 'write']`). Not all features translate to external APIs.

### Compatibility matrix

| Feature                    | External model support | Notes                                                                                                                                                                                                                                               |
| -------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Dot-notation filters    | Partial                | Works if all hops stay within internal models. If any segment resolves to an external model, throw `UnsupportedOperationError`. External models can be the root of a query but cannot be joined into.                                               |
| 2. Nested boolean logic    | Adapter-dependent      | The filter translator produces `AppliedFilter[]` which adapters already consume via their `list()` method. If the adapter supports `$or`/`$and`/`$not` in its filter interface, it works. Otherwise the adapter throws `UnsupportedOperationError`. |
| 3. Stored computed fields  | No                     | External models have no DB column to store into. They retain their existing non-stored computed fields (evaluated post-fetch via `evaluateComputedFields()`). Declaring `store: true` on an external model field throws at boot validation.         |
| 4. Context switching       | Yes                    | `unscoped()` and `elevated()` are application-level checks in `ModelAccess`. External model operations already flow through `ModelAccess` which handles auth/scope toggling. No adapter changes needed.                                             |
| 5. Hierarchy operators     | No                     | Requires `path`/`lft`/`rgt` columns in the database. External models don't have tree infrastructure. Using `childOf`/`parentOf` on an external model throws `UnsupportedOperationError`.                                                            |
| 6. Result helpers          | Yes                    | Pure in-memory utilities on `QueryResult`. Works regardless of data source. No adapter involvement.                                                                                                                                                 |
| 7. Write-through relations | Partial                | See breakdown below.                                                                                                                                                                                                                                |
| 8. Aggregate enhancements  | Adapter-dependent      | `countDistinct` and `arrayAgg` require adapter support. Date-based grouping requires `DATE_TRUNC` equivalent which most adapters cannot provide. Unsupported operations throw.                                                                      |

### Write-through relations with external models

| Scenario                            | Supported | Behavior                                                                                                                                |
| ----------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Internal parent + internal children | Yes       | Full support (transaction-wrapped)                                                                                                      |
| Internal parent + external children | Partial   | Works if adapter has `create`/`update`/`delete` capabilities. No transaction guarantee across the boundary. Operations are best-effort. |
| External parent + internal children | No        | External models don't run through our hook pipeline. Throw `UnsupportedOperationError`.                                                 |
| External parent + external children | No        | No hook pipeline, no transaction. Throw `UnsupportedOperationError`.                                                                    |

When write-through targets an external child model, the framework:

1. Executes the internal parent write within a transaction (as normal).
2. Executes external child operations outside the transaction via the adapter.
3. If an external child operation fails after the parent committed, the error propagates but the parent write is not rolled back. Document this as an at-most-once guarantee for cross-boundary writes.

### Adapter interface extensions

Adapters that want to support new features can opt in by declaring capabilities:

```typescript
interface AdapterCapabilities {
  read: boolean;
  write: boolean;
  // New optional capabilities
  nestedFilters?: boolean; // supports $or/$and/$not in filter interface
  countDistinct?: boolean; // supports countDistinct aggregation
  arrayAgg?: boolean; // supports arrayAgg aggregation
}
```

When a feature requires an undeclared capability, the framework throws `UnsupportedOperationError` with a message indicating which capability the adapter is missing. This lets adapter authors incrementally adopt new features.

### Design principle

External models are leaf nodes in the query graph. They can be:

- The root of a query (with adapter-supported filters/aggregations)
- Included via `.include()` (post-query batch resolution, existing behavior)
- Targets of write-through commands (if adapter has write capabilities)

They cannot be:

- Joined into via dot-notation traversal
- Sources of stored computed fields
- Tree-structured with hierarchy operators

This boundary is explicit and enforced at runtime with clear error messages rather than silent degradation.

---

## Design principles

- **TypeScript-first.** Leverage the type system. Filter expressions, write commands, and result helpers are all statically typed.
- **Explicit over magic.** No lazy loading, no hidden queries, no proxy objects. You know exactly when SQL runs.
- **Composable.** Features combine naturally. Dot-notation works inside `$or`. Hierarchy operators work with `.include()`. Write-through runs within transactions.
- **Dialect-aware.** Every feature works on PostgreSQL and SQLite with graceful degradation where needed (documented).
- **Backward-compatible.** All existing code continues to work unchanged. New features are additive.
