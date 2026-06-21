---
status: stable
since: 0.2.0
last-updated: 2026-06-21
description: WidgetAction types — all available actions with fields, behavior, and examples
---

# Actions

API reference for widget actions. See [Actions concept](/concepts/actions) for patterns and usage.

Actions are declarative state transitions. They fire from widget triggers via the `on` field. The framework dispatches each action to the appropriate handler.

## setValue

Sets a single field or state key.

| Field   | Type    | Required | Description                        |
| ------- | ------- | -------- | ---------------------------------- |
| `field` | string  | yes      | Target key (see prefixes below)    |
| `value` | unknown | yes      | Value to set. Supports expressions |

### Field prefixes

| Prefix     | Behavior                                     |
| ---------- | -------------------------------------------- |
| `$state.`  | Sets page-scoped UI state                    |
| `$filter.` | Sets a query filter (triggers table refetch) |
| `$sort.`   | Sets sort order (triggers table refetch)     |
| `$page.`   | Sets page number (triggers table refetch)    |
| `$parent.` | Sets a field on the parent record context    |
| (none)     | Sets a field on the current record context   |

### Examples

```typescript
{ type: 'setValue', field: '$state.selectedId', value: '{{id}}' }
{ type: 'setValue', field: '$filter.sales.order.status', value: 'draft' }
{ type: 'setValue', field: '$sort.sales.order', value: '-created_at' }
{ type: 'setValue', field: 'status', value: 'confirmed' }
```

---

## clearValue

Sets a field to null. Shorthand for `setValue` with `value: null`.

| Field   | Type   | Required | Description |
| ------- | ------ | -------- | ----------- |
| `field` | string | yes      | Target key  |

```typescript
{ type: 'clearValue', field: '$state.selectedId' }
{ type: 'clearValue', field: '$filter.sales.order.status' }
```

---

## setValues

Batch-sets multiple fields in a single re-render cycle.

| Field    | Type                     | Required | Description                 |
| -------- | ------------------------ | -------- | --------------------------- |
| `values` | Record\<string, unknown> | yes      | Map of field keys to values |

```typescript
{ type: 'setValues', values: {
  '$state.selectedId': '{{id}}',
  '$state.drawerOpen': true,
} }
```

---

## navigate

Navigates to a route path. Supports expression interpolation.

| Field  | Type   | Required | Description                    |
| ------ | ------ | -------- | ------------------------------ |
| `path` | string | yes      | Target route. Supports `{{ }}` |

```typescript
{ type: 'navigate', path: '/sales/orders/{{id}}' }
{ type: 'navigate', path: '/sales/orders' }
```

---

## service

Calls a registered backend service.

| Field       | Type                     | Required | Description                        |
| ----------- | ------------------------ | -------- | ---------------------------------- |
| `name`      | string                   | yes      | Service name (e.g. `sales.submit`) |
| `params`    | Record\<string, unknown> | no       | Explicit params to send            |
| `context`   | Record\<string, unknown> | no       | Additional context data            |
| `onSuccess` | WidgetAction             | no       | Action to run on success           |
| `onError`   | WidgetAction             | no       | Action to run on failure           |

When fired inside a data context, the current record is sent automatically. Explicit `params` override the record.

```typescript
{ type: 'service', name: 'sales.submitOrder' }

{ type: 'service', name: 'sales.submitOrder',
  onSuccess: { type: 'navigate', path: '/sales/orders' },
  onError: { type: 'setValue', field: '$state.error', value: '{{$response.message}}' } }

{ type: 'service', name: 'reports.export', params: { format: 'csv', month: 6 } }
```

### Response access

The `onSuccess` action can access the service response via `$response`:

```typescript
onSuccess: { type: 'setValue', field: '$state.newId', value: '{{$response.id}}' }
```

---

## validate

Validates form fields. Only works inside a `form` widget.

| Field    | Type     | Required | Description                                 |
| -------- | -------- | -------- | ------------------------------------------- |
| `fields` | string[] | no       | Specific fields to validate. All if omitted |

```typescript
{ type: 'validate' }
{ type: 'validate', fields: ['email', 'phone'] }
```

---

## refreshSource

Invalidates and re-fetches the current data source query.

No fields. Use after a mutation that does not automatically trigger a refetch.

```typescript
{
  type: 'refreshSource';
}
```

---

## fetchOptions

Fetches dependent options for a select or link field.

| Field     | Type     | Required | Description                       |
| --------- | -------- | -------- | --------------------------------- |
| `field`   | string   | yes      | Target field to populate options  |
| `depends` | string[] | yes      | Fields that the options depend on |

```typescript
{ type: 'fetchOptions', field: 'city', depends: ['country'] }
```

> **Planned** — handler stub exists but full implementation is pending.

---

## focus

Moves focus to a form field by name.

| Field   | Type   | Required | Description         |
| ------- | ------ | -------- | ------------------- |
| `field` | string | yes      | Field name to focus |

```typescript
{ type: 'focus', field: 'email' }
```

---

## model.create

Creates a new record via the model API.

| Field   | Type                     | Required | Description |
| ------- | ------------------------ | -------- | ----------- |
| `model` | string                   | yes      | Model name  |
| `data`  | Record\<string, unknown> | yes      | Record data |

```typescript
{ type: 'model.create', model: 'sales.order', data: { status: 'draft', customer_id: '{{$state.customerId}}' } }
```

---

## model.update

Updates an existing record. Defaults to current context record if `model` and `id` are omitted.

| Field   | Type                     | Required | Description                      |
| ------- | ------------------------ | -------- | -------------------------------- |
| `model` | string                   | no       | Model name (defaults to context) |
| `id`    | string                   | no       | Record ID (defaults to context)  |
| `data`  | Record\<string, unknown> | yes      | Fields to update                 |

```typescript
{ type: 'model.update', data: { status: 'confirmed' } }
{ type: 'model.update', model: 'sales.order', id: '{{id}}', data: { status: 'archived' } }
```

---

## model.delete

Deletes a record. Defaults to current context record if `model` and `id` are omitted.

| Field   | Type   | Required | Description                      |
| ------- | ------ | -------- | -------------------------------- |
| `model` | string | no       | Model name (defaults to context) |
| `id`    | string | no       | Record ID (defaults to context)  |

```typescript
{ type: 'model.delete' }
{ type: 'model.delete', model: 'sales.order', id: '{{id}}' }
```

---

## model.fetch

Fetches a single record and stores the result.

| Field   | Type   | Required | Description                     |
| ------- | ------ | -------- | ------------------------------- |
| `model` | string | yes      | Model name                      |
| `id`    | string | yes      | Record ID. Supports expressions |
| `into`  | string | yes      | State key to store the result   |

```typescript
{ type: 'model.fetch', model: 'sales.customer', id: '{{customer_id}}', into: '$state.customer' }
```

---

## model.list

Fetches a collection of records with optional filters.

| Field     | Type                     | Required | Description                   |
| --------- | ------------------------ | -------- | ----------------------------- |
| `model`   | string                   | yes      | Model name                    |
| `filters` | Record\<string, unknown> | no       | Filter parameters             |
| `into`    | string                   | yes      | State key to store the result |

```typescript
{ type: 'model.list', model: 'sales.product', filters: { active: true }, into: '$state.products' }
```

---

## addRow

Adds a new empty row to a repeater/array field.

| Field   | Type   | Required | Description      |
| ------- | ------ | -------- | ---------------- |
| `field` | string | yes      | Array field name |

```typescript
{ type: 'addRow', field: 'line_items' }
```

---

## removeRow

Removes the current row from a repeater/array field. Only valid inside a `repeat` widget.

| Field   | Type   | Required | Description      |
| ------- | ------ | -------- | ---------------- |
| `field` | string | yes      | Array field name |

```typescript
{ type: 'removeRow', field: 'line_items' }
```

---

## duplicateRow

Duplicates the current row in a repeater/array field.

| Field   | Type   | Required | Description      |
| ------- | ------ | -------- | ---------------- |
| `field` | string | yes      | Array field name |

```typescript
{ type: 'duplicateRow', field: 'line_items' }
```

---

## form.submit

Submits the form. Only works inside a `form` widget. Validates all fields before submitting. Uses POST for create mode, PATCH for edit mode.

No fields.

```typescript
{
  type: 'form.submit';
}
```

On success, the form's `onSuccess` trigger fires. On validation failure, field errors display inline.

---

## form.reset

Resets the form to its initial values and clears all validation errors. Only works inside a `form` widget.

No fields.

```typescript
{
  type: 'form.reset';
}
```

---

## sequence

Runs multiple actions in order. Each action completes before the next starts.

| Field     | Type           | Required | Description             |
| --------- | -------------- | -------- | ----------------------- |
| `actions` | WidgetAction[] | yes      | Actions to run in order |

```typescript
{ type: 'sequence', actions: [
  { type: 'validate' },
  { type: 'service', name: 'sales.submit' },
  { type: 'navigate', path: '/sales/orders' },
] }
```

---

## conditional

Branches execution based on a condition.

| Field       | Type         | Required | Description                         |
| ----------- | ------------ | -------- | ----------------------------------- |
| `condition` | Condition    | yes      | Condition to evaluate               |
| `then`      | WidgetAction | yes      | Action to run if condition is true  |
| `else`      | WidgetAction | no       | Action to run if condition is false |

```typescript
{ type: 'conditional',
  condition: { field: 'status', operator: 'eq', value: 'draft' },
  then: { type: 'service', name: 'sales.submit' },
  else: { type: 'setValue', field: '$state.error', value: 'Can only submit drafts' } }
```

---

## Expression interpolation

All string values in actions support `{{ }}` template expressions. The evaluation context includes:

| Variable    | Resolves to                                   |
| ----------- | --------------------------------------------- |
| `fieldName` | Field from current record context             |
| `$state.x`  | Page state value                              |
| `$parent.x` | Parent record field                           |
| `$root.x`   | Root record field                             |
| `$route.x`  | URL route parameter                           |
| `$response` | Service response (in onSuccess/onError)       |
| `$selected` | Selected record (in table context)            |
| `value`     | Trigger argument (e.g. input value on change) |

```typescript
{ type: 'setValue', field: '$state.total', value: '{{qty * rate}}' }
{ type: 'navigate', path: '/orders/{{$route.id}}/edit' }
```
