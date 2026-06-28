---
status: stable
since: 0.1.0
last-updated: 2026-06-12
description: Model definition with fields, traits, and relationships
---

# Models

Every business application begins with a question: what are the things your system tracks? A model is your answer. It defines a data entity once, and from that single definition the framework produces a database table, a REST API, form inputs, list columns, and permission gates.

You describe the shape of your data. The framework handles the mechanics of storing, serving, and rendering it.

## Defining a model

```typescript
// models/customer.ts
import { defineModel, field } from 'rangka';

export default defineModel({
  name: 'customer',
  label: 'Customer',
  naming: 'customer_name',
  traits: ['timestamped'],
  fields: {
    customer_name: field.string({ required: true }),
    email: field.string(),
    phone: field.string(),
    type: field.enum(['Individual', 'Company'], { default: 'Individual' }),
    credit_limit: field.decimal({ precision: 18, scale: 2 }),
    is_active: field.boolean({ default: true }),
    notes: field.text(),
  },
  indexes: [{ fields: ['email'], unique: true }],
});
```

This is a complete entity. The framework handles the table creation, the API endpoints, the form layout, and the list columns.

## Configuration

| Field      | Type                          | Description                                                        |
| ---------- | ----------------------------- | ------------------------------------------------------------------ |
| `name`     | `string`                      | Model name (becomes `{app}.{name}`)                                |
| `label`    | `string`                      | Human-readable name for the UI                                     |
| `naming`   | `string`                      | Which field to use as the record's display title                   |
| `scope`    | `string`                      | Auto-filter queries by user's active scope (e.g. `'core.company'`) |
| `auditLog` | `boolean`                     | Track all changes to records                                       |
| `traits`   | `Trait[]`                     | Behaviors to mix in (see [Traits](#traits))                        |
| `fields`   | `Record<string, FieldConfig>` | Field definitions                                                  |
| `indexes`  | `IndexConfig[]`               | Database indexes                                                   |

## Field types

### Primitives

```typescript
fields: {
  name:         field.string({ maxLength: 140 }),
  description:  field.text(),
  quantity:     field.int(),
  rate:         field.decimal({ precision: 18, scale: 6 }),
  is_active:    field.boolean({ default: true }),
  posting_date: field.date(),
  created_at:   field.datetime(),
  status:       field.enum(['Draft', 'Active', 'Closed']),
  metadata:     field.json(),
}
```

### Money

```typescript
fields: {
  grand_total: field.money(),
  tax_amount:  field.money(),
}
```

The frontend formats these as currency. The app layer handles which currency applies.

### Sequence

Auto-incrementing identifiers with formatting:

```typescript
fields: {
  voucher_no: field.sequence({
    prefix: 'INV-',
    digits: 5,
  }),
  // Generates: INV-00001, INV-00002, ...
}
```

### Attachment

```typescript
fields: {
  logo:      field.attachment({ accept: ['image/*'], maxSize: '5mb' }),
  documents: field.attachments({ accept: ['application/pdf'], maxCount: 10 }),
}
```

### Tree

Hierarchical data with configurable storage:

```typescript
fields: {
  parent: field.tree({ strategy: 'materialized_path' }),
}
```

Strategies: `materialized_path`, `nested_set`, `closure_table`.

## Relationships

### Link (belongs-to)

A foreign key to another model. Renders as a searchable dropdown in the UI:

```typescript
fields: {
  customer: field.link('sales.customer', { required: true }),
}
```

### Has Many (one-to-many)

Records in another model that point back. This does not create a column in the current table, but lets the API include related records via `?include=addresses`:

```typescript
fields: {
  addresses: field.hasMany('sales.customer_address', { foreignKey: 'customer_id' }),
}
```

### Children (parent-child)

A tighter version of has-many. Children are edited inline with the parent, saved in a single transaction, and cascade-deleted:

```typescript
fields: {
  items: field.children('sales.order_item', { foreignKey: 'order_id' }),
}
```

### Many-to-Many

Through a junction table:

```typescript
fields: {
  tags: field.manyToMany('core.tag', { through: 'sales.order_tag' }),
}
```

### Dynamic Link (polymorphic)

The target model is stored in another field:

```typescript
fields: {
  reference_type: field.string(),
  reference: field.dynamicLink('reference_type'),
}
```

## Field options

All fields share these base options:

```typescript
{
  required: true,
  label: 'Display Name',
  hidden: true,          // Don't show in default views
  readOnly: true,        // Can't be edited through the API
  default: 'value',
  validation: {
    format: 'email',
    min: 0,
    max: 100,
    pattern: '^[A-Z]',
    message: 'Custom error message',
  },
}
```

## Traits

Traits add standard fields and behaviors to a model.

**`timestamped`** adds `created_at`, `updated_at`, `created_by`, and `updated_by`, automatically managed. The `created_by` and `updated_by` fields are links to `core.user`.

**`soft_delete`** adds `archived_at`. DELETE becomes an archive operation. List and get queries exclude archived records by default. Updates and deletes on archived records are blocked.

For status fields and state transitions, define your own enum field and use [actions](/concepts/actions) backed by services to handle the logic.

## Computed fields

Some values do not come from user input. They are derived from other fields. A total is the sum of line items. An outstanding balance is the difference between what was invoiced and what was paid. Computed fields let you express these relationships declaratively:

```typescript
fields: {
  items: field.children('sales.order_item', { foreignKey: 'order_id' }),
  total: field.computed({
    depends: ['items.amount'],
    compute: (doc) => doc.items?.reduce((sum, item) => sum + (item.amount || 0), 0) ?? 0,
  }),
  outstanding: field.computed({
    depends: ['total', 'paid_amount'],
    compute: (doc) => (doc.total || 0) - (doc.paid_amount || 0),
  }),
}
```

Computed fields are virtual. They are evaluated when the record is read and not persisted to the database. They do not create columns.

## Naming

Controls which field shows up as the record's title (in link fields, breadcrumbs, lists):

```typescript
naming: 'customer_name'; // string field as title
naming: 'invoice_number'; // sequence field as title
```

## Extensions

Other apps can add fields and hooks to your models without modifying them:

```typescript
import { defineExtension, field } from 'rangka';

export default defineExtension('sales.customer', {
  fields: {
    loyalty_points: field.int({ default: 0 }),
    tier: field.enum(['Bronze', 'Silver', 'Gold']),
  },
});
```

Extended fields merge into the model's schema. They appear in the API, forms, and lists alongside the base fields.

## What a model becomes

From a single `defineModel()`, the framework produces:

| Layer           | What you get                                                                 |
| --------------- | ---------------------------------------------------------------------------- |
| **Database**    | Table with typed columns, foreign keys, indexes                              |
| **REST API**    | `GET/POST/PUT/DELETE /api/{app}/{model}` with filtering, sorting, pagination |
| **Permissions** | CRUD + field-level access control                                            |
| **Form UI**     | Input fields matched to types (text, date picker, dropdown, file upload)     |
| **List UI**     | Table columns with formatting and sorting                                    |
| **Validation**  | Required fields, type checking, relationship integrity                       |
