---
status: stable
since: 0.1.0
last-updated: 2026-06-29
description: defineJob() API. Job scheduling, retries, and handlers.
---

# defineJob

Declares a background job. Supports scheduled or on-demand async work with retry and concurrency control.

See [Jobs concept](../concepts/jobs.md) for usage patterns.

## Signature

```typescript
import { defineJob } from 'rangka';

export default defineJob('accounting.reconcile-ledger', {
  concurrency: 2,
  retries: 3,
  backoff: 'exponential',
  schedule: '0 2 * * *',
  handler: async (data, ctx) => {
    const accounting = ctx.service('accounting');
    await accounting.reconcile(data.period);
  },
});
```

## Function Signature

```typescript
function defineJob<T extends JobConfig>(name: string, config: T): { name: string } & T;
```

| Parameter | Type        | Description                                                                          |
| --------- | ----------- | ------------------------------------------------------------------------------------ |
| `name`    | `string`    | **Required.** Unique job identifier in `{app}.{action}` format. Used when enqueuing. |
| `config`  | `JobConfig` | **Required.** Job configuration and handler.                                         |

## JobConfig

```typescript
interface JobConfig {
  concurrency?: number;
  retries?: number;
  backoff?: 'exponential' | 'linear' | 'fixed';
  schedule?: string;
  handler: (data: unknown, ctx: FrameworkContext) => Promise<void>;
}
```

### Fields

| Field         | Type                                   | Default         | Description                                                                                   |
| ------------- | -------------------------------------- | --------------- | --------------------------------------------------------------------------------------------- |
| `concurrency` | `number`                               | `1`             | Maximum parallel executions of this job type.                                                 |
| `retries`     | `number`                               | `0`             | Number of retry attempts on failure.                                                          |
| `backoff`     | `'exponential' \| 'linear' \| 'fixed'` | `'exponential'` | Retry delay strategy.                                                                         |
| `schedule`    | `string`                               | `undefined`     | Cron expression for scheduled execution. If set, the job runs automatically on this schedule. |
| `handler`     | `(data, ctx) => Promise<void>`         | —               | **Required.** Job execution function.                                                         |

## Backoff Strategies

| Strategy      | Formula                  | Example (4 retries)           |
| ------------- | ------------------------ | ----------------------------- |
| `exponential` | `1000 * 2^retryCount` ms | 2s → 4s → 8s → 16s (max 600s) |
| `linear`      | `10000 * retryCount` ms  | 10s → 20s → 30s → 40s         |
| `fixed`       | Always 5s                | 5s → 5s → 5s → 5s             |

## Schedule (Cron Expression)

Standard 5-field cron format:

```
┌───────────── minute (0–59)
│ ┌───────────── hour (0–23)
│ │ ┌───────────── day of month (1–31)
│ │ │ ┌───────────── month (1–12)
│ │ │ │ ┌───────────── day of week (0–7, 0 and 7 = Sunday)
│ │ │ │ │
* * * * *
```

Examples:

- `'0 2 * * *'` daily at 2:00 AM
- `'*/15 * * * *'` every 15 minutes
- `'0 9 * * 1-5'` weekdays at 9:00 AM
- `'0 0 1 * *'` first day of each month at midnight

## Enqueuing Jobs

Jobs are enqueued from hooks, services, other jobs, or API endpoints via `ctx.enqueue`:

```typescript
await ctx.enqueue('accounting.reconcile-ledger', { period: '2026-01' });
```

### Enqueue Options

```typescript
interface JobOptions {
  delay?: number;
  unique?: boolean;
  uniqueKey?: string;
}
```

| Option      | Type      | Default     | Description                                                                                                      |
| ----------- | --------- | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| `delay`     | `number`  | `0`         | Milliseconds to wait before the job becomes active.                                                              |
| `unique`    | `boolean` | `false`     | Prevent duplicate jobs. Only one pending/active job of this type at a time. Deduplicates by job name by default. |
| `uniqueKey` | `string`  | `undefined` | Custom deduplication key. Overrides the default name-based dedup.                                                |

```typescript
// Delayed execution
await ctx.enqueue('sales.send-reminder', { userId: '123' }, { delay: 3600000 });

// Deduplicated. Won't enqueue if one is already pending or active.
await ctx.enqueue('inventory.sync-inventory', { warehouse: 'WH-1' }, { unique: true });

// Custom dedup key
await ctx.enqueue('warehouse.process-batch', { batchId: 'B-1' }, { uniqueKey: 'batch:B-1' });
```

## Job Lifecycle

```
created → active → completed
                 → failed → (retry) → active
                          → failed (retries exhausted, copied to dead letters)
```

| State       | Description                                                                                                                                                                      |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `created`   | Job enqueued, waiting for delay (if any).                                                                                                                                        |
| `active`    | Currently executing.                                                                                                                                                             |
| `completed` | Handler finished successfully.                                                                                                                                                   |
| `failed`    | Handler threw an error. If retries remain the job returns to `active`. If retries are exhausted the job stays `failed` and a copy is written to the `rangka_dead_letters` table. |

## Event-Driven Jobs

Jobs with names prefixed by `__event:` are triggered automatically when that event is emitted:

```typescript
defineJob('__event:invoice.created', {
  handler: async (data, ctx) => {
    // Runs whenever events.emit('invoice.created', ...) is called
  },
});
```

## Handler Context

The `handler` function receives the full `FrameworkContext`. Available properties:

| Property  | Description                |
| --------- | -------------------------- |
| `db`      | Database client (Kysely)   |
| `schema`  | Schema registry            |
| `models`  | Resolved model definitions |
| `service` | Service locator            |
| `enqueue` | Enqueue other jobs         |
| `events`  | Event emitter              |
| `auth`    | Auth utilities             |
| `scope`   | Scoped query builder       |
| `config`  | App configuration          |
| `notify`  | Push notifications         |
| `email`   | Email sending              |

```typescript
handler: async (data, ctx) => {
  // Database access
  const records = await ctx.db.selectFrom('sales.invoice').selectAll().execute();

  // Call services
  const accounting = ctx.service('accounting');

  // Enqueue other jobs
  await ctx.enqueue('core.send-notification', { to: 'admin' });

  // Emit events
  await ctx.events.emit('reconciliation.complete', { period: data.period });

  // Send emails
  await ctx.email.send('reconciliation-report', { to: 'admin@company.com', data });
};
```

## Concurrency

The `concurrency` setting controls how many instances of the same job type can run simultaneously:

- `concurrency: 1` sequential processing (default). Safe for operations that must not overlap.
- `concurrency: 5` up to 5 parallel executions. Use for independent, idempotent work.

Multiple jobs of different types always run in parallel regardless of their individual concurrency settings.
