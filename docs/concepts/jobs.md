---
status: stable
since: 0.1.0
last-updated: 2026-06-12
description: Background job scheduling and execution
---

# Jobs

Not everything should happen while a user waits. Sending emails, generating reports, syncing with external systems, processing queues. These are tasks that belong in the background, running reliably without blocking anyone's request.

A job is how you express that kind of work in Rangka.

## Defining a job

```typescript
// jobs/send-confirmation.ts
import { defineJob } from 'rangka';

export default defineJob('sales.send-confirmation', {
  concurrency: 5,
  retries: 3,
  backoff: 'exponential',

  async handler(data, ctx) {
    const order = await ctx.db
      .selectFrom('sales.order')
      .where('id', '=', data.orderId)
      .selectAll()
      .executeTakeFirst();

    if (!order) return;

    const customer = await ctx.db
      .selectFrom('sales.customer')
      .where('id', '=', order.customer)
      .selectAll()
      .executeTakeFirst();

    await ctx.email.send('order-confirmation', {
      to: customer.email,
      data: { order, customer },
    });
  },
});
```

## Configuration

`defineJob(name, config)` — name is the first argument (`{app}.{action}` format).

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
  delay: 60000, // Wait 60 seconds before executing
  unique: true, // Prevent duplicates
  uniqueKey: 'order-123', // Custom deduplication key
});
```

## Scheduled jobs

Add a `schedule` field with a cron expression to run jobs on a recurring basis:

```typescript
defineJob({
  name: 'sales.daily-summary',
  schedule: '0 6 * * *', // Every day at 6:00 AM

  async handler(data, ctx) {
    const yesterday = getYesterday();
    const orders = await ctx.db
      .selectFrom('sales.order')
      .where('created_at', '>=', yesterday)
      .selectAll()
      .execute();

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

When a handler throws the framework retries based on your configuration:

```typescript
defineJob({
  name: 'sales.sync-to-crm',
  retries: 5,
  backoff: 'exponential',
  // Delays: 1s, 2s, 4s, 8s, 16s

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
defineJob({
  name: '__event:sales.order.submitted',
  async handler(data, ctx) {
    await ctx.enqueue('sales.send-confirmation', { orderId: data.order.id });
  },
});
```

Same as registering an event listener but with retry and persistence guarantees.
