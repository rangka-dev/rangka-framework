---
status: stable
since: 0.2.0
last-updated: 2026-06-29
description: Reactive state store, bindings, filters, and the data flow cycle
---

# Reactivity

The widget system is a declarative reactive layer. You describe what the screen looks like in terms of data. The framework keeps it in sync. You set values, and everything downstream reacts.

## The cycle

```
State → Render → Interaction → Action → State (repeats)
```

1. State exists (a record field, a `$state` key, a `$filter` value)
2. Widgets read state via bindings and render
3. The user interacts (clicks, types, selects)
4. A trigger fires and executes an action
5. The action mutates state
6. Widgets that depend on the changed state re-render

There is no imperative step. You never call "refresh" or "re-render." Setting state is the only verb.

## The state store

Each page gets a `StateStore` instance. It is a flat key-value map with per-key subscriptions. When a key changes, every subscriber for that key is notified.

The store holds all reactive variables: `$state.*`, `$filter.*`, `$sort.*`, `$page.*`. Widgets subscribe to the keys they reference. The framework manages subscriptions automatically through bindings and conditions.

## Two kinds of state

### Record state (persisted)

Data from your models. Fetched by `data`, `form`, or `table` widgets. Lives on the server. Changes persist via `model.update`, `model.create`, or `service` actions.

```typescript
widget.data('sales.order', { id: '$route.id' }, [
  widget.input('customer_id'),
  widget.input('status'),
]);
```

When an input changes a field value, the change is local until you save (via `form.submit` or a service call).

### UI state (ephemeral)

The `$state` namespace. Page-scoped. Never persisted. Resets on navigation. Used for tabs, selections, drawer visibility, loading flags.

```typescript
// Set it
action.setValue('$state.activeTab', 'details')

// Read it (via visible condition)
{ visible: { field: '$state.activeTab', operator: 'eq', value: 'details' } }
```

`$state` is flat. Keys are strings, values are scalars. No nesting. Any widget on the page can read or write any key.

## Bindings are subscriptions

When a widget declares `bind: { field: 'status' }`, it subscribes to that field. When the value changes, the widget re-renders with the new value.

This is automatic. You do not wire up listeners. The binding declaration is the subscription.

```typescript
// This badge re-renders whenever status changes
widget.badge('status');

// This text re-renders whenever qty or rate changes
widget('text', { bind: { expression: '{{qty * rate}}' } });
```

## Reactive variables drive lists

Tables and data widgets in collection mode respond to three reactive namespaces:

| Variable                  | Controls              | Example                                |
| ------------------------- | --------------------- | -------------------------------------- |
| `$filter.{model}.{field}` | Which records to show | `$filter.sales.order.status = 'draft'` |
| `$sort.{model}`           | Order of records      | `$sort.sales.order = '-date,name'`     |
| `$page.{model}`           | Which page of results | `$page.sales.order = 2`                |

Set a filter and the table re-fetches. Change the sort and it re-fetches. No manual refresh.

```typescript
// An input that filters the table as the user types
widget.input('search', {
  on: { change: action.setValue('$filter.sales.order.name__like', '{{value}}') }
})

// The table watches $filter.sales.order.* and re-queries on change
widget.table('sales.order', [...])
```

### Filter suffixes

| Suffix        | Meaning          |
| ------------- | ---------------- |
| (none)        | equals           |
| `__gt`        | greater than     |
| `__gte`       | greater or equal |
| `__lt`        | less than        |
| `__lte`       | less or equal    |
| `__like`      | contains         |
| `__empty`     | is null          |
| `__not_empty` | is not null      |

Array values produce an `in` filter:

```
$filter.sales.order.status = ['draft', 'pending']
```

## Actions are state transitions

Actions do not "do things to the UI." They mutate state. The UI reacts to the new state.

```typescript
// This does not "open the drawer"
// It sets a state key. The drawer's visible condition reacts.
action.setValue('$state.drawerOpen', true);

// This does not "show the detail panel"
// It sets which record is selected. The data widget reacts.
action.setValue('$state.selectedId', '{{id}}');

// This does not "refresh the table"
// It changes a filter. The table reacts.
action.setValue('$filter.sales.order.status', 'draft');
```

Think of actions as writing to a shared reactive store. Widgets read from that store. The framework connects the two.

## The context tree

Data flows downward through the widget tree. When a `data` widget fetches a record, all its children can bind to that record's fields.

```typescript
widget.data('sales.order', { id: '$route.id' }, [
  widget.input('customer_id'),

  // Nested data widget fetches a related record
  widget.data('sales.customer', { id: 'customer_id' }, [widget.text('company_name')]),
]);
```

Context flows down. Never up. A child cannot write to a parent's record fields directly. To communicate upward, use `$state` (page-scoped, flat, accessible everywhere).

## Visible conditions are reactive

The `visible` field is not a one-time check. It is a live subscription. When the referenced value changes, the widget appears or disappears.

```typescript
// Drawer appears when selectedId has a value
widget.drawer({
  visible: { field: '$state.selectedId', operator: 'notEmpty' },
}, [...])

// Section only shows for draft orders
widget.section('Actions', {
  visible: { field: 'status', operator: 'eq', value: 'draft' },
}, [...])
```

This is how overlays work. No open/close commands. State and conditions.

## Putting it together

A complete reactive flow for a master-detail pattern:

```typescript
widgets: [
  // 1. Table fetches orders, renders rows
  widget.table(
    'sales.order',
    {
      // 2. Row click sets $state.selectedId
      on: { rowClick: action.setValue('$state.selectedId', '{{id}}') },
    },
    [widget.column('name'), widget.column('status')],
  ),

  // 3. Drawer visible condition reacts to $state.selectedId
  widget.drawer(
    {
      visible: { field: '$state.selectedId', operator: 'notEmpty' },
    },
    [
      // 4. Data widget reacts to $state.selectedId, fetches the record
      widget.data('sales.order', { id: '$state.selectedId' }, [
        // 5. Children bind to the fetched record and render
        widget.text('name', { style: 'heading' }),
        widget.badge('status'),
      ]),
    ],
  ),
];
```

The sequence: click row, state changes, drawer appears, data fetches, fields render. One `setValue` triggers the entire cascade.

## Comparison

| Concept        | Alpine.js           | Rangka                                    |
| -------------- | ------------------- | ----------------------------------------- |
| Reactive scope | `x-data` on element | `data` widget in tree                     |
| Binding        | `x-bind`, `x-text`  | `bind: { field }`, `bind: { expression }` |
| Events         | `@click`            | `on: { click: ... }`                      |
| State mutation | `this.open = true`  | `action.setValue('$state.open', true)`    |
| Conditional    | `x-show`            | `visible: { field, operator, value }`     |
| Loop           | `x-for`             | `repeat` widget                           |

The key difference: in Alpine you write imperative handlers. In Rangka everything is declarative. Actions are data structures, not code. This makes the entire page serializable and editable by a visual builder.
