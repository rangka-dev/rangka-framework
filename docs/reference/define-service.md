---
status: stable
since: 0.1.0
last-updated: 2026-06-29
description: defineService() API — service definition and dependency injection
---

# defineService

Declares a service. Services are named collections of methods available via dependency injection throughout the framework. They are the home for all business logic.

See [Services concept](../concepts/services.md) for usage patterns.

## Signature

```typescript
import { defineService } from 'rangka';

export default defineService({
  name: 'sales.pricing',
  deps: ['inventory.stock'],
  factory: (ctx) => ({
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
  }),
});
```

## Function Signature

```typescript
function defineService<T extends ServiceConfig>(config: T): T;
```

| Parameter        | Type         | Description                                                                                         |
| ---------------- | ------------ | --------------------------------------------------------------------------------------------------- |
| `config.name`    | `string`     | **Required.** Unique service identifier used for injection.                                         |
| `config.deps`    | `string[]`   | Optional. Other services this service depends on. Used for circular dependency detection.           |
| `config.factory` | `(ctx) => T` | **Required.** Factory function that receives the framework context and returns the service methods. |

## FrameworkContext

The factory function receives the universal `FrameworkContext`. This is the same context available in hooks, jobs, and other extension points.

```typescript
interface FrameworkContext {
  db: DatabaseClient;
  schema: SchemaRegistry;
  auth: { user: ContextUser | null; roles: string[] };
  scope: unknown;
  config: Record<string, unknown>;
  models: ModelAccessInterface;
  service: (name: string) => ServiceInstance;
  enqueue: (job: string, data: unknown, opts?: JobOptions) => Promise<void>;
  events: {
    emit: (event: string, payload: unknown) => Promise<void>;
    on: (event: string, handler: (payload: unknown) => Promise<void>) => void;
  };
  notify: (channel: string, message: unknown) => void;
  email: { send: (template: string, options: Record<string, unknown>) => Promise<void> };
}
```

| Field     | Type                   | Description                                                |
| --------- | ---------------------- | ---------------------------------------------------------- |
| `db`      | `DatabaseClient`       | Raw database escape hatch for direct queries via Kysely.   |
| `schema`  | `SchemaRegistry`       | Access resolved models, relationships, and field metadata. |
| `auth`    | `object`               | Current user and their roles.                              |
| `scope`   | `unknown`              | Active scope value (e.g. current company).                 |
| `config`  | `object`               | Application configuration values.                          |
| `models`  | `ModelAccessInterface` | Query, create, update, and delete records on any model.    |
| `service` | `function`             | Call other services by name (dependency injection).        |
| `enqueue` | `function`             | Queue background jobs for async processing.                |
| `events`  | `object`               | Emit and subscribe to application events.                  |
| `notify`  | `function`             | Send a real-time notification to a channel.                |
| `email`   | `object`               | Send emails using named templates.                         |

## Calling Services

### From Hooks

```typescript
defineHooks('sales.order', {
  async afterSave(doc, ctx) {
    const pricing = ctx.service('sales.pricing');
    await pricing.recalculateTotals(doc);
  },
});
```

### From Other Services

```typescript
defineService({
  name: 'sales.invoicing',
  deps: ['sales.pricing'],
  factory: (ctx) => ({
    async createInvoice(order) {
      const pricing = ctx.service('sales.pricing');
      const total = await pricing.calculateOrderTotal(order.items, order.price_list, order.customer);
      return await ctx.db.insertInto('sales.invoice').values({ total, ... }).execute();
    },
  }),
});
```

### From Jobs

```typescript
defineJob('sales.daily-summary', {
  schedule: '0 6 * * *',
  async handler(data, ctx) {
    const analytics = ctx.service('sales.analytics');
    const summary = await analytics.generateDailySummary();
    await ctx.email.send({ to: data.recipients, subject: 'Daily Summary', body: summary });
  },
});
```

## Registration

Services are automatically discovered from the `services/` directory in each app:

```
apps/sales/
  services/
    pricing.ts       # defineService({ name: 'sales.pricing', ... })
    invoicing.ts     # defineService({ name: 'sales.invoicing', ... })
    submitOrder.ts   # defineService({ name: 'sales.submitOrder', ... })
```

The service `name` parameter must be unique across the entire application.

## Dependency Graph

Services can depend on other services. The framework detects circular dependencies at boot time and throws an error if found.

```
sales.pricing → inventory.stock    ✓ OK
sales.invoicing → sales.pricing    ✓ OK
inventory.stock → sales.pricing    ✗ Circular dependency detected
```

## Error Handling

Services reject by throwing. The framework handles errors based on calling context:

| Called from | Error behavior                                   |
| ----------- | ------------------------------------------------ |
| Action      | Error message shown as toast. Operation aborted. |
| Hook        | Error aborts the save. Returns 400 to client.    |
| Job         | Error triggers retry logic (if configured).      |
| Service     | Error propagates to the calling service.         |

## Transaction Support

Services run within the caller's transaction context when invoked from hooks (which execute inside a transaction). Direct service calls from actions or jobs do not automatically wrap in a transaction. Use `ctx.db` to manage transactions explicitly if needed.
