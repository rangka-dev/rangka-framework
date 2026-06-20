# External Models

> **Status: To be implemented**

## Motivation

The framework currently assumes all models live in the local PostgreSQL database. Real business applications integrate with external systems: payment providers, CRMs, warehouses, other databases. Developers need to define models that connect to these sources while participating in the same relationship graph as internal models.

External models build on the plugin system. A plugin registers a data adapter. An external model declares which adapter it uses.

## Design

### defineExternalModel

A separate definition function with constraints appropriate for external data sources.

```typescript
defineExternalModel({
  name: 'Customer',
  source: 'stripe',

  fields: {
    id: field.string(),
    email: field.string(),
    name: field.string({ from: 'metadata.company_name' }),
    plan: field.string({ from: 'subscription.plan.id' }),
    createdAt: field.datetime({ from: 'created' }),
    mrr: field.computed({
      depends: ['plan'],
      compute: (doc) => calculateMrr(doc.plan),
    }),
  },
});
```

### What external models don't have

| Feature                           | Why excluded                                                                           |
| --------------------------------- | -------------------------------------------------------------------------------------- |
| Traits (timestamped, soft_delete) | Database-level concerns. External source manages its own timestamps and deletion.      |
| Indexes                           | We don't own the storage. Can't create indexes on someone else's database.             |
| Auto-sync / DiffEngine            | We don't own the schema. Nothing to sync.                                              |
| Transactional hooks               | No transaction boundary to participate in. External calls are not rollback-safe.       |
| Scope                             | Scoping is an internal query filter concern. External sources manage their own access. |
| Naming / sequence generation      | ID generation belongs to the external source.                                          |

### What external models do have

| Feature                      | How it works                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| Typed fields                 | For UI rendering, validation, and permissions                                      |
| Field mapping (`from`)       | Maps source fields to local names. Supports dot notation for nested paths.         |
| Computed fields              | Derived locally after fetch. Declared dependencies for cache invalidation.         |
| Relationships                | Application-level joins with internal models (DataLoader pattern)                  |
| Permissions                  | Field-level read/write still applies. Permissions are an API concern, not storage. |
| Auto-generated API endpoints | If adapter supports the operation, endpoints are registered.                       |

### Field mapping

Fields default to 1:1 mapping (field name matches source field name). Use `from` when the source uses different names or nested structures.

```typescript
fields: {
  // 1:1 — field name matches source
  id: field.string(),
  email: field.string(),

  // Renamed — source uses different name
  name: field.string({ from: 'company_name' }),

  // Nested — dot notation traverses source response
  plan: field.string({ from: 'subscription.plan.id' }),

  // Computed — derived locally from fetched data
  displayName: field.computed({
    depends: ['name', 'email'],
    compute: (doc) => doc.name || doc.email,
  }),
}
```

## Adapter interface

Plugins register adapters that implement a subset of operations based on their declared capabilities.

```typescript
interface DataAdapter {
  // Required
  get(model: string, id: string): Promise<Record<string, unknown> | null>;

  // Optional — declared in capabilities
  list?(model: string, query: ListQuery): Promise<ListResult>;
  create?(model: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
  update?(
    model: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
  delete?(model: string, id: string): Promise<void>;
  filter?(model: string, filters: FilterExpression[]): Promise<ListResult>;

  // Optional — for relationship resolution optimization
  batchGet?(model: string, ids: string[]): Promise<Record<string, unknown>[]>;
}
```

### Capabilities

Adapters declare what they support. The framework uses this for boot-time validation.

| Capability | Methods required | Description                   |
| ---------- | ---------------- | ----------------------------- |
| `read`     | `get`            | Fetch a single record by ID   |
| `list`     | `list`           | List records with pagination  |
| `filter`   | `filter`         | Query with filter expressions |
| `create`   | `create`         | Create a new record           |
| `update`   | `update`         | Update an existing record     |
| `delete`   | `delete`         | Delete a record               |

### ListQuery and ListResult

```typescript
interface ListQuery {
  page?: number;
  pageSize?: number;
  sort?: { field: string; direction: 'asc' | 'desc' };
  filters?: FilterExpression[];
}

interface ListResult {
  data: Record<string, unknown>[];
  total?: number;
  hasMore?: boolean;
}
```

### batchGet fallback

If an adapter does not implement `batchGet`, the framework falls back to calling `get` once per ID (N+1). A warning is logged at boot when a model used in relationships lacks `batchGet` support.

## Relationships across boundaries

### Internal to external

An internal model links to an external model.

```typescript
// Internal model in sales module
defineModel({
  name: 'Order',
  fields: {
    customer: field.link({ model: 'stripe.Customer' }),
    total: field.decimal(),
  },
});
```

Resolution flow:

1. Fetch orders from Postgres
2. Collect unique customer IDs from results
3. Call `batchGet` (or N+1 `get`) on the stripe adapter
4. Attach resolved customer records to order results

### External to internal

An external model references an internal model.

```typescript
defineExternalModel({
  name: 'Invoice',
  source: 'stripe',
  fields: {
    id: field.string(),
    order: field.link({ model: 'sales.Order', from: 'metadata.order_id' }),
  },
});
```

Resolution flow:

1. Fetch invoices from Stripe adapter
2. Extract order IDs from `metadata.order_id` field
3. Batch-fetch orders from Postgres
4. Attach resolved order records to invoice results

### External to external

Two external models from different adapters can reference each other. Resolution follows the same DataLoader pattern.

### Unsupported relationship types

| Type          | Supported | Reason                                                               |
| ------------- | --------- | -------------------------------------------------------------------- |
| `link`        | Yes       | Single foreign key, resolved via get/batchGet                        |
| `hasMany`     | Yes       | Reverse lookup via list+filter on the other side                     |
| `children`    | No        | Implies ownership and cascade. Not meaningful across boundaries.     |
| `manyToMany`  | No        | Requires a junction table. Cross-boundary junction is not practical. |
| `dynamicLink` | Yes       | Same as link but model resolved at runtime                           |

## Boot-time validation

The framework checks external models at boot:

- `source` matches a registered adapter name
- All field types are representable (adapter can declare unsupported field types)
- Operations used against this model in pages/services don't exceed adapter capabilities
- If model participates in relationships and adapter lacks `batchGet`, log warning
- If adapter declares `read` only and a page defines a create action against this model, fail with clear error

## API generation

External models participate in the auto-generated API the same as internal models, limited by adapter capabilities.

| Adapter capability | API endpoint generated                                             |
| ------------------ | ------------------------------------------------------------------ |
| `read`             | `GET /api/{module}/{model}/:id`                                    |
| `list`             | `GET /api/{module}/{model}`                                        |
| `create`           | `POST /api/{module}/{model}`                                       |
| `update`           | `PUT /api/{module}/{model}/:id`, `PATCH /api/{module}/{model}/:id` |
| `delete`           | `DELETE /api/{module}/{model}/:id`                                 |

Endpoints that aren't supported by the adapter are not registered. Attempting to call a non-existent endpoint returns 404.

## Example: full integration

```typescript
// plugins/stripe/src/index.ts
definePlugin({
  name: 'stripe',
  version: '1.0.0',
  config: {
    secretKey: { type: 'string', required: true },
  },
  provides: {
    adapters: [
      {
        name: 'stripe',
        capabilities: ['read', 'list', 'filter', 'create', 'update'],
      },
    ],
  },
  boot(ctx) {
    const stripe = new Stripe(ctx.config.secretKey);
    ctx.adapters.stripe.implement({
      async get(model, id) {
        const resource = modelToStripeResource(model);
        return stripe[resource].retrieve(id);
      },
      async list(model, query) {
        const resource = modelToStripeResource(model);
        const result = await stripe[resource].list({
          limit: query.pageSize,
          starting_after: query.cursor,
        });
        return { data: result.data, hasMore: result.has_more };
      },
      async batchGet(model, ids) {
        return Promise.all(ids.map((id) => this.get(model, id)));
      },
      async create(model, data) {
        const resource = modelToStripeResource(model);
        return stripe[resource].create(data);
      },
      async update(model, id, data) {
        const resource = modelToStripeResource(model);
        return stripe[resource].update(id, data);
      },
    });
  },
});

// modules/billing/models/customer.ts
defineExternalModel({
  name: 'Customer',
  source: 'stripe',
  fields: {
    id: field.string(),
    email: field.string(),
    name: field.string({ from: 'metadata.company_name' }),
    plan: field.string({ from: 'subscription.plan.id' }),
  },
});

// modules/sales/models/order.ts
defineModel({
  name: 'Order',
  fields: {
    customer: field.link({ model: 'billing.Customer' }),
    total: field.decimal({ precision: 10, scale: 2 }),
    status: field.enum({ options: ['draft', 'confirmed', 'shipped'] }),
  },
});
```

## Data access

See [Data Access Layer spec](./data-access-layer.md) for the full `ctx.models` API design, filter expressions, relationship resolution, and dispatch logic.

External models are accessed exclusively through `ctx.models`. They cannot be queried via `ctx.db` (raw Kysely) since they have no SQL table.

## Filter and sort capabilities

Filter and sort are separate capabilities from `list`. An adapter can support listing without filtering, or filtering without sorting.

| Capability | What it means                        |
| ---------- | ------------------------------------ |
| `read`     | Get single record by ID              |
| `list`     | List records with pagination         |
| `filter`   | Apply filter expressions server-side |
| `sort`     | Apply sort server-side               |
| `create`   | Create a record                      |
| `update`   | Update a record                      |
| `delete`   | Delete a record                      |

### Fallback behavior

When an adapter doesn't declare `filter` or `sort`, the framework fetches all records via `list` and applies filter/sort in memory. A boot-time warning is logged so the developer knows they're paying for a full fetch.

## Open questions

- Should external models support event emission (e.g., webhook from Stripe triggers a framework event)?
- Should adapters support cursor-based pagination in addition to offset-based?
- How does field validation work for create/update on external models? Validate locally before sending to adapter, or let the adapter handle errors?
