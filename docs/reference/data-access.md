---
status: stable
since: 0.1.0
last-updated: 2026-06-19
description: ctx.models and ctx.db — querying and mutating data from hooks, services, and jobs
---

# Data access

Two APIs for working with data inside hooks, services, and jobs.

| API          | Purpose                          | Hooks run | Permissions enforced | Scoping applied |
| ------------ | -------------------------------- | --------- | -------------------- | --------------- |
| `ctx.models` | High-level record operations     | Yes       | Yes                  | Yes             |
| `ctx.db`     | Raw SQL via Kysely query builder | No        | No                   | No              |

Use `ctx.models` by default. Use `ctx.db` when you need raw SQL, bulk operations, or cross-table joins that the model API does not support.

## ctx.models

The `ModelAccessInterface` provides CRUD operations and a chainable query builder. All operations respect hooks, permissions, and scoping.

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
| `.filter(conditions)`      | Add filter conditions                         |
| `.sort(field, direction?)` | Sort results. Direction defaults to `'asc'`   |
| `.limit(count)`            | Maximum records to return                     |
| `.offset(count)`           | Skip N records                                |
| `.page(num)`               | Set page number (1-indexed)                   |
| `.include(relation)`       | Eager-load a relationship                     |
| `.fields(names)`           | Select specific fields (`id` always included) |
| `.unscoped()`              | Bypass scope enforcement                      |
| `.includeArchived()`       | Include soft-deleted records                  |

#### Terminal methods

| Method            | Returns                                                        |
| ----------------- | -------------------------------------------------------------- |
| `.exec()`         | `{ data: Record[], total?: number, hasMore?: boolean }`        |
| `.execWithMeta()` | `{ data: Record[], meta: { total, page, limit, totalPages } }` |
| `.first()`        | First matching record or `null`                                |
| `.count()`        | Number of matching records                                     |

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

## ctx.db

Raw Kysely query builder. Use qualified model names and the `DatabaseClient` resolves them to table names automatically (e.g., `'sales.order'` becomes `sales__order`).

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

| Scenario                                         | Use          |
| ------------------------------------------------ | ------------ |
| CRUD from a hook or service                      | `ctx.models` |
| Need hooks to fire on the target model           | `ctx.models` |
| Need scope/permission enforcement                | `ctx.models` |
| Bulk update thousands of rows                    | `ctx.db`     |
| Complex joins or aggregations                    | `ctx.db`     |
| Schema migrations or DDL                         | `ctx.db`     |
| Performance-critical path avoiding hook overhead | `ctx.db`     |
