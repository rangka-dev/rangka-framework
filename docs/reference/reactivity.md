---
status: stable
since: 0.2.0
last-updated: 2026-06-29
description: Reactive state system — StateStore, variables, expressions, conditions
---

# Reactivity

API reference for the reactive state system. See [Reactivity concept](/concepts/reactivity) for the mental model.

## StateStore

A flat key-value store scoped to the current page. Holds all ephemeral UI state and reactive query variables. Resets on navigation.

### Reading state

Widgets read state through bindings and conditions. You never access the store directly in page definitions.

```typescript
// Bind a widget to a state key
{ type: 'text', bind: { expression: '{{$state.activeTab}}' } }

// Condition referencing state
{ visible: { field: '$state.drawerOpen', operator: 'eq', value: true } }
```

### Writing state

Widgets write state through actions. The `setValue` action type is the primary way to mutate state.

```typescript
on: { click: { type: 'setValue', field: '$state.activeTab', value: 'details' } }
```

## State namespaces

All state lives in the same store. The key prefix determines its purpose.

| Prefix     | Purpose                  | Example key                  |
| ---------- | ------------------------ | ---------------------------- |
| `$state.`  | Ephemeral UI state       | `$state.selectedId`          |
| `$filter.` | Table/data query filters | `$filter.sales.order.status` |
| `$sort.`   | Table sort order         | `$sort.sales.order`          |
| `$page.`   | Table pagination         | `$page.sales.order`          |
| `$search.` | Table search text        | `$search.sales.order`        |

## $state

General-purpose UI state. Flat namespace. String keys, scalar values.

```typescript
// Set a value
{ type: 'setValue', field: '$state.selectedId', value: '{{id}}' }

// Read via condition
{ visible: { field: '$state.selectedId', operator: 'notEmpty' } }

// Read via expression
{ type: 'text', bind: { expression: '{{$state.selectedId}}' } }
```

Used for: active tabs, selected records, drawer open/closed, toggle flags, temporary form values.

## $filter

Drives collection queries. When a filter changes, any table or data widget bound to that model re-fetches.

### Key format

```
$filter.{model}.{field}             → equals operator (default)
$filter.{model}.{field}__{operator} → specific operator
```

### Operators

| Suffix        | Meaning                |
| ------------- | ---------------------- |
| (none)        | Equals                 |
| `__gt`        | Greater than           |
| `__gte`       | Greater than or equal  |
| `__lt`        | Less than              |
| `__lte`       | Less than or equal     |
| `__like`      | Contains (text search) |
| `__in`        | In array               |
| `__empty`     | Is null/empty          |
| `__not_empty` | Is not null/empty      |

### Examples

```typescript
// Filter orders by status
{ type: 'setValue', field: '$filter.sales.order.status', value: 'draft' }

// Filter by amount range
{ type: 'setValue', field: '$filter.sales.order.total__gte', value: 1000 }

// Text search
{ type: 'setValue', field: '$filter.sales.order.name__like', value: 'acme' }

// Clear a filter (set to null)
{ type: 'setValue', field: '$filter.sales.order.status', value: null }
```

Array values with the default operator are converted to `in`:

```typescript
// These are equivalent
{ type: 'setValue', field: '$filter.sales.order.status', value: ['draft', 'confirmed'] }
{ type: 'setValue', field: '$filter.sales.order.status__in', value: ['draft', 'confirmed'] }
```

## $sort

Controls sort order for a model's collection query.

### Value format

Comma-separated field names. Prefix with `-` for descending.

```typescript
// Sort by date descending
{ type: 'setValue', field: '$sort.sales.order', value: '-date' }

// Sort by status ascending, then date descending
{ type: 'setValue', field: '$sort.sales.order', value: 'status,-date' }

// Clear sort (use model default)
{ type: 'setValue', field: '$sort.sales.order', value: null }
```

## $page

Controls pagination for a model's collection query. 1-indexed.

```typescript
// Go to page 3
{ type: 'setValue', field: '$page.sales.order', value: 3 }

// Reset to page 1 (typically after changing filters)
{ type: 'setValue', field: '$page.sales.order', value: 1 }
```

Setting a `$filter.*` or `$sort.*` value does not automatically reset the page. Reset it explicitly when changing filters.

## $search

Full-text search across model fields marked as `searchable`.

```typescript
{ type: 'setValue', field: '$search.sales.order', value: 'acme corp' }

// Clear search
{ type: 'setValue', field: '$search.sales.order', value: null }
```

## Expressions

Template expressions evaluate against a merged context containing record fields, parent context, and state.

### Syntax

Wrap in `{{ }}` for evaluation:

```typescript
bind: {
  expression: '{{qty * rate}}';
}
bind: {
  expression: '{{$state.selectedId}}';
}
bind: {
  expression: '{{$parent.total}}';
}
```

### Available in expressions

| Reference      | Resolves to                 |
| -------------- | --------------------------- |
| `fieldName`    | Current record field        |
| `$state.key`   | Page state value            |
| `$parent.x`    | Parent context record field |
| `$root.x`      | Root context record field   |
| `$route.param` | URL route parameter         |

### Operators

| Precedence  | Operators            |
| ----------- | -------------------- |
| 1 (lowest)  | `\|\|`               |
| 2           | `&&`                 |
| 3           | `==`, `!=`           |
| 4           | `>`, `<`, `>=`, `<=` |
| 5           | `+`, `-`             |
| 6 (highest) | `*`, `/`, `%`        |

Unary: `!` (not), `-` (negation)

### Built-in functions

| Category  | Functions                                                            |
| --------- | -------------------------------------------------------------------- |
| Aggregate | `sum()`, `count()`, `avg()`, `min()`, `max()`                        |
| Math      | `round(n, decimals)`, `abs()`, `ceil()`, `floor()`                   |
| String    | `upper()`, `lower()`, `concat()`, `trim()`                           |
| Date      | `today()`, `now()`, `add_days()`, `diff_days()`, `format_date()`     |
| Format    | `format_currency(value, currency)`, `format_number(value, decimals)` |
| Logic     | `if(cond, then, else)`, `coalesce(...args)`                          |

## Conditions

The `visible` field on any widget. Evaluated reactively. Widget renders only when all conditions are true (AND logic).

### Condition shape

```typescript
interface Condition {
  field: string;
  operator: 'eq' | 'neq' | 'in' | 'notIn' | 'empty' | 'notEmpty' | 'gt' | 'lt' | 'gte' | 'lte';
  value?: unknown;
}
```

### Operators

| Operator   | Meaning               | Needs `value` |
| ---------- | --------------------- | ------------- |
| `eq`       | Equals                | yes           |
| `neq`      | Not equals            | yes           |
| `in`       | In array              | yes (array)   |
| `notIn`    | Not in array          | yes (array)   |
| `empty`    | Null or empty string  | no            |
| `notEmpty` | Has a value           | no            |
| `gt`       | Greater than          | yes           |
| `lt`       | Less than             | yes           |
| `gte`      | Greater than or equal | yes           |
| `lte`      | Less than or equal    | yes           |

### Single condition

```typescript
visible: { field: '$state.drawerOpen', operator: 'eq', value: true }
```

### Multiple conditions (AND)

```typescript
visible: [
  { field: '$state.mode', operator: 'eq', value: 'edit' },
  { field: 'status', operator: 'neq', value: 'archived' },
];
```

### Field references in conditions

The `field` string resolves against the merged context (same as expressions):

```typescript
// Record field from current data context
{ field: 'status', operator: 'eq', value: 'draft' }

// Page state
{ field: '$state.activeTab', operator: 'eq', value: 'details' }
```

## Actions that mutate state

### setValue

Sets a single state key.

```typescript
{ type: 'setValue', field: '$state.key', value: 'newValue' }
{ type: 'setValue', field: '$filter.model.field', value: 'filterValue' }
```

The `value` field supports expressions:

```typescript
{ type: 'setValue', field: '$state.selectedId', value: '{{id}}' }
```

### setValues

Batch update. Only triggers one re-render cycle.

```typescript
{ type: 'setValues', values: {
  '$state.selectedId': '{{id}}',
  '$state.drawerOpen': true,
} }
```

## Context tree

Data flows downward. Each `data` or `form` widget creates a new context for its children.

| Reference   | Meaning                             |
| ----------- | ----------------------------------- |
| `fieldName` | Field from nearest ancestor context |
| `$parent.x` | Field from parent context           |
| `$root.x`   | Field from outermost context        |
| `$state.x`  | Page-scoped state (flat, global)    |
| `$route.x`  | URL route parameter                 |

Context never flows upward. To communicate from child to parent, write to `$state` and read it above.
