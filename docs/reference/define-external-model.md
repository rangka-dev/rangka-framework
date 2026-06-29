---
status: stable
since: 0.1.0
last-updated: 2026-06-29
description: defineExternalModel() - register external data sources as framework models
---

# defineExternalModel

Declares a model backed by an external data source. External models get API routes, permissions, and query access like internal models. The `source` string identifies which external connection provides the data.

## Signature

```typescript
import { defineExternalModel } from '@rangka/core';

export default defineExternalModel({
  name: 'customer',
  source: 'legacy_crm',
  label: 'Customer',
  fields: {
    name: { type: 'string', required: true, from: 'cust_name' },
    email: { type: 'string', from: 'email_address' },
    phone: { type: 'string', from: 'phone_no' },
    balance: { type: 'decimal', from: 'outstanding_bal' },
  },
});
```

## ExternalModelConfig

```typescript
interface ExternalModelConfig {
  name: string;
  source: string;
  module?: string;
  label?: string;
  fields: Record<string, ExternalFieldConfig>;
}
```

| Field    | Type                                  | Default             | Description                                                      |
| -------- | ------------------------------------- | ------------------- | ---------------------------------------------------------------- |
| `name`   | `string`                              | —                   | **Required.** Model identifier. Combined with app as `app.name`. |
| `source` | `string`                              | —                   | **Required.** External connection identifier.                    |
| `module` | `string`                              | `undefined`         | Module grouping for organization.                                |
| `label`  | `string`                              | Derived from `name` | Human-readable display name.                                     |
| `fields` | `Record<string, ExternalFieldConfig>` | —                   | **Required.** Field definitions for the external model.          |

## ExternalFieldConfig

```typescript
interface ExternalFieldConfig {
  type: 'string' | 'int' | 'decimal' | 'boolean' | 'date' | 'datetime' | 'json';
  label?: string;
  required?: boolean;
  from?: string;
  computed?: ComputedFieldConfig;
  relationship?: ExternalRelationshipConfig;
}
```

| Field          | Type      | Default     | Description                                                   |
| -------------- | --------- | ----------- | ------------------------------------------------------------- |
| `type`         | `string`  | —           | **Required.** Field data type.                                |
| `label`        | `string`  | `undefined` | Display label for UI rendering.                               |
| `required`     | `boolean` | `false`     | Whether the field must have a value.                          |
| `from`         | `string`  | `undefined` | Source column name. If omitted, uses the field name directly. |
| `computed`     | `object`  | `undefined` | Computed field configuration. See below.                      |
| `relationship` | `object`  | `undefined` | Relationship to another model. See below.                     |

## Field mapping

By default, the framework uses the field name as the source column name. Use `from` to map to a different name in the external source.

```typescript
fields: {
  // Field name matches source column
  email: { type: 'string' },

  // Field name differs from source column
  name: { type: 'string', from: 'cust_name' },
  created: { type: 'datetime', from: 'created_date' },
}
```

The framework translates between field names and column names automatically. API consumers and page widgets use the field name. The external source uses the `from` value.

## Computed fields

Derived values computed from other fields on the record.

```typescript
interface ComputedFieldConfig {
  depends: string[];
  compute: (record: Record<string, unknown>) => unknown;
}
```

| Field     | Type                  | Description                                    |
| --------- | --------------------- | ---------------------------------------------- |
| `depends` | `string[]`            | **Required.** Fields this computation reads.   |
| `compute` | `(record) => unknown` | **Required.** Function that returns the value. |

```typescript
fields: {
  first_name: { type: 'string' },
  last_name: { type: 'string' },
  full_name: {
    type: 'string',
    computed: {
      depends: ['first_name', 'last_name'],
      compute: (record) => `${record.first_name} ${record.last_name}`,
    },
  },
}
```

## Relationships

External models can declare relationships to other models.

```typescript
interface ExternalRelationshipConfig {
  type: 'link' | 'hasMany';
  model: string;
  from?: string;
  foreignKey?: string;
}
```

| Field        | Type     | Description                                                          |
| ------------ | -------- | -------------------------------------------------------------------- |
| `type`       | `string` | **Required.** `'link'` for foreign key, `'hasMany'` for one-to-many. |
| `model`      | `string` | **Required.** Qualified model name of the related model.             |
| `from`       | `string` | Source column name for the foreign key (for `link` type).            |
| `foreignKey` | `string` | Field on the related model pointing back (for `hasMany` type).       |

```typescript
fields: {
  company: {
    type: 'string',
    relationship: { type: 'link', model: 'core.company', from: 'company_id' },
  },
  orders: {
    type: 'json',
    relationship: { type: 'hasMany', model: 'sales.order', foreignKey: 'customer_id' },
  },
}
```

## Limitations

- No hooks (validate, beforeSave, afterSave, etc.)
- No traits (timestamped, soft_delete)
- No indexes (managed by the external source)
- No schema sync (the framework does not create or alter external tables)
- Limited field types compared to internal models

## File location

External models live in the same `models/` directory as internal models.

```
apps/
  crm/
    app.ts
    models/
      customer.ts    # defineExternalModel
      lead.ts        # defineExternalModel
      deal.ts        # defineModel (internal)
```

The framework distinguishes them by the presence of the `source` field.
