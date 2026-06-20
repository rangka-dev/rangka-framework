---
status: stable
since: 0.2.0
last-updated: 2026-06-15
description: 'Reactive cycle mental model: state, bindings, and actions'
---

# Reactivity

The widget system is a declarative reactive layer. You describe what the screen looks like in terms of data, and the framework keeps it in sync. You never manually update the DOM or re-fetch data. You set values, and everything downstream reacts.

This page explains the mental model. How data flows through the tree, how changes propagate, and how actions close the loop.

## The cycle

```
State → Render → Interaction → Action → State (repeats)
```

1. State exists (a record field, a `$state` key, a `$filter` value)
2. Widgets read state via bindings and render accordingly
3. The user interacts (clicks, types, selects)
4. A trigger fires and executes an action
5. The action mutates state
6. Widgets that depend on the changed state re-render

There is no imperative step. You never call "refresh" or "re-render". Setting state is the only verb.

## Two kinds of state

### Record state (persisted)

Data from your models. Fetched by the `data` widget or `table` widget. Lives on the server. Changes persist via `model.update`, `model.create`, or `service` actions.

```typescript
// data widget fetches the record
{ type: 'data', source: { model: 'sales.order', id: '$route.id' }, children: [
  // children bind to record fields
  { type: 'input', bind: { field: 'customer_id' } },
  { type: 'input', bind: { field: 'status' } },
] }
```

When an input changes a field value, the change is local until you explicitly save (via `model.update` or a service).

### UI state (ephemeral)

The `$state` namespace. Page-scoped. Never persisted. Resets on navigation. Used for tabs, selections, drawer visibility, loading flags.

```typescript
// Set it
{ type: 'setValue', field: '$state.activeTab', value: 'details' }

// Read it (via visible condition)
{ visible: { field: '$state.activeTab', operator: 'eq', value: 'details' } }
```

`$state` is flat. Keys are strings, values are scalars. No nesting. Any widget on the page can read or write any key.

## Bindings are subscriptions

When a widget declares `bind: { field: 'status' }`, it subscribes to that field. When the field value changes (because the user typed, or an action set it), the widget re-renders with the new value.

This is automatic. You do not wire up listeners or watchers. The binding declaration is the subscription.

```typescript
// This badge re-renders whenever status changes
{ type: 'badge', bind: { field: 'status' } }

// This text re-renders whenever qty or rate changes
{ type: 'text', bind: { expression: '{{qty * rate}}' } }
```

## Reactive variables drive lists

Tables and data widgets in collection mode respond to three reactive namespaces:

| Variable                  | Controls              |
| ------------------------- | --------------------- |
| `$filter.{model}.{field}` | Which records to show |
| `$sort.{model}`           | Order of records      |
| `$page.{model}`           | Which page of results |

Set a filter, the table re-fetches. Change the sort, the table re-fetches. Go to page 2, the table re-fetches. No manual refresh.

```typescript
// An input that filters the table as you type
{ type: 'input', props: { placeholder: 'Search...' },
  bind: { field: '$filter.sales.order.name__like' } }

// The table responds automatically
{ type: 'table', bind: { model: { name: 'sales.order' } }, children: [...] }
```

The input writes to `$filter.sales.order.name__like`. The table watches all `$filter.sales.order.*` keys. When any changes, it re-queries.

## Actions are state transitions

Actions do not "do things to the UI." They mutate state. The UI reacts to the new state.

```typescript
// This does not "open the drawer"
// It sets a state key. The drawer's visible condition reacts.
{ type: 'setValue', field: '$state.drawerOpen', value: true }

// This does not "show the detail panel"
// It sets which record is selected. The data widget reacts.
{ type: 'setValue', field: '$state.selectedId', value: '{{id}}' }

// This does not "refresh the table"
// It changes a filter. The table reacts.
{ type: 'setValue', field: '$filter.sales.order.status', value: 'draft' }
```

Think of actions as writing to a shared reactive store. Widgets read from that store. The framework connects the two.

## The context tree

Data flows downward through the widget tree. When a `data` widget fetches a record, all its children can bind to that record's fields. This is the context.

```typescript
{ type: 'data', source: { model: 'sales.order', id: '$route.id' }, children: [
  // These bind to the fetched order record
  { type: 'input', bind: { field: 'customer_id' } },

  // Nested data widget fetches a related record
  { type: 'data', source: { model: 'sales.customer', id: 'customer_id' }, children: [
    // These bind to the customer record
    { type: 'text', bind: { field: 'company_name' } },
    // Access parent with $parent
    { type: 'text', bind: { expression: '{{$parent.total}}' } },
  ] },
] }
```

Context flows down. Never up. A child cannot write to a parent's record fields directly. To communicate upward, use `$state` (page-scoped, flat, accessible everywhere).

## Visible conditions are reactive

The `visible` field is not a one-time check. It is a live subscription. When the referenced field changes, the widget appears or disappears.

```typescript
// Drawer appears when selectedId has a value
{ type: 'drawer', visible: { field: '$state.selectedId', operator: 'notEmpty' }, children: [...] }

// Section only shows for draft orders
{ type: 'section', visible: { field: 'status', operator: 'eq', value: 'draft' }, children: [...] }
```

This is how overlays work. No open/close commands. Just state and conditions.

## Putting it together

A complete reactive flow for a master-detail pattern:

```typescript
body: [
  // 1. Table fetches orders, renders rows
  { type: 'table', bind: { model: { name: 'sales.order' } },
    // 2. Row click sets $state.selectedId (action mutates state)
    on: { rowClick: { type: 'setValue', field: '$state.selectedId', value: '{{id}}' } },
    children: [...] },

  // 3. Drawer visible condition reacts to $state.selectedId
  { type: 'drawer', visible: { field: '$state.selectedId', operator: 'notEmpty' },
    children: [
      // 4. Data widget reacts to $state.selectedId, fetches the record
      { type: 'data', source: { model: 'sales.order', id: '$state.selectedId' },
        children: [
          // 5. Children bind to the fetched record and render
          { type: 'text', bind: { field: 'name' }, props: { style: 'heading' } },
          { type: 'badge', bind: { field: 'status' } },
        ] },
    ] },
]
```

The sequence: click row → state changes → drawer appears → data fetches → fields render. One `setValue` triggers the entire cascade.

## Comparison to other models

| Concept          | Alpine.js              | Rangka widgets                            |
| ---------------- | ---------------------- | ----------------------------------------- |
| Reactive scope   | `x-data` on an element | `data` widget in the tree                 |
| Binding          | `x-bind`, `x-text`     | `bind: { field }`, `bind: { expression }` |
| Events           | `@click`               | `on: { click: ... }`                      |
| State mutation   | `this.open = true`     | `setValue('$state.open', true)`           |
| Conditional show | `x-show`               | `visible: { field, operator, value }`     |
| Loop             | `x-for`                | `repeat` widget                           |
| No build step    | HTML attributes        | JSON widget tree                          |

The key difference: in Alpine you write imperative handlers (`this.count++`). In Rangka everything is declarative. You declare what action to run, and the action is a data structure, not code. This makes the entire page serializable and editable by a visual builder.
