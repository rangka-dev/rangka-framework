# Unified Services

> **Experimental idea** — this is an exploration, not a committed design. Not implemented.

## Motivation

The framework currently has three separate concepts for executable logic:

- **Service** — reusable function, called internally by actions or other services
- **Hook** — model lifecycle logic, runs inside the transaction
- **Job** — background work with retry, scheduling, concurrency

Services and jobs overlap significantly. A job is a service that runs async with retry policy. Adding triggers (webhook, schedule, event) to services makes the overlap complete. This spec proposes merging jobs into services.

Hooks remain separate. They are transactional model behavior with ordering guarantees that services cannot replicate.

## Design

A service is a named function with optional triggers and optional execution options.

```typescript
defineService({
  key: 'sales.syncInventory',

  // How it gets called (zero or many)
  triggers: [
    { type: 'webhook', path: '/hooks/inventory-update', method: 'POST' },
    { type: 'schedule', cron: '0 2 * * *' },
    { type: 'event', on: 'sales.order.confirmed' },
  ],

  // Execution behavior
  options: {
    queue: true,
    retries: 3,
    timeout: 30_000,
    concurrency: 10,
  },

  // The logic
  async handler(ctx) {
    // ctx.payload — trigger-specific data
    // ctx.models  — model access
    // ctx.services — call other services
  },
});
```

## Graduated complexity

| Shape                   | What it is                           | Equivalent today  |
| ----------------------- | ------------------------------------ | ----------------- |
| No triggers, no options | Callable function                    | `defineService()` |
| With triggers           | Entry point for external events      | New               |
| With `queue: true`      | Async background work with retry     | `defineJob()`     |
| With triggers + queue   | Externally triggered background work | New               |

## Trigger types

### `webhook`

Exposes a custom HTTP endpoint. The framework mounts the route at boot.

```typescript
{ type: 'webhook', path: '/hooks/stripe', method: 'POST', auth: 'signature',
  verify: (req) => verifyStripeSignature(req) }
```

| Field    | Required | Description                                                                     |
| -------- | -------- | ------------------------------------------------------------------------------- |
| `path`   | yes      | URL path for the endpoint                                                       |
| `method` | no       | HTTP method. Defaults to `POST`                                                 |
| `auth`   | no       | Auth strategy: `'signature'`, `'token'`, `'none'`. Defaults to `'none'`         |
| `verify` | no       | Custom verification function. Receives the raw request. Return false to reject. |

The handler receives `ctx.payload` as the parsed request body. `ctx.headers` contains request headers.

### `schedule`

Runs on a cron schedule.

```typescript
{ type: 'schedule', cron: '0 2 * * *' }
```

The handler receives `ctx.payload` as `{ scheduledAt: Date }`.

### `event`

Fires when an internal event occurs. Events are emitted by hooks after transaction commit, or explicitly by other services.

```typescript
{ type: 'event', on: 'sales.order.confirmed' }
```

The handler receives `ctx.payload` as the event data (typically the record that changed).

### `queue`

Fires when a message is pushed to a named queue. For fan-out patterns or explicit async dispatch.

```typescript
{ type: 'queue', name: 'pdf-generation' }
```

## Execution options

| Option        | Type    | Default   | Description                               |
| ------------- | ------- | --------- | ----------------------------------------- |
| `queue`       | boolean | false     | Run async via job queue instead of inline |
| `retries`     | number  | 0         | Retry count on failure                    |
| `timeout`     | number  | 30000     | Max execution time in ms                  |
| `concurrency` | number  | unlimited | Max parallel executions                   |
| `delay`       | number  | 0         | Delay before first execution (ms)         |

When `queue: false` (default), the service runs inline. The caller awaits the result. Retries and concurrency still apply.

When `queue: true`, the caller gets an acknowledgment immediately. The service runs in the background. Failures retry according to policy.

## Handler context

```typescript
interface ServiceContext {
  payload: any; // trigger-specific data
  headers?: Record<string, string>; // webhook headers
  models: ModelAccess; // read/write models
  services: ServiceAccess; // call other services
  emit(event: string, data: any): void; // emit an event
  log: Logger;
}
```

## Calling a service

### From another service

```typescript
async handler(ctx) {
  const result = await ctx.services.call('sales.calculateTotals', { orderId: '123' })
}
```

### From a widget action

```typescript
{ type: 'service', name: 'sales.submitOrder',
  data: { orderId: '$route.id' },
  onSuccess: { type: 'navigate', path: '/sales/orders' },
  onError: { type: 'setValue', field: '$state.error', value: '$response.message' } }
```

### From external (webhook)

```
POST /hooks/stripe
Body: { "type": "payment_intent.succeeded", ... }
→ framework routes to the service with matching webhook trigger
→ runs handler with ctx.payload = request body
```

## Relationship to hooks

Hooks and services are complementary, not overlapping.

|                         | Hooks                           | Services                       |
| ----------------------- | ------------------------------- | ------------------------------ |
| Tied to a model         | Yes                             | No                             |
| Runs in transaction     | Yes                             | No (unless explicitly wrapped) |
| Can abort the operation | Yes                             | No                             |
| Fixed execution order   | Yes (validate → before → after) | No                             |
| Called externally       | No                              | Yes (via triggers)             |
| Retryable               | No                              | Yes                            |
| Async execution         | No                              | Yes (queue option)             |

Hooks can emit events that trigger services:

```typescript
// In a hook
defineHooks({
  model: 'sales.order',
  afterSave(ctx) {
    if (ctx.changed('status') && ctx.record.status === 'confirmed') {
      ctx.emit('sales.order.confirmed', ctx.record);
    }
  },
});

// A service reacts
defineService({
  key: 'sales.notifyWarehouse',
  triggers: [{ type: 'event', on: 'sales.order.confirmed' }],
  options: { queue: true },
  async handler(ctx) {
    // send notification, sync to external system, etc.
  },
});
```

## Migration from defineJob

`defineJob()` becomes a deprecated alias:

```typescript
// Old
defineJob({
  key: 'reports.generateMonthly',
  schedule: '0 2 1 * *',
  retries: 3,
  handler(ctx) { ... },
})

// New (equivalent)
defineService({
  key: 'reports.generateMonthly',
  triggers: [{ type: 'schedule', cron: '0 2 1 * *' }],
  options: { queue: true, retries: 3 },
  async handler(ctx) { ... },
})
```

## Open questions

- Should webhook paths live under a reserved prefix (`/hooks/...`) or allow arbitrary paths?
- Should the framework auto-return 200 for webhooks, or let the handler control the HTTP response?
- Should `event` triggers support filtering (e.g., only fire when specific fields changed)?
- How does the queue implementation work? Postgres-backed (pg-boss style) or external (Redis, SQS)?
- Should services support middleware (auth, rate limiting, validation) as a composable layer?
