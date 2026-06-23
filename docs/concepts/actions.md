---
status: stable
since: 0.2.0
last-updated: 2026-06-15
description: Page-level and widget-level actions, triggers, and handlers
---

# Actions

Users need to do things. Submit an order, export a report, navigate to a form. Actions are the bridge between interaction and behavior.

Actions exist at two levels: page-level (topbar) and widget-level (triggers).

## Page-level actions

Page-level actions render in the topbar. The shell manages them.

```typescript
definePage({
  key: 'sales.orders',
  label: 'Sales Orders',
  actions: [
    { type: 'button', label: 'New Order', icon: 'plus', action: { type: 'navigate', path: '/sales/orders/new' } },
    { type: 'button', label: 'Export', variant: 'secondary', action: { type: 'service', name: 'sales.export' } },
  ],
  widgets: [...],
});
```

Action types: `button`, `menu`, `toggle-group`, `separator`.

Page actions use the same `WidgetAction` format as widget triggers. Not all action types are available at page level since some require widget context (form, record, data source).

### Context availability

| Action          | Widget | Page | Requires                                        |
| --------------- | ------ | ---- | ----------------------------------------------- |
| `navigate`      | Yes    | Yes  | —                                               |
| `service`       | Yes    | Yes  | Widget passes record; page passes params only   |
| `model.create`  | Yes    | Yes  | —                                               |
| `sequence`      | Yes    | Yes  | Only if inner actions are page-compatible       |
| `setValue`      | Yes    | No   | Record or state context                         |
| `clearValue`    | Yes    | No   | Record or state context                         |
| `setValues`     | Yes    | No   | Record or state context                         |
| `model.update`  | Yes    | No   | Record context (defaults model/id from context) |
| `model.delete`  | Yes    | No   | Record context (defaults model/id from context) |
| `model.fetch`   | Yes    | No   | State store (`into` field)                      |
| `model.list`    | Yes    | No   | State store (`into` field)                      |
| `refreshSource` | Yes    | No   | Data source context                             |
| `fetchOptions`  | Yes    | No   | Widget context                                  |
| `validate`      | Yes    | No   | Form context                                    |
| `focus`         | Yes    | No   | Form context                                    |
| `form.submit`   | Yes    | No   | Form context                                    |
| `form.reset`    | Yes    | No   | Form context                                    |
| `addRow`        | Yes    | No   | Child table context                             |
| `removeRow`     | Yes    | No   | Child table context                             |
| `duplicateRow`  | Yes    | No   | Child table context                             |
| `conditional`   | Yes    | No   | Context for condition evaluation                |

## Widget-level actions

Inside the widget tree, actions are wired via triggers. A widget declares which triggers it emits. The page definition wires those triggers to actions via the `on` field.

```typescript
// Button click calls a service
{ type: 'button', props: { label: 'Submit', variant: 'primary' },
  on: { click: { type: 'service', name: 'sales.submitOrder' } } }

// Table row click sets state
{ type: 'table', source: { model: 'sales.order' },
  on: { rowClick: { type: 'setValue', field: '$state.selectedId', value: '{{id}}' } } }

// Input change clears a filter
{ type: 'input', bind: { field: 'search' },
  on: { change: { type: 'setValue', field: '$filter.sales.order.name__like', value: '{{value}}' } } }
```

## Action types

### Data actions

```typescript
{ type: 'setValue', field: string, value: any }
{ type: 'clearValue', field: string }
{ type: 'setValues', values: Record<string, any> }
```

Set or clear reactive variables (`$state`, `$filter`, `$sort`, `$page`) or record fields.

### Backend actions

```typescript
{ type: 'service', name: string, params?: Record<string, any>,
  onSuccess?: WidgetAction, onError?: WidgetAction }
{ type: 'validate', fields?: string[] }
```

Call a registered service. The framework passes the current record context automatically. Chain `onSuccess` and `onError` for follow-up behavior.

### Model actions

```typescript
{ type: 'model.create', model: string, data: Record<string, any> }
{ type: 'model.update', model?: string, id?: string, data: Record<string, any> }
{ type: 'model.delete', model?: string, id?: string }
{ type: 'model.fetch', model: string, id: string, into: string }
{ type: 'model.list', model: string, filters?: Record<string, any>, into: string }
```

Direct CRUD operations without a service wrapper.

### Navigation

```typescript
{ type: 'navigate', path: string }
```

### UI actions

```typescript
{ type: 'focus', field: string }
{ type: 'refreshSource' }
{ type: 'fetchOptions', field: string, depends: string[] }
```

`focus` moves keyboard focus to a field. `refreshSource` re-fetches the current data query. `fetchOptions` loads dependent options for a select field (planned, not fully implemented).

### Form actions

```typescript
{
  type: 'form.submit';
}
{
  type: 'form.reset';
}
```

Only work inside a `form` widget. `form.submit` validates and saves. `form.reset` reverts to initial values.

### Child table actions

```typescript
{ type: 'addRow', field: string }
{ type: 'removeRow', field: string }
{ type: 'duplicateRow', field: string }
```

### Flow control

```typescript
{ type: 'sequence', actions: WidgetAction[] }
{ type: 'conditional', condition: Condition, then: WidgetAction, else?: WidgetAction }
```

`sequence` runs actions in order. `conditional` branches based on a condition.

## How services receive data

When a `service` action fires inside a data context, the framework passes the current record:

```typescript
// Widget inside a data widget bound to sales.order
{ type: 'button', props: { label: 'Submit' },
  on: { click: { type: 'service', name: 'sales.submitOrder' } } }

// The service receives:
service.execute(doc); // doc is the order record from context
```

Page-level actions pass params (or nothing):

```typescript
// Action with explicit params
{ type: 'service', name: 'sales.monthlyReport', params: { month: 6, year: 2026 } }

// Framework calls:
service.execute({ month: 6, year: 2026 })
```

## Permission filtering

Page-level actions with `allowed` are filtered by the user's roles. If the current user does not have a matching role, the button does not render.

## Error handling

When a service action throws:

- The framework catches the error
- Shows a toast with the error message
- The UI stays where it is (no navigation, no state change)

When a service action succeeds:

- The framework refreshes the affected data source
- Runs the `onSuccess` action if provided

## Real-world example

A sales order page with status transitions:

```typescript
definePage({
  key: 'sales.orders',
  label: 'Sales Orders',
  actions: [
    {
      type: 'button',
      label: 'New Order',
      icon: 'plus',
      action: { type: 'navigate', path: '/sales/orders/new' },
    },
  ],
  widgets: [
    {
      type: 'table',
      source: { model: 'sales.order' },
      on: { rowClick: { type: 'setValue', field: '$state.selectedId', value: '{{id}}' } },
      children: [
        { type: 'column', props: { label: 'Name' }, bind: { field: 'name' } },
        {
          type: 'column',
          props: { label: 'Status' },
          children: [{ type: 'badge', bind: { field: 'status' } }],
        },
        { type: 'column', props: { label: 'Total' }, bind: { field: 'total' } },
      ],
    },
    {
      type: 'drawer',
      props: { width: 'md', title: 'Order Detail' },
      visible: { field: '$state.selectedId', operator: 'notEmpty' },
      children: [
        {
          type: 'data',
          source: { model: 'sales.order', id: '$state.selectedId' },
          children: [
            { type: 'text', bind: { field: 'name' }, props: { style: 'heading' } },
            { type: 'input', bind: { field: 'customer_id' } },
            { type: 'input', bind: { field: 'status' } },
            { type: 'input', bind: { field: 'total' } },
            {
              type: 'group',
              props: { direction: 'row', gap: 'sm' },
              children: [
                {
                  type: 'button',
                  props: { label: 'Submit', variant: 'primary' },
                  on: { click: { type: 'service', name: 'sales.submitOrder' } },
                },
                {
                  type: 'button',
                  props: { label: 'Cancel', variant: 'danger' },
                  on: { click: { type: 'service', name: 'sales.cancelOrder' } },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
});
```

The services handle all the logic:

```typescript
defineService({
  name: 'sales.submitOrder',
  factory(ctx) {
    return {
      async execute(doc) {
        if (doc.status !== 'Draft') throw new Error('Can only submit drafts');
        if (!doc.items?.length) throw new Error('Order must have at least one item');
        await ctx.db.update('sales.order', doc.id, { status: 'Submitted' });
      },
    };
  },
});

defineService({
  name: 'sales.cancelOrder',
  factory(ctx) {
    return {
      async execute(doc) {
        if (doc.status === 'Cancelled') throw new Error('Already cancelled');
        await ctx.db.update('sales.order', doc.id, { status: 'Cancelled' });
        await ctx.enqueue('sales.release-reserved-stock', { orderId: doc.id });
      },
    };
  },
});
```
