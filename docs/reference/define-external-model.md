---
status: stable
since: 0.1.0
last-updated: 2026-06-19
description: defineExternalModel() — connect existing external data sources as framework models
---

# defineExternalModel

Declares a model backed by an external data source via a plugin adapter. External models get API routes, permissions, page widgets, and query access like internal models. The adapter handles all data operations.

See [definePlugin](./define-plugin.md) for creating adapters.

## Signature

```typescript
import { defineExternalModel, field } from 'rangka';

export default defineExternalModel({
  name: 'customer',
  label: 'Customer',
  adapter: 'mysql',
  source: { table: 'customers', schema: 'legacy_crm', primaryKey: 'customer_id' },
  fields: {
    name: field.string({ column: 'cust_name', required: true }),
    email: field.string({ column: 'email_address', searchable: true }),
    phone: field.string({ column: 'phone_no' }),
    balance: field.decimal({ column: 'outstanding_bal', readOnly: true }),
  },
  naming: 'name',
});
```

## ExternalModelConfig

```typescript
interface ExternalModelConfig {
  name: string;
  label?: string;
  adapter: string;
  source: Record<string, unknown>;
  fields: Record<string, FieldConfig>;
  naming?: string;
  scope?: ScopeConfig;
}
```

| Field     | Type                          | Default             | Description                                                                                                       |
| --------- | ----------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `name`    | `string`                      | —                   | **Required.** Model identifier. Combined with app name as `app.name`.                                             |
| `label`   | `string`                      | Derived from `name` | Human-readable display name.                                                                                      |
| `adapter` | `string`                      | —                   | **Required.** Name of a registered adapter from a plugin's `provides.adapters`.                                   |
| `source`  | `Record<string, unknown>`     | —                   | **Required.** Adapter-specific source configuration. The framework passes this to the adapter on every operation. |
| `fields`  | `Record<string, FieldConfig>` | —                   | **Required.** Field definitions. Supports the `column` option for mapping to source column names.                 |
| `naming`  | `string`                      | —                   | Field to use as the record's display title.                                                                       |
| `scope`   | `ScopeConfig`                 | —                   | Scope for auto-filtering queries.                                                                                 |

## Field mapping

By default, the framework uses the field name as the source column name. Use the `column` option to map to a different name in the external source.

```typescript
fields: {
  // field name matches source column
  email: field.string(),

  // field name differs from source column
  name: field.string({ column: 'cust_name' }),
  created: field.datetime({ column: 'created_date', readOnly: true }),
}
```

The framework translates between field names and column names automatically. API consumers and page widgets use the field name. The adapter receives the column name.

## Source configuration

The `source` object is opaque to the framework. Each adapter defines its own expected shape.

```typescript
// MySQL adapter
source: { table: 'customers', schema: 'legacy_crm', primaryKey: 'customer_id' }

// REST adapter
source: { endpoint: 'https://api.example.com/v2/customers', primaryKey: 'id' }

// Stripe adapter
source: { resource: 'customers' }
```

The adapter validates the source shape at boot or on first access. If the source is invalid, the adapter throws and the framework surfaces the error.

## Capability-driven behavior

The framework generates API routes based on what the adapter declares it can do. If an adapter only supports read operations, the model is automatically read-only.

| Adapter capability | API route generated    | HTTP method |
| ------------------ | ---------------------- | ----------- |
| `get`              | `/api/:app/:model/:id` | GET         |
| `list`             | `/api/:app/:model`     | GET         |
| `create`           | `/api/:app/:model`     | POST        |
| `update`           | `/api/:app/:model/:id` | PUT         |
| `delete`           | `/api/:app/:model/:id` | DELETE      |

Routes for missing capabilities return `405 Method Not Allowed`.

```typescript
// A read-only adapter declares only 'read' and 'list' capabilities
definePlugin({
  name: 'reporting-db',
  provides: { adapters: ['reporting'] },
  capabilities: ['read', 'list'],
  // ...
});
```

## Permissions

External models use the same permission system as internal models. Roles can grant or restrict access.

```typescript
defineRoles({
  'Sales Rep': {
    models: {
      'crm.customer': { read: true, write: false },
    },
  },
});
```

If the adapter lacks a capability AND the role grants it, the adapter capability wins. A user cannot write to a read-only adapter regardless of permissions.

## Query access

External models are available through `ctx.models` like any other model.

```typescript
// In a service or hook
const customers = await ctx.models
  .query('crm.customer')
  .filter({ balance: { gt: 1000 } })
  .sort('name')
  .limit(50)
  .exec();

const customer = await ctx.models.get('crm.customer', id);
```

Filter and sort operations depend on adapter capabilities. If the adapter supports `filter` and `sort`, the framework pushes these operations to the source. Otherwise, it fetches all records and applies them in memory.

## Pages

External models work in pages and widgets.

```typescript
definePage({
  key: 'crm.customers',
  label: 'Customers',
  widgets: [
    {
      type: 'table',
      source: { model: 'crm.customer' },
      children: [
        { type: 'column', props: { label: 'Name' }, bind: { field: 'name' } },
        { type: 'column', props: { label: 'Email' }, bind: { field: 'email' } },
        { type: 'column', props: { label: 'Balance' }, bind: { field: 'balance' } },
      ],
    },
  ],
});
```

## Relationships

External models can participate in relationships with internal models.

```typescript
// Internal model linking to external model
export default defineModel({
  name: 'order',
  fields: {
    customer: field.link('crm.customer', { required: true }),
    // ...
  },
});
```

The framework resolves cross-source relationships by fetching the foreign record from the adapter. If the adapter provides `batchGet`, the framework batches lookups to avoid N+1 queries.

## Limitations

- No hooks (validate, beforeSave, afterSave, etc.)
- No traits (timestamped, soft_delete)
- No indexes (managed by the external source)
- No schema sync (the framework does not create or alter external tables)
- No transactions across internal and external models
- Filter/sort capabilities depend on the adapter

## File location

External models live in the same `models/` directory as internal models.

```
apps/
  crm/
    app.ts
    models/
      customer.ts    ← defineExternalModel
      lead.ts        ← defineExternalModel
      deal.ts        ← defineModel (internal)
```

The framework distinguishes them by the presence of the `adapter` field.
