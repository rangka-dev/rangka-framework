---
status: stable
since: 0.1.0
last-updated: 2026-06-12
description: 'Model hooks: validate, beforeSave, afterSave, beforeDelete, afterDelete'
---

# Hooks

Data has a lifecycle. A record is created, updated, submitted, deleted. At each of these moments you might need something to happen. Validate the data before it is saved. Enrich it with related information. Trigger a side effect after it persists. Hooks give you precise insertion points into this lifecycle.

They are small by design. A hook answers one question: "when this event happens to this model, what should run?"

## Defining hooks

```typescript
// modules/sales/hooks/order.ts
import { defineHooks } from 'rangka';

export default defineHooks('sales.order', {
  validate(doc) {
    if (!doc.items || doc.items.length === 0) {
      throw new Error('Sales Order must have at least one item');
    }
  },

  async beforeSave(doc, ctx) {
    doc.customer_name = await getCustomerName(doc.customer, ctx);
  },

  async afterCreate(doc, ctx) {
    await ctx.enqueue('sales.reserve-stock', { orderId: doc.id });
    await ctx.enqueue('sales.send-confirmation', { orderId: doc.id });
  },
});
```

## Available hooks

| Hook           | When                                 | Can modify doc | Can abort   |
| -------------- | ------------------------------------ | -------------- | ----------- |
| `validate`     | Before any write                     | No             | Yes (throw) |
| `beforeSave`   | Before create or update              | Yes            | Yes (throw) |
| `beforeCreate` | Before insert                        | Yes            | Yes (throw) |
| `beforeUpdate` | Before update                        | Yes            | Yes (throw) |
| `beforeDelete` | Before delete                        | No             | Yes (throw) |
| `afterSave`    | After create or update (post-commit) | No             | No          |
| `afterCreate`  | After insert                         | No             | No          |
| `afterUpdate`  | After update                         | No             | No          |
| `afterDelete`  | After delete                         | No             | No          |

## Execution order

```
1. validate
2. beforeSave
3. beforeCreate (or beforeUpdate)
4. --- database write ---
5. afterCreate (or afterUpdate)
6. --- transaction commits ---
7. afterSave (outside transaction, cannot roll back the write)
```

## The context object

The `ctx` parameter gives you access to the framework:

```typescript
interface FrameworkContext {
  db: DatabaseClient;
  schema: SchemaRegistry;
  scope: unknown;
  auth: { user: Record<string, unknown> | null; roles: string[] };
  config: Record<string, unknown>;
  events: { emit(event, payload): Promise<void> };
  service(name: string): ServiceInstance;
  enqueue(job, data, opts?): Promise<void>;
  notify(channel, message): void;
  email: { send(template, options): Promise<void> };
}
```

## Common patterns

### Validation

```typescript
defineHooks('sales.invoice', {
  validate(doc) {
    if (doc.posting_date > new Date()) {
      throw new Error('Posting date cannot be in the future');
    }
    for (const item of doc.items || []) {
      if (item.qty <= 0) {
        throw new Error(`Item ${item.item_name}: quantity must be positive`);
      }
    }
  },
});
```

Throwing an error aborts the operation and returns a 400 to the client.

### Data enrichment

```typescript
defineHooks('sales.order', {
  async beforeSave(doc, ctx) {
    if (doc.customer) {
      const customer = await ctx.db
        .selectFrom('sales.customer')
        .where('id', '=', doc.customer)
        .selectAll()
        .executeTakeFirst();

      doc.customer_name = customer?.customer_name;
      doc.currency = customer?.default_currency || 'USD';
    }
  },
});
```

### Side effects

```typescript
defineHooks('inventory.stock_entry', {
  async afterCreate(doc, ctx) {
    await ctx.service('inventory.stock').updateStockLedger(doc);
    await ctx.enqueue('inventory.reorder-check', { warehouse: doc.warehouse });
  },
});
```

### Preventing deletion

```typescript
defineHooks('sales.customer', {
  async beforeDelete(doc, ctx) {
    const orders = await ctx.db
      .selectFrom('sales.order')
      .where('customer', '=', doc.id)
      .select('id')
      .limit(1)
      .execute();

    if (orders.length > 0) {
      throw new Error('Cannot delete customer with existing orders');
    }
  },
});
```

## Multiple hook sources

A model can have hooks from its own module, from extensions, and from traits. They all chain together and execute in registration order. A `validate` hook that throws stops the entire pipeline.

## When to use hooks vs services vs computed fields

- **Hooks** for side effects and validation tied to data events. They can call services when the logic is complex.
- **Computed fields** for deriving values from other fields purely through calculation.
- **Services** for reusable logic called from multiple places (actions, other services, jobs).
