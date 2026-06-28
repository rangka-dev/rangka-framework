---
status: stable
since: 0.1.0
last-updated: 2026-06-11
description: defineModel() API — fields, traits, relationships, and options
---

# defineModel

Declares a model. The data structure definition that drives database tables, API endpoints, UI forms, and permissions.

See [Models concept](../concepts/models.md) for usage patterns.

## Signature

```typescript
import { defineModel, field } from 'rangka';

export default defineModel({
  name: 'invoice',
  label: 'Sales Invoice',
  naming: 'invoice_number',
  auditLog: true,
  traits: ['timestamped'],
  fields: {
    invoice_number: field.sequence({ prefix: 'INV-', digits: 5 }),
    customer: field.link('sales.customer', { required: true }),
    posting_date: field.date({ required: true }),
    total: field.decimal({ precision: 18, scale: 2, readOnly: true }),
    items: field.children('sales.invoice_item', { foreignKey: 'invoice_id' }),
  },
  indexes: [{ fields: ['customer', 'posting_date'] }, { fields: ['posting_date'], unique: false }],
});
```

## ModelConfig

```typescript
interface ModelConfig {
  name: string;
  label?: string;
  naming?: NamingConfig;
  scope?: string;
  auditLog?: boolean;
  fields: Record<string, FieldConfig>;
  indexes?: IndexConfig[];
  traits?: Trait[];
}
```

### Top-Level Fields

| Field      | Type                          | Default     | Description                                                                                                              |
| ---------- | ----------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| `name`     | `string`                      | —           | **Required.** Model identifier. Combined with app name as `app.name` for qualified name.                                 |
| `label`    | `string`                      | `undefined` | Human-readable name. If omitted, derived from `name`.                                                                    |
| `naming`   | `string`                      | `undefined` | Field name to use as the record's display title.                                                                         |
| `scope`    | `ScopeConfig`                 | `undefined` | Scope to auto-filter queries by the user's active scope value. Models without `scope` are global. See ScopeConfig below. |
| `auditLog` | `boolean`                     | `false`     | Track all field changes in an audit trail table.                                                                         |
| `fields`   | `Record<string, FieldConfig>` | —           | **Required.** Field definitions keyed by field name.                                                                     |
| `indexes`  | `IndexConfig[]`               | `undefined` | Database indexes for query performance.                                                                                  |
| `traits`   | `Trait[]`                     | `undefined` | Reusable behavior mixins.                                                                                                |

## ScopeConfig

```typescript
type ScopeConfig = string | { name: string; field: string };
```

The string form uses the qualified model name directly (e.g., `'core.company'`). The object form lets you specify a custom field name on the current model that holds the scope value.

```typescript
scope: 'core.company'                          // string form: uses default field
scope: { name: 'core.company', field: 'branch' } // object form: custom field
```

## Naming

```typescript
type NamingConfig = string;
```

The `naming` field points to a field in your model that acts as the record's display title. For example, a customer model might use `naming: 'name'` so the customer's name shows up in links and references. An invoice model might use `naming: 'invoice_number'` where `invoice_number` is a `field.sequence()`.

```typescript
naming: 'invoice_number'; // uses the invoice_number field as the title
naming: 'name'; // uses the name field as the title
```

## Traits

```typescript
type Trait = 'timestamped' | 'soft_delete' | 'ledger';
```

| Trait         | Adds Fields                                                                                                  | Behavior                                                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `timestamped` | `created_at: datetime`, `updated_at: datetime`, `created_by: link(core.user)`, `updated_by: link(core.user)` | Auto-set on create/update                                                                                                                                   |
| `soft_delete` | `archived_at: datetime`                                                                                      | DELETE becomes archive (sets `archived_at`). List and get queries exclude archived records by default. Updates and deletes on archived records are blocked. |
| `ledger`      | —                                                                                                            | > **Planned** — not yet implemented. Will enforce immutability after posting and add reversal semantics for accounting entries.                             |

For status fields and state transitions, define your own `status` enum field and use [actions](/concepts/actions) backed by services to handle transitions.

## Indexes

```typescript
interface IndexConfig {
  fields: string[];
  unique?: boolean;
}
```

| Field    | Type       | Default | Description                                             |
| -------- | ---------- | ------- | ------------------------------------------------------- |
| `fields` | `string[]` | —       | **Required.** Ordered list of field names in the index. |
| `unique` | `boolean`  | `false` | Enforce uniqueness constraint.                          |

## Field Types

All fields (except relationship fields) extend `BaseFieldOptions`:

```typescript
interface BaseFieldOptions {
  required?: boolean;
  label?: string;
  hidden?: boolean;
  readOnly?: boolean;
  searchable?: boolean;
  default?: unknown;
  validation?: ValidationConfig;
}
```

| Option       | Type               | Default     | Description                                                       |
| ------------ | ------------------ | ----------- | ----------------------------------------------------------------- |
| `required`   | `boolean`          | `false`     | Field must have a value on save.                                  |
| `label`      | `string`           | `undefined` | Display label. Derived from field name if omitted.                |
| `hidden`     | `boolean`          | `false`     | Hide from UI (still exists in API).                               |
| `readOnly`   | `boolean`          | `false`     | Cannot be set via API. Typically set by hooks or computed fields. |
| `searchable` | `boolean`          | `false`     | Include this field in search queries.                             |
| `default`    | `unknown`          | `undefined` | Default value applied on create if field is empty.                |
| `validation` | `ValidationConfig` | `undefined` | Declarative validation constraints (see below).                   |

### ValidationConfig

```typescript
interface ValidationConfig {
  format?: string;
  min?: number;
  max?: number;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  message?: string;
}
```

| Option      | Type     | Description                                                                |
| ----------- | -------- | -------------------------------------------------------------------------- |
| `format`    | `string` | Built-in format validator (e.g., `'email'`, `'url'`, `'phone'`, `'uuid'`). |
| `min`       | `number` | Minimum numeric value.                                                     |
| `max`       | `number` | Maximum numeric value.                                                     |
| `pattern`   | `string` | Regex pattern the value must match.                                        |
| `minLength` | `number` | Minimum string length.                                                     |
| `maxLength` | `number` | Maximum string length.                                                     |
| `message`   | `string` | Custom error message when validation fails.                                |

`required` remains a top-level field option. `validation` provides additional declarative constraints as data, not functions. The `format` field accepts any string so you can register custom format validators.

---

### string

```typescript
interface StringFieldConfig extends BaseFieldOptions {
  type: 'string';
  maxLength?: number;
  default?: string;
}
```

| Option      | Type     | Default     | Description                                     |
| ----------- | -------- | ----------- | ----------------------------------------------- |
| `maxLength` | `number` | `undefined` | Maximum character length. Maps to `VARCHAR(n)`. |

---

### text

```typescript
interface TextFieldConfig extends BaseFieldOptions {
  type: 'text';
  default?: string;
}
```

Long-form text. Maps to `TEXT` column. No length limit.

---

### int

```typescript
interface IntFieldConfig extends BaseFieldOptions {
  type: 'int';
  default?: number;
}
```

Integer value. Maps to `INTEGER`.

---

### decimal

```typescript
interface DecimalFieldConfig extends BaseFieldOptions {
  type: 'decimal';
  precision?: number;
  scale?: number;
  default?: number;
}
```

| Option      | Type     | Default     | Description                 |
| ----------- | -------- | ----------- | --------------------------- |
| `precision` | `number` | `undefined` | Total number of digits.     |
| `scale`     | `number` | `undefined` | Digits after decimal point. |

Example: `{ type: 'decimal', precision: 18, scale: 2 }` → max `9999999999999999.99`

---

### boolean

```typescript
interface BooleanFieldConfig extends BaseFieldOptions {
  type: 'boolean';
  default?: boolean;
}
```

---

### date

```typescript
interface DateFieldConfig extends BaseFieldOptions {
  type: 'date';
  default?: string;
}
```

Date without time. Format: `YYYY-MM-DD`.

---

### datetime

```typescript
interface DatetimeFieldConfig extends BaseFieldOptions {
  type: 'datetime';
  default?: string;
}
```

Date with time. Stored as UTC. Format: ISO 8601.

---

### enum

```typescript
interface EnumFieldConfig extends BaseFieldOptions {
  type: 'enum';
  options: readonly string[];
  default?: string;
}
```

| Option    | Type                | Description                   |
| --------- | ------------------- | ----------------------------- |
| `options` | `readonly string[]` | **Required.** Allowed values. |

---

### json

```typescript
interface JsonFieldConfig extends BaseFieldOptions {
  type: 'json';
  default?: unknown;
}
```

Arbitrary JSON data. Maps to `JSONB`.

---

### money

```typescript
interface MoneyFieldConfig extends BaseFieldOptions {
  type: 'money';
}
```

Semantic field type. Stored as decimal. Marks the field as monetary so the frontend formats it as currency. The app layer handles currency awareness — no framework-level configuration needed.

---

### code

```typescript
interface CodeFieldConfig extends BaseFieldOptions {
  type: 'code';
  language: 'expression';
}
```

| Option     | Type           | Description                                                 |
| ---------- | -------------- | ----------------------------------------------------------- |
| `language` | `'expression'` | **Required.** Code language for editor syntax highlighting. |

---

### computed

```typescript
interface ComputedFieldConfig {
  type: 'computed';
  depends: string[];
  compute: (doc: Record<string, unknown>, ctx?: FrameworkContext) => unknown | Promise<unknown>;
}
```

| Option    | Type                     | Default | Description                                                                         |
| --------- | ------------------------ | ------- | ----------------------------------------------------------------------------------- |
| `depends` | `string[]`               | —       | **Required.** Field names this computed field reads. Dot notation for child fields. |
| `compute` | `(doc, ctx?) => unknown` | —       | **Required.** Computation function.                                                 |

Example:

```typescript
fields: {
  items: field.children('sales.invoice_item', { foreignKey: 'invoice_id' }),
  total: field.computed({
    depends: ['items.amount'],
    compute: (doc) => (doc.items as any[]).reduce((sum, i) => sum + i.amount, 0),
  }),
  outstanding: field.computed({
    depends: ['total', 'paid_amount'],
    compute: (doc) => (doc.total || 0) - (doc.paid_amount || 0),
  }),
}
```

---

### sequence

```typescript
interface SequenceFieldConfig {
  type: 'sequence';
  prefix?: string;
  digits?: number;
}
```

| Option   | Type     | Default     | Description                              |
| -------- | -------- | ----------- | ---------------------------------------- |
| `prefix` | `string` | `undefined` | String prepended to the sequence number. |
| `digits` | `number` | `undefined` | Zero-pad to this many digits.            |

---

### attachment

```typescript
interface AttachmentFieldConfig extends BaseFieldOptions {
  type: 'attachment';
  accept?: string[];
  maxSize?: string;
}
```

| Option    | Type       | Default     | Description                                                     |
| --------- | ---------- | ----------- | --------------------------------------------------------------- |
| `accept`  | `string[]` | `undefined` | Allowed MIME types. Example: `['image/png', 'application/pdf']` |
| `maxSize` | `string`   | `undefined` | Maximum file size. Example: `'10mb'`, `'500kb'`                 |

---

### attachments

```typescript
interface AttachmentsFieldConfig extends BaseFieldOptions {
  type: 'attachments';
  accept?: string[];
  maxSize?: string;
  maxCount?: number;
}
```

| Option     | Type       | Default     | Description              |
| ---------- | ---------- | ----------- | ------------------------ |
| `accept`   | `string[]` | `undefined` | Allowed MIME types.      |
| `maxSize`  | `string`   | `undefined` | Maximum size per file.   |
| `maxCount` | `number`   | `undefined` | Maximum number of files. |

---

## Relationship Fields

### link

```typescript
interface LinkFieldConfig extends BaseFieldOptions {
  type: 'link';
  model: string;
  nullable?: boolean;
}
```

| Option     | Type      | Default     | Description                                       |
| ---------- | --------- | ----------- | ------------------------------------------------- |
| `model`    | `string`  | —           | **Required.** Qualified model name (`app.model`). |
| `nullable` | `boolean` | `undefined` | Allow null (no foreign key constraint).           |

Foreign key to another model. Stored as the referenced record's ID.

---

### hasMany

```typescript
interface HasManyFieldConfig {
  type: 'hasMany';
  model: string;
  foreignKey: string;
}
```

| Option       | Type     | Description                                                           |
| ------------ | -------- | --------------------------------------------------------------------- |
| `model`      | `string` | **Required.** Qualified model name of the related records.            |
| `foreignKey` | `string` | **Required.** Field on the related model pointing back to this model. |

Virtual field. Does not create a column. Used for eager-loading via `?include=`. Does **not** cascade delete — related records are independent and must be deleted separately.

---

### children

```typescript
interface ChildrenFieldConfig {
  type: 'children';
  model: string;
  foreignKey: string;
  fields?: Record<string, FieldConfig>;
}
```

| Option       | Type                          | Default     | Description                                                                           |
| ------------ | ----------------------------- | ----------- | ------------------------------------------------------------------------------------- |
| `model`      | `string`                      | —           | **Required.** Qualified model name for the child table.                               |
| `foreignKey` | `string`                      | —           | **Required.** Field on the child model referencing this parent.                       |
| `fields`     | `Record<string, FieldConfig>` | `undefined` | Inline field definitions for the child model (alternative to a separate schema file). |

Parent-child relationship. Children are saved/deleted with the parent in a single transaction. Children always cascade delete with the parent — when a parent is deleted, all its children are deleted.

---

### manyToMany

```typescript
interface ManyToManyFieldConfig {
  type: 'manyToMany';
  model: string;
  through: string;
}
```

| Option    | Type     | Description                                              |
| --------- | -------- | -------------------------------------------------------- |
| `model`   | `string` | **Required.** Qualified model name of the related model. |
| `through` | `string` | **Required.** Junction table model name.                 |

---

### dynamicLink

```typescript
interface DynamicLinkFieldConfig extends BaseFieldOptions {
  type: 'dynamicLink';
  modelField: string;
}
```

| Option       | Type     | Description                                                                          |
| ------------ | -------- | ------------------------------------------------------------------------------------ |
| `modelField` | `string` | **Required.** Name of another field on this model that stores the target model name. |

Polymorphic reference. The target model is determined at runtime from another field's value.

---

### tree

```typescript
interface TreeFieldConfig extends BaseFieldOptions {
  type: 'tree';
  parentField: string;
  strategy: 'materialized_path' | 'nested_set' | 'closure_table';
}
```

| Option        | Type     | Description                                                |
| ------------- | -------- | ---------------------------------------------------------- |
| `parentField` | `string` | **Required.** Field name that stores the parent reference. |
| `strategy`    | `string` | **Required.** Tree storage strategy.                       |

Enables hierarchical queries (ancestors, descendants, subtree).

## Extensions

Extensions add fields and hooks to models defined in **other** apps. Use `defineExtension()` to extend another app's model. Use `defineHooks()` to add hooks to your own model (same app).

```typescript
import { defineExtension } from 'rangka';

export default defineExtension('sales.invoice', {
  fields: {
    tax_category: { type: 'link', model: 'tax.category' },
  },
  hooks: {
    beforeSave: async (doc, ctx) => {
      /* ... */
    },
  },
});
```

### ExtensionConfig

```typescript
interface ExtensionConfig {
  fields?: Record<string, FieldConfig>;
  hooks?: HooksConfig;
  actions?: Record<string, ActionConfig>;
}
```
