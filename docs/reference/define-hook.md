---
status: stable
since: 0.1.0
last-updated: 2026-06-11
description: defineHook() API — hook types, context, and execution order
---

# defineHooks

Declares lifecycle hooks — validation and side-effect handlers that run before or after data operations.

See [Hooks concept](../concepts/hooks.md) for usage patterns.

## Signature

```typescript
import { defineHooks } from 'rangka';

export default defineHooks('sales.order', {
  validate: (doc) => {
    if (!doc.customer) throw new Error('Customer is required');
    if ((doc.total as number) < 0) throw new Error('Total cannot be negative');
  },

  beforeSave: async (doc, ctx) => {
    doc.updated_by = ctx.auth.user?.id;
  },

  afterCreate: async (doc, ctx) => {
    await ctx.events.emit('invoice.created', { id: doc.id });
    await ctx.enqueue('send-welcome-email', { invoiceId: doc.id });
  },

  beforeDelete: async (doc, ctx) => {
    if (doc.status === 'Submitted') {
      throw new Error('Cannot delete submitted documents');
    }
  },
});
```

## HooksConfig

```typescript
interface HooksConfig {
  validate?: ValidateHook;
  beforeSave?: BeforeHook;
  afterSave?: AfterHook;
  beforeCreate?: BeforeHook;
  afterCreate?: AfterHook;
  beforeUpdate?: BeforeHook;
  afterUpdate?: AfterHook;
  beforeDelete?: BeforeHook;
  afterDelete?: AfterHook;
}
```

## Hook Types

### ValidateHook

```typescript
type ValidateHook = (doc: Record<string, unknown>) => void;
```

- **Synchronous** — no `async`, no context access
- Throw an `Error` to reject the operation
- Runs before all other hooks
- Used for data integrity checks that don't require I/O

### BeforeHook

```typescript
type BeforeHook = (doc: Record<string, unknown>, ctx: FrameworkContext) => Promise<void>;
```

- **Async** — full context access
- Mutate `doc` to transform data before persistence
- Throw to abort the operation
- Runs inside the transaction

### AfterHook

```typescript
type AfterHook = (doc: Record<string, unknown>, ctx: FrameworkContext) => Promise<void>;
```

- **Async** — full context access
- `doc` reflects the saved state (includes generated `id`, timestamps, etc.)
- Operation-specific after hooks (`afterCreate`, `afterUpdate`, `afterDelete`) run inside the transaction. Throwing rolls back the write.
- `afterSave` runs outside the transaction (after commit). Throwing does not roll back.
- Used for side effects: sending emails, enqueuing jobs, emitting events

## All Hook Types

| Hook           | Trigger                 | Can Mutate      | Can Abort | Timing             |
| -------------- | ----------------------- | --------------- | --------- | ------------------ |
| `validate`     | Before any write        | No (throw only) | Yes       | Before transaction |
| `beforeSave`   | Before create or update | Yes             | Yes       | In transaction     |
| `afterSave`    | After create or update  | No              | No        | After commit       |
| `beforeCreate` | Before insert           | Yes             | Yes       | In transaction     |
| `afterCreate`  | After insert            | No              | Yes       | In transaction     |
| `beforeUpdate` | Before update           | Yes             | Yes       | In transaction     |
| `afterUpdate`  | After update            | No              | Yes       | In transaction     |
| `beforeDelete` | Before delete           | No              | Yes       | In transaction     |
| `afterDelete`  | After delete            | No              | Yes       | In transaction     |

## Execution Order

For a **create** operation:

1. `validate(doc)`
2. `beforeSave(doc, ctx)` — in transaction
3. `beforeCreate(doc, ctx)` — in transaction
4. — Database INSERT — in transaction
5. `afterCreate(doc, ctx)` — in transaction
6. — Transaction COMMIT —
7. `afterSave(doc, ctx)` — after commit

For an **update** operation:

1. `validate(doc)`
2. `beforeSave(doc, ctx)` — in transaction
3. `beforeUpdate(doc, ctx)` — in transaction
4. — Database UPDATE — in transaction
5. `afterUpdate(doc, ctx)` — in transaction
6. — Transaction COMMIT —
7. `afterSave(doc, ctx)` — after commit

For a **delete** operation:

1. `beforeDelete(doc, ctx)` — in transaction
2. — Database DELETE — in transaction
3. `afterDelete(doc, ctx)` — in transaction
4. — Transaction COMMIT —

## FrameworkContext

The context object available in all `BeforeHook` and `AfterHook` functions:

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
    emit: (event: string, data?: unknown) => void;
    on: (event: string, handler: Function) => void;
  };
  notify: (message: string, opts?: NotifyOptions) => Promise<void>;
  email: { send: (opts: EmailOptions) => Promise<void> };
}
```

### ContextUser

```typescript
interface ContextUser {
  id: string;
  email: string;
  full_name: string;
  enabled: boolean;
  [key: string]: unknown;
}
```

### Context members

| Member        | Type                                    | Description                                               |
| ------------- | --------------------------------------- | --------------------------------------------------------- |
| `db`          | `DatabaseClient`                        | Kysely-based database client. Use for direct queries.     |
| `schema`      | `SchemaRegistry`                        | Schema registry. Access model metadata and relationships. |
| `auth.user`   | `ContextUser \| null`                   | Authenticated user. `null` for system operations.         |
| `auth.roles`  | `string[]`                              | Roles assigned to the current user.                       |
| `scope`       | `unknown`                               | Active scope value (e.g., current company ID).            |
| `config`      | `Record<string, unknown>`               | App-level configuration values.                           |
| `models`      | `ModelAccessInterface`                  | Query, create, update, or delete records on any model.    |
| `service`     | `(name: string) => ServiceInstance`     | Get a registered service by name.                         |
| `enqueue`     | `(job, data, opts?) => Promise<void>`   | Queue a background job.                                   |
| `events.emit` | `(event, data?) => void`                | Emit a domain event.                                      |
| `events.on`   | `(event, handler) => void`              | Register an event listener (rarely used in hooks).        |
| `notify`      | `(message, opts?) => Promise<void>`     | Send a real-time notification.                            |
| `email.send`  | `(opts: EmailOptions) => Promise<void>` | Send an email.                                            |

### JobOptions (for `enqueue`)

```typescript
interface JobOptions {
  delay?: number; // Delay in milliseconds before job becomes active
  unique?: boolean; // Only one job with this name+data can be active
  uniqueKey?: string; // Custom deduplication key (overrides data-based dedup)
}
```

### Using `ctx.models`

The `models` interface lets hooks query, create, update, or delete records on any model.

```typescript
export default defineHooks('sales.order', {
  afterSave: async (doc, ctx) => {
    await ctx.models.create('audit.log', {
      model: 'sales.order',
      record_id: doc.id,
      action: 'updated',
    });
  },
});
```

## Multiple Hook Sources

Multiple modules can define hooks for the same model using `defineHooks()`. All hooks are merged and execute in registration order.

```typescript
// Module A: modules/sales/hooks/invoice.ts
export default defineHooks('sales.invoice', {
  beforeSave: async (doc, ctx) => {
    /* ... */
  },
});

// Module B: modules/tax/hooks/invoice.ts
export default defineHooks('sales.invoice', {
  beforeSave: async (doc, ctx) => {
    /* ... */
  },
});
```

All hooks at a given lifecycle point run. There is no priority or ordering control between sources.

## Error Handling

Throwing in a `before*` or operation-specific `after*` hook aborts the operation and returns a `400` error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Cannot delete submitted documents"
  }
}
```

Throwing in `afterSave` logs the error but does not roll back the committed data.
