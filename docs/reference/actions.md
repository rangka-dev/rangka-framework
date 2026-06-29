---
status: stable
since: 0.2.0
last-updated: 2026-06-29
description: WidgetAction types with fields, behavior, and examples
---

# Actions

Widget actions are declarative state transitions. They fire from widget triggers via the `on` field. The framework dispatches each action to the appropriate handler.

See [Actions concept](/concepts/actions) for patterns and usage.

## action helper

The `action` export provides typed shortcuts for all built-in action types.

```typescript
import { action } from 'rangka';

action('navigate', { path: '/home' });
action.navigate('/home');
action.service('sales.submit', { id: '$id' });
action.sequence([action.submit(), action.navigate('/list')]);
```

## setValue

Sets a single field or state key.

| Field   | Type    | Required | Description                     |
| ------- | ------- | -------- | ------------------------------- |
| `field` | string  | yes      | Target key (see prefixes below) |
| `value` | unknown | yes      | Value to set                    |

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
action.setValue('$state.selectedId', '{{id}}');
action.setValue('$filter.sales.order.status', 'draft');
action.setValue('$sort.sales.order', '-created_at');
action.setValue('status', 'confirmed');
```

---

## clearValue

Sets a field to null.

| Field   | Type   | Required | Description |
| ------- | ------ | -------- | ----------- |
| `field` | string | yes      | Target key  |

```typescript
action.clearValue('$state.selectedId');
action.clearValue('$filter.sales.order.status');
```

---

## setValues

Batch-sets multiple fields in a single re-render cycle.

| Field    | Type                     | Required | Description                 |
| -------- | ------------------------ | -------- | --------------------------- |
| `values` | Record\<string, unknown> | yes      | Map of field keys to values |

```typescript
action.setValues({
  '$state.selectedId': '{{id}}',
  '$state.drawerOpen': true,
});
```

---

## navigate

Navigates to a route path. Supports expression interpolation.

| Field  | Type   | Required | Description                    |
| ------ | ------ | -------- | ------------------------------ |
| `path` | string | yes      | Target route. Supports `{{ }}` |

```typescript
action.navigate('/sales/orders/{{id}}');
action.navigate('/sales/orders');
```

---

## service

Calls a registered backend service.

| Field       | Type                     | Required | Description              |
| ----------- | ------------------------ | -------- | ------------------------ |
| `name`      | string                   | yes      | Service name             |
| `params`    | Record\<string, unknown> | no       | Explicit params to send  |
| `context`   | string                   | no       | Additional context data  |
| `onSuccess` | WidgetAction             | no       | Action to run on success |
| `onError`   | WidgetAction             | no       | Action to run on failure |

When fired inside a data context, the current record is sent automatically. Explicit `params` override the record.

```typescript
action.service('sales.submitOrder');
action.service('sales.export', { format: 'csv', month: 6 });
```

The `onSuccess` action can access the service response via `$response`:

```typescript
{ type: 'service', name: 'sales.submitOrder',
  onSuccess: { type: 'navigate', path: '/sales/orders' },
  onError: { type: 'setValue', field: '$state.error', value: '{{$response.message}}' } }
```

---

## validate

Validates form fields. Only works inside a `form` widget.

| Field    | Type     | Required | Description                                 |
| -------- | -------- | -------- | ------------------------------------------- |
| `fields` | string[] | no       | Specific fields to validate. All if omitted |

```typescript
action.validate();
action.validate(['email', 'phone']);
```

---

## refreshSource

Invalidates and re-fetches the current data source query. No fields. Use after a mutation that does not automatically trigger a refetch.

```typescript
action.refreshSource();
```

---

## fetchOptions

Fetches dependent options for a select or link field.

| Field     | Type     | Required | Description                       |
| --------- | -------- | -------- | --------------------------------- |
| `field`   | string   | yes      | Target field to populate options  |
| `depends` | string[] | yes      | Fields that the options depend on |

```typescript
action.fetchOptions('city', ['country']);
```

---

## focus

Moves focus to a form field by name.

| Field   | Type   | Required | Description         |
| ------- | ------ | -------- | ------------------- |
| `field` | string | yes      | Field name to focus |

```typescript
action.focus('email');
```

---

## model.create

Creates a new record via the model API.

| Field   | Type                     | Required | Description |
| ------- | ------------------------ | -------- | ----------- |
| `model` | string                   | yes      | Model name  |
| `data`  | Record\<string, unknown> | yes      | Record data |

```typescript
action.modelCreate('sales.order', { status: 'draft', customer_id: '{{$state.customerId}}' });
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
action.modelUpdate({ status: 'confirmed' });
action.modelUpdate({ status: 'archived' }, { model: 'sales.order', id: '{{id}}' });
```

---

## model.delete

Deletes a record. Defaults to current context record if `model` and `id` are omitted.

| Field   | Type   | Required | Description                      |
| ------- | ------ | -------- | -------------------------------- |
| `model` | string | no       | Model name (defaults to context) |
| `id`    | string | no       | Record ID (defaults to context)  |

```typescript
action.modelDelete();
action.modelDelete({ model: 'sales.order', id: '{{id}}' });
```

---

## model.fetch

Fetches a single record and stores the result in state.

| Field   | Type   | Required | Description                     |
| ------- | ------ | -------- | ------------------------------- |
| `model` | string | yes      | Model name                      |
| `id`    | string | yes      | Record ID. Supports expressions |
| `into`  | string | yes      | State key to store the result   |

```typescript
action.modelFetch('sales.customer', '{{customer_id}}', '$state.customer');
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
action.modelList('sales.product', '$state.products', { active: true });
```

---

## addRow

Adds a new empty row to a repeater/array field.

| Field   | Type   | Required | Description      |
| ------- | ------ | -------- | ---------------- |
| `field` | string | yes      | Array field name |

```typescript
action.addRow('line_items');
```

---

## removeRow

Removes the current row from a repeater/array field. Only valid inside a `repeat` widget.

| Field   | Type   | Required | Description      |
| ------- | ------ | -------- | ---------------- |
| `field` | string | yes      | Array field name |

```typescript
action.removeRow('line_items');
```

---

## duplicateRow

Duplicates the current row in a repeater/array field.

| Field   | Type   | Required | Description      |
| ------- | ------ | -------- | ---------------- |
| `field` | string | yes      | Array field name |

```typescript
action.duplicateRow('line_items');
```

---

## form.submit

Submits the form. Only works inside a `form` widget. Validates all fields before submitting. Uses POST for create mode, PATCH for edit mode.

No fields.

```typescript
action.submit();
```

On success, the form's `onSuccess` trigger fires. On validation failure, field errors display inline.

---

## form.reset

Resets the form to its initial values and clears all validation errors. Only works inside a `form` widget.

No fields.

```typescript
action.reset();
```

---

## toast

Displays a notification message.

| Field     | Type   | Required | Description                              |
| --------- | ------ | -------- | ---------------------------------------- |
| `message` | string | yes      | Message to display                       |
| `variant` | enum   | no       | `info`, `success`, `warning`, or `error` |

```typescript
action.toast('Order submitted');
action.toast('Failed to save', 'error');
```

---

## sequence

Runs multiple actions in order. Each action completes before the next starts.

| Field     | Type           | Required | Description             |
| --------- | -------------- | -------- | ----------------------- |
| `actions` | WidgetAction[] | yes      | Actions to run in order |

```typescript
action.sequence([
  action.validate(),
  action.service('sales.submit'),
  action.navigate('/sales/orders'),
]);
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
action.conditional(
  { field: 'status', operator: 'eq', value: 'draft' },
  action.service('sales.submit'),
  action.toast('Can only submit drafts', 'error'),
);
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
action.setValue('$state.total', '{{qty * rate}}');
action.navigate('/orders/{{$route.id}}/edit');
```
