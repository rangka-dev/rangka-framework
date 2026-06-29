---
status: stable
since: 0.2.0
last-updated: 2026-06-29
description: Widget actions, triggers, page actions, and the action dispatcher
---

# Actions

Actions bridge interaction and behavior. A user clicks a button, selects a row, or submits a form. An action declares what happens next.

Actions exist at two levels: page-level (topbar) and widget-level (triggers).

## Page-level actions

Page-level actions render in the topbar. The shell manages them.

```typescript
import { definePage, action } from 'rangka';

definePage({
  key: 'sales.orders',
  label: 'Sales Orders',
  actions: [
    { type: 'button', label: 'New Order', icon: 'plus',
      action: action.navigate('/sales/orders/new') },
    { type: 'button', label: 'Export', variant: 'secondary',
      action: action.service('sales.export') },
  ],
  widgets: [...],
});
```

Action types: `button`, `menu`, `toggle-group`, `separator`.

### Context availability

Page actions operate without widget context. They cannot access record fields, form state, or data sources. Only context-free actions work at page level.

| Action          | Page | Widget | Requires                         |
| --------------- | ---- | ------ | -------------------------------- |
| `navigate`      | yes  | yes    | nothing                          |
| `service`       | yes  | yes    | params only at page level        |
| `model.create`  | yes  | yes    | nothing                          |
| `toast`         | yes  | yes    | nothing                          |
| `sequence`      | yes  | yes    | inner actions must be compatible |
| `setValue`      | no   | yes    | record or state context          |
| `clearValue`    | no   | yes    | record or state context          |
| `setValues`     | no   | yes    | record or state context          |
| `model.update`  | no   | yes    | record context                   |
| `model.delete`  | no   | yes    | record context                   |
| `model.fetch`   | no   | yes    | state store                      |
| `model.list`    | no   | yes    | state store                      |
| `refreshSource` | no   | yes    | data source context              |
| `validate`      | no   | yes    | form context                     |
| `focus`         | no   | yes    | form context                     |
| `form.submit`   | no   | yes    | form context                     |
| `form.reset`    | no   | yes    | form context                     |
| `addRow`        | no   | yes    | child table context              |
| `removeRow`     | no   | yes    | child table context              |
| `duplicateRow`  | no   | yes    | child table context              |
| `conditional`   | no   | yes    | context for evaluation           |

## Widget-level actions

Inside the widget tree, actions fire via triggers. A widget declares which triggers it emits. The `on` field wires triggers to actions.

```typescript
// Button click calls a service
widget.button('Submit', {
  variant: 'primary',
  on: { click: action.service('sales.submitOrder') }
})

// Table row click sets state
widget.table('sales.order', {
  on: { rowClick: action.setValue('$state.selectedId', '{{id}}') },
}, [...])

// Input change sets a filter
widget.input('search', {
  on: { change: action.setValue('$filter.sales.order.name__like', '{{value}}') }
})
```

## Action types

### Data mutations

```typescript
action.setValue('$state.activeTab', 'details');
action.clearValue('$state.selectedId');
action.setValues({ '$state.selectedId': '{{id}}', '$state.drawerOpen': true });
```

Set or clear reactive variables (`$state`, `$filter`, `$sort`, `$page`) or record fields.

### Service calls

```typescript
action.service('sales.submitOrder');
action.service('sales.export', { month: 6, year: 2026 });
```

Calls a registered service. Inside a data context, the framework passes the current record automatically. Chain follow-up behavior with `onSuccess` and `onError`:

```typescript
{ type: 'service', name: 'sales.submitOrder',
  onSuccess: action.navigate('/sales/orders'),
  onError: action.toast('{{$response.message}}', 'error') }
```

### Model operations

```typescript
action.modelCreate('sales.order', { status: 'Draft', customer: '{{customer_id}}' });
action.modelUpdate({ status: 'Submitted' });
action.modelDelete();
action.modelFetch('sales.order', '{{id}}', '$record');
action.modelList('sales.product', 'products', { category: 'active' });
```

`model.update` and `model.delete` default to the current record's model and id from context.

### Navigation

```typescript
action.navigate('/sales/orders/{{id}}');
```

### Form actions

```typescript
action.submit();
action.reset();
```

Only work inside a `form` widget. `form.submit` validates and saves. `form.reset` reverts to initial values. These use a ref pattern internally for cross-component coordination.

### UI actions

```typescript
action.focus('customer_id');
action.refreshSource();
action.toast('Order submitted', 'success');
action.fetchOptions('city', ['country', 'state']);
```

`focus` moves keyboard focus to a field. `refreshSource` re-fetches the current data query. `toast` shows a notification.

### Child table actions

```typescript
action.addRow('items');
action.removeRow('items');
action.duplicateRow('items');
```

### Flow control

```typescript
action.sequence([action.validate(), action.submit(), action.navigate('/sales/orders')]);

action.conditional(
  { field: 'status', operator: 'eq', value: 'Draft' },
  action.service('sales.submitOrder'),
  action.toast('Can only submit drafts', 'warning'),
);
```

`sequence` runs actions in order. `conditional` branches based on a condition.

## How services receive data

When a `service` action fires inside a data context, the framework passes the current record:

```typescript
// Button inside a data widget bound to sales.order
widget.button('Submit', {
  on: { click: action.service('sales.submitOrder') },
});

// The service receives the order record
defineService({
  name: 'sales.submitOrder',
  factory(ctx) {
    return {
      async execute(doc) {
        if (doc.status !== 'Draft') throw new Error('Can only submit drafts');
        await ctx.models.update('sales.order', doc.id, { status: 'Submitted' });
      },
    };
  },
});
```

Page-level actions pass explicit params only.

## Error handling

When a service action throws:

- The framework shows a toast with the error message
- The UI stays where it is (no navigation, no state change)
- The `onError` action runs if provided

When a service action succeeds:

- The framework refreshes affected data sources
- The `onSuccess` action runs if provided

## The action factory

The `action` helper provides typed constructors:

```typescript
import { action } from 'rangka';

action.navigate('/path')
action.service('name', params)
action.setValue('field', value)
action.submit()
action.sequence([...])
action.conditional(condition, thenAction, elseAction)
```

Use `action(type, params)` for the base form:

```typescript
action('navigate', { path: '/home' });
```
