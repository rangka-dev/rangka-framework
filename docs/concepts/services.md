---
status: stable
since: 0.1.0
last-updated: 2026-06-12
description: Reusable business logic encapsulated as services
---

# Services

Business applications are not just data in and data out. Between the input and the output lives logic. Pricing calculations, state transitions, document generation, integrations with external systems. This logic needs a home and in Rangka that home is a service.

A service is a named, reusable unit of business logic. It can be called from an action button, from a hook, from another service, or from a background job. It is the single place where you write code that _does something meaningful_ with your data.

## Defining a service

```typescript
// services/pricing.ts
import { defineService } from 'rangka';

export default defineService({
  name: 'sales.pricing',
  deps: ['inventory.stock'],

  factory(ctx) {
    return {
      async calculateItemRate(item, priceList, customer) {
        const baseRate = await ctx.db
          .selectFrom('sales.item_price')
          .where('item', '=', item)
          .where('price_list', '=', priceList)
          .select('rate')
          .executeTakeFirst();

        if (!baseRate) return 0;

        const discount = await this.getCustomerDiscount(customer, item);
        return baseRate.rate * (1 - discount / 100);
      },

      async getCustomerDiscount(customer, item) {
        const rule = await ctx.db
          .selectFrom('sales.pricing_rule')
          .where('customer', '=', customer)
          .where('item', '=', item)
          .select('discount_percent')
          .executeTakeFirst();

        return rule?.discount_percent || 0;
      },
    };
  },
});
```

## Configuration

| Field     | Type       | Description                                   |
| --------- | ---------- | --------------------------------------------- |
| `name`    | `string`   | Unique identifier (`{app}.{purpose}`)         |
| `deps`    | `string[]` | Other services that must be available         |
| `factory` | `function` | Returns the service instance with its methods |

## How services are called

Services can be called from multiple places. The calling context determines what data the service receives.

### From actions (most common)

When a service is bound to an action, the framework handles invocation:

**View-level action with a model source** receives the doc:

```typescript
// Page definition
actions: {
  row: [{ key: 'submit', label: 'Submit', service: 'sales.submitOrder' }],
}

// Service
defineService({
  name: 'sales.submitOrder',
  factory(ctx) {
    return {
      async execute(doc) {
        if (doc.status !== 'Draft') throw new Error('Can only submit drafts');
        if (!doc.items?.length) throw new Error('Order must have items');
        await ctx.db.update('sales.order', doc.id, { status: 'Submitted' });
      },
    };
  },
});
```

**Page-level action** receives params:

```typescript
// Page definition
actions: [
  { key: 'report', label: 'Monthly Report', service: 'sales.monthlyReport', params: { month: 6 } },
];

// Service
defineService({
  name: 'sales.monthlyReport',
  factory(ctx) {
    return {
      async execute(params) {
        return await ctx.db.query('sales.order', { filters: { month: params.month } });
      },
    };
  },
});
```

### From hooks

```typescript
defineHooks('sales.order', {
  async afterSave(doc, ctx) {
    const pricing = ctx.service('sales.pricing');
    await pricing.recalculateTotals(doc);
  },
});
```

### From other services

```typescript
defineService({
  name: 'sales.invoicing',
  deps: ['sales.pricing', 'accounting.ledger'],

  factory(ctx) {
    return {
      async createInvoice(order) {
        const pricing = ctx.service('sales.pricing');
        const ledger = ctx.service('accounting.ledger');

        const total = await pricing.calculateOrderTotal(order.items, order.price_list, order.customer);
        const invoice = await ctx.db.insertInto('sales.invoice').values({ ... }).execute();

        await ledger.postEntry({
          voucher_type: 'Sales Invoice',
          voucher_no: invoice.id,
          amount: total,
        });

        return invoice;
      },
    };
  },
});
```

### From jobs

```typescript
defineJob({
  name: 'sales.monthly-summary',
  schedule: '0 6 1 * *',
  async handler(data, ctx) {
    const analytics = ctx.service('sales.analytics');
    const summary = await analytics.generateMonthlySummary(data.month);
    await ctx.email.send('monthly-summary', { to: data.recipients, data: summary });
  },
});
```

## The context

The factory function receives access to the framework:

```typescript
interface ServiceContext {
  db: DatabaseClient;
  service(name: string): ServiceInstance;
  enqueue(job: string, data: unknown, opts?: JobOptions): Promise<void>;
  auth: { user: Record<string, unknown> | null; roles: string[] };
  scope: unknown;
  events: EventBus;
  config: Record<string, unknown>;
}
```

| Field     | Description                                            |
| --------- | ------------------------------------------------------ |
| `db`      | Database client for queries, inserts, updates, deletes |
| `service` | Call other services by name                            |
| `enqueue` | Queue background jobs                                  |
| `auth`    | Current user and their roles                           |
| `scope`   | Active scope value (e.g. current company)              |
| `events`  | Event bus for emit/subscribe                           |
| `config`  | Application configuration                              |

## Error handling

Services reject by throwing errors. The framework handles the rest depending on the calling context:

- **From an action**: the error message is shown as a toast in the UI. The operation is aborted.
- **From a hook**: the error aborts the save operation and returns a 400 to the client.
- **From a job**: the error triggers the job's retry logic.

```typescript
async execute(doc) {
  if (doc.status !== 'Draft') {
    throw new Error('Can only submit orders in Draft status');
  }
  // ...
}
```

## Dependency injection

Services declare dependencies via `deps`. The framework builds a dependency graph at boot, detects circular dependencies, and lazy-loads services on first access via `ctx.service()`. You do not wire anything manually.

## When to use a service vs a hook

| Service                           | Hook                                    |
| --------------------------------- | --------------------------------------- |
| Logic called from multiple places | Logic triggered by one specific event   |
| Complex, testable in isolation    | A few lines tied to a model's lifecycle |
| Bound to an action button         | Needs to validate before save           |
| Other services depend on it       | Needs side effects after a data change  |

The general principle: hooks own simple inline logic like validation and normalization. When the logic grows non-trivial or needs to be reused, the hook calls a service.
