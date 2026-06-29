---
status: stable
since: 0.1.0
last-updated: 2026-06-29
description: Reusable business logic encapsulated as services
---

# Services

Business applications have logic between input and output. Pricing calculations, state transitions, document generation, integrations with external systems. A service is where that logic lives.

A service is a named, reusable unit of business logic. It can be called from an action button, from a hook, from another service, or from a background job.

## Defining a service

```typescript
import { defineService } from 'rangka';

export default defineService({
  name: 'sales.pricing',
  deps: ['inventory.stock'],

  factory(ctx) {
    return {
      async calculateItemRate(item, priceList, customer) {
        const baseRate = await ctx.models
          .query('sales.item_price')
          .filter({ item, price_list: priceList })
          .first();

        if (!baseRate) return 0;

        const discount = await this.getCustomerDiscount(customer, item);
        return baseRate.rate * (1 - discount / 100);
      },

      async getCustomerDiscount(customer, item) {
        const rule = await ctx.models
          .query('sales.pricing_rule')
          .filter({ customer, item })
          .first();

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

## Calling services

### From widget actions

When a service is bound to an action inside a data context, the framework passes the current record:

```typescript
// Page definition
widget.button('Submit', {
  on: { click: action.service('sales.submitOrder') },
});

// Service receives the record from context
defineService({
  name: 'sales.submitOrder',
  factory(ctx) {
    return {
      async execute(doc) {
        if (doc.status !== 'Draft') throw new Error('Can only submit drafts');
        await ctx.models.update('sales.order', doc.id, { status: 'Submitted' });
      },
    };
  },
});
```

Page-level actions pass params (or nothing):

```typescript
// Action with explicit params
action.service('sales.monthlyReport', { month: 6, year: 2026 });
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

        const total = await pricing.calculateOrderTotal(order.items);
        const invoice = await ctx.models.create('sales.invoice', { ... });

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
defineJob('sales.monthly-summary', {
  schedule: '0 6 1 * *',
  async handler(data, ctx) {
    const analytics = ctx.service('sales.analytics');
    const summary = await analytics.generateMonthlySummary(data.month);
    await ctx.email.send('monthly-summary', { to: data.recipients, data: summary });
  },
});
```

## The context

The factory function receives `FrameworkContext`:

| Field     | Description                               |
| --------- | ----------------------------------------- |
| `db`      | Raw database client for direct queries    |
| `models`  | Model access with scopes and permissions  |
| `service` | Call other services by name               |
| `enqueue` | Queue background jobs                     |
| `auth`    | Current user and their roles              |
| `scope`   | Active scope value (e.g. current company) |
| `events`  | Event bus for emit/subscribe              |
| `config`  | Application configuration                 |

## Error handling

Services reject by throwing errors. The framework handles the rest:

- **From an action**: the error message shows as a toast. The operation aborts.
- **From a hook**: the error aborts the save and returns 400.
- **From a job**: the error triggers retry logic.

```typescript
async execute(doc) {
  if (doc.status !== 'Draft') {
    throw new Error('Can only submit orders in Draft status');
  }
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
