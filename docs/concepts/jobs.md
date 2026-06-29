---
status: stable
since: 0.1.0
last-updated: 2026-06-29
description: Background job scheduling and execution
---

# Jobs

Not everything should happen while a user waits. Sending emails, generating reports, syncing with external systems. These are tasks that belong in the background.

A job runs reliably without blocking the request that triggered it.

## Defining a job

```typescript
import { defineJob } from 'rangka';

export default defineJob('sales.send-confirmation', {
  concurrency: 5,
  retries: 3,
  backoff: 'exponential',

  async handler(data, ctx) {
    const order = await ctx.models.get('sales.order', data.orderId);
    if (!order) return;

    const customer = await ctx.models.get('sales.customer', order.customer);

    await ctx.email.send('order-confirmation', {
      to: customer.email,
      data: { order, customer },
    });
  },
});
```

## Configuration

| Field         | Type       | Description                                      |
| ------------- | ---------- | ------------------------------------------------ |
| `concurrency` | `number`   | Max simultaneous executions (default: 1)         |
| `retries`     | `number`   | Retry attempts before giving up (default: 0)     |
| `backoff`     | `string`   | Retry delay: `exponential`, `linear`, or `fixed` |
| `schedule`    | `string`   | Cron expression for recurring execution          |
| `handler`     | `function` | The work to perform                              |

## Enqueuing jobs

Jobs are triggered from hooks, services, or other jobs:

```typescript
defineHooks('sales.order', {
  async afterCreate(doc, ctx) {
    await ctx.enqueue('sales.send-confirmation', { orderId: doc.id });
    await ctx.enqueue('inventory.reserve-stock', { orderId: doc.id });
  },
});
```

### Options

```typescript
await ctx.enqueue('job-name', data, {
  delay: 60000,
  unique: true,
  uniqueKey: 'order-123',
});
```

| Option      | Description                          |
| ----------- | ------------------------------------ |
| `delay`     | Wait N milliseconds before executing |
| `unique`    | Prevent duplicate jobs               |
| `uniqueKey` | Custom deduplication key             |

## Scheduled jobs

Add a `schedule` field with a cron expression for recurring execution:

```typescript
defineJob('sales.daily-summary', {
  schedule: '0 6 * * *',

  async handler(data, ctx) {
    const yesterday = getYesterday();
    const orders = await ctx.models
      .query('sales.order')
      .filter({ created_at: { $gte: yesterday } })
      .exec();

    const summary = computeSummary(orders);
    await ctx.email.send('daily-summary', { to: 'sales-team@company.com', data: summary });
  },
});
```

### Cron format

Standard 5-field: `minute hour day-of-month month day-of-week`

| Expression     | Meaning              |
| -------------- | -------------------- |
| `0 6 * * *`    | Daily at 6:00 AM     |
| `0 */4 * * *`  | Every 4 hours        |
| `30 9 * * 1-5` | Weekdays at 9:30 AM  |
| `0 0 1 * *`    | First of every month |

## Retries

When a handler throws, the framework retries based on your configuration:

```typescript
defineJob('sales.sync-to-crm', {
  retries: 5,
  backoff: 'exponential',

  async handler(data, ctx) {
    const response = await fetch('https://crm.example.com/api/sync', { ... });
    if (!response.ok) throw new Error(`CRM sync failed: ${response.status}`);
  },
});
```

| Backoff       | Pattern                 |
| ------------- | ----------------------- |
| `exponential` | 2s, 4s, 8s, 16s, 32s    |
| `linear`      | 10s, 20s, 30s, 40s, 50s |
| `fixed`       | 5s, 5s, 5s, 5s, 5s      |

After all retries are exhausted the job moves to `failed` state.

## Job lifecycle

```
created → active → completed
              ↓
           failed (retry) → active → completed
              ↓
           failed (exhausted)
```

## Event-driven jobs

Jobs with the `__event:` prefix automatically listen to framework events:

```typescript
defineJob('__event:sales.order.submitted', {
  async handler(data, ctx) {
    await ctx.enqueue('sales.send-confirmation', { orderId: data.order.id });
  },
});
```

Same as registering an event listener but with retry and persistence guarantees.

## SQLite mode

Background jobs are disabled when running SQLite. The framework dispatches events synchronously instead. Design jobs to be safe to skip in development if you use SQLite for local development.
