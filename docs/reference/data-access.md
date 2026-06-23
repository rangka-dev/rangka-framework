---
status: stable
since: 0.1.0
last-updated: 2026-06-23
description: ctx.models and ctx.db — querying and mutating data from hooks, services, and jobs
---

# Data access

Two APIs for working with data inside hooks, services, and jobs.

| API          | Purpose                          | Hooks run | Permissions enforced | Scoping applied |
| ------------ | -------------------------------- | --------- | -------------------- | --------------- |
| `ctx.models` | High-level record operations     | Yes       | Yes                  | Yes             |
| `ctx.db`     | Raw SQL via Kysely query builder | No        | No                   | No              |

Use `ctx.models` by default. Use `ctx.db` when you need complex joins, window functions, or raw SQL that the model API does not support.

## ctx.models

The `ModelAccessInterface` provides CRUD, bulk operations, aggregates, transactions, and a chainable query builder. All operations respect permissions and scoping.

### Get a record

```ts
const order = await ctx.models.get('sales.order', id);
```

Returns the record or `null` if not found.

### Create a record

```ts
const invoice = await ctx.models.create('sales.invoice', {
  customer: customerId,
  posting_date: '2026-01-15',
});
```

Returns the created record with its generated `id`.

### Update a record

```ts
const updated = await ctx.models.update('sales.invoice', id, {
  status: 'submitted',
});
```

Returns the updated record.

### Delete a record

```ts
const deleted = await ctx.models.delete('sales.invoice', id);
```

Returns the deleted record. For models with the `soft_delete` trait, this sets `archived_at` instead of removing the row.

### Create many records

```ts
const items = await ctx.models.createMany('sales.invoice_item', [
  { invoice: invoiceId, product: 'P1', qty: 2, rate: 100 },
  { invoice: invoiceId, product: 'P2', qty: 1, rate: 250 },
]);
```

Creates all records atomically. Returns the created records with generated IDs.

### Transactions

```ts
await ctx.models.transaction(async (tx) => {
  const invoice = await tx.create('sales.invoice', { customer, posting_date: today });
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

All operations inside the callback share a single database transaction. If the callback throws, everything rolls back. Nested `tx.transaction()` calls are not allowed and will throw.

### Query records

`ctx.models.query(model)` returns a chainable query builder.

```ts
const result = await ctx.models
  .query('sales.order')
  .filter({ status: 'active', customer: customerId })
  .sort('posting_date', 'desc')
  .limit(25)
  .page(1)
  .include('customer')
  .fields(['id', 'order_number', 'total', 'status'])
  .exec();
```

#### Query builder methods

All methods return the builder for chaining. Call a terminal method to execute.

| Method                     | Description                                   |
| -------------------------- | --------------------------------------------- |
| `.filter(conditions)`      | Add filter conditions (AND with previous)     |
| `.search(term, fields?)`   | Case-insensitive substring search             |
| `.sort(field, direction?)` | Sort results. Direction defaults to `'asc'`   |
| `.limit(count)`            | Maximum records to return                     |
| `.offset(count)`           | Skip N records                                |
| `.page(num)`               | Set page number (1-indexed)                   |
| `.include(relation)`       | Eager-load a relationship                     |
| `.fields(names)`           | Select specific fields (`id` always included) |
| `.groupBy(field)`          | Group results for aggregation                 |
| `.unscoped()`              | Bypass scope enforcement                      |
| `.includeArchived()`       | Include soft-deleted records                  |

#### Terminal methods (fetch)

| Method             | Returns                                                        |
| ------------------ | -------------------------------------------------------------- |
| `.exec()`          | `{ data: Record[], total?: number, hasMore?: boolean }`        |
| `.execWithMeta()`  | `{ data: Record[], meta: { total, page, limit, totalPages } }` |
| `.first()`         | First matching record or `null`                                |
| `.count()`         | Number of matching records                                     |
| `.aggregate(spec)` | Aggregate results (see below)                                  |

#### Terminal methods (bulk mutate)

| Method             | Returns             | Description                 |
| ------------------ | ------------------- | --------------------------- |
| `.updateAll(data)` | `{ count: number }` | Update all matching records |
| `.deleteAll()`     | `{ count: number }` | Delete all matching records |

These bulk operations do not trigger hooks. Use single-record operations if hooks need to fire.

#### Filter operators

Pass a plain value for equality or an object with operators.

```ts
// Simple equality
.filter({ status: 'active' })

// Operator syntax
.filter({
  total: { gte: 1000 },
  status: { in: ['active', 'submitted'] },
  archived_at: { is: null },
  name: { contains: 'acme' },
  posting_date: { between: ['2026-01-01', '2026-06-30'] },
})

// $or: top-level disjunction
.filter({
  customer: customerId,
  $or: [
    { status: 'paid', total: { gte: 10000 } },
    { status: 'partial', due_date: { lt: today } },
  ],
})
```

| Operator     | Description                                |
| ------------ | ------------------------------------------ |
| `eq`         | Equal (default when passing a plain value) |
| `neq`        | Not equal                                  |
| `gt`         | Greater than                               |
| `gte`        | Greater than or equal                      |
| `lt`         | Less than                                  |
| `lte`        | Less than or equal                         |
| `in`         | Value is in array                          |
| `notIn`      | Value is not in array                      |
| `contains`   | Case-insensitive substring match           |
| `startsWith` | Starts with string                         |
| `endsWith`   | Ends with string                           |
| `is`         | `null` or `'not_null'`                     |
| `between`    | Inclusive range `[lower, upper]`           |

`$or` accepts an array of filter expressions. Each item is an AND group. One level of `$or` only. No nested `$or` inside `$or`.

#### Aggregates

```ts
// Sum and count without grouping
const result = await ctx.models
  .query('sales.invoice')
  .filter({ status: 'Paid' })
  .aggregate({ sum: 'grand_total', count: true });
// { sum: { grand_total: 458000 }, count: 124 }

// Grouped aggregation
const byCustomer = await ctx.models
  .query('sales.invoice')
  .filter({ status: 'Paid' })
  .groupBy('customer')
  .aggregate({ sum: 'grand_total', count: true });
// { groups: [{ key: { customer: 'c1' }, sum: { grand_total: 120000 }, count: 15 }, ...] }
```

Aggregate spec fields:

| Field   | Value                | Description                               |
| ------- | -------------------- | ----------------------------------------- |
| `sum`   | `string \| string[]` | Sum of field(s)                           |
| `avg`   | `string \| string[]` | Average of field(s)                       |
| `min`   | `string \| string[]` | Minimum of field(s)                       |
| `max`   | `string \| string[]` | Maximum of field(s)                       |
| `count` | `true \| string`     | `true` = count(\*), string = count(field) |

Without `.groupBy()`, returns `AggregateResult`. With `.groupBy()`, returns `GroupedAggregateResult` with a `groups` array.

## ctx.db

Raw Kysely query builder. Use for complex joins, window functions, and operations the model API does not cover. Does not enforce permissions, scoping, or trigger hooks.

### Select

```ts
const rows = await ctx.db
  .selectFrom('sales__order')
  .select(['id', 'order_number', 'total'])
  .where('status', '=', 'active')
  .orderBy('created_at', 'desc')
  .limit(10)
  .execute();
```

### Insert

```ts
const result = await ctx.db
  .insertInto('sales__order')
  .values({ order_number: 'ORD-001', customer_id: '...', total: 0 })
  .returning('id')
  .executeTakeFirst();
```

### Update

```ts
await ctx.db
  .updateTable('sales__order')
  .set({ status: 'cancelled' })
  .where('id', '=', orderId)
  .execute();
```

### Delete

```ts
await ctx.db.deleteFrom('sales__order').where('id', '=', orderId).execute();
```

### Transactions

```ts
await ctx.db.transaction(async (trx) => {
  const order = await trx
    .insertInto('sales__order')
    .values({ customer_id: customerId, total: 0 })
    .returning('id')
    .executeTakeFirst();

  await trx
    .insertInto('sales__order_item')
    .values({ order_id: order.id, product_id: productId, amount: 100 })
    .execute();
});
```

Transactions are atomic. If any statement throws, all changes roll back.

## When to use which

| Scenario                                          | Use          |
| ------------------------------------------------- | ------------ |
| CRUD from a hook or service                       | `ctx.models` |
| Bulk create multiple records                      | `ctx.models` |
| Aggregate (sum, avg, count) with optional groupBy | `ctx.models` |
| Transactional multi-record operations             | `ctx.models` |
| Bulk update/delete matching a filter              | `ctx.models` |
| Need scope/permission enforcement                 | `ctx.models` |
| Complex joins across multiple tables              | `ctx.db`     |
| Window functions or CTEs                          | `ctx.db`     |
| Schema migrations or DDL                          | `ctx.db`     |
| Performance-critical path avoiding hook overhead  | `ctx.db`     |
