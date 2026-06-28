---
status: stable
since: 0.2.0
last-updated: 2026-06-15
description: WidgetNode tree, binding modes, context propagation, and reactivity
---

# Widgets

Everything visible on a page is a widget. A text label, an input field, a data table, a layout column. There is no other rendering abstraction. You compose widgets into trees, and those trees become your screens.

## The widget tree

A page's content is a flat array of widget nodes. Each node can contain children, forming a recursive tree.

```typescript
definePage({
  key: 'sales.orders',
  label: 'Sales Orders',
  widgets: [
    {
      type: 'table',
      source: { model: 'sales.order' },
      children: [
        { type: 'column', props: { label: 'Name' }, bind: { field: 'name' } },
        {
          type: 'column',
          props: { label: 'Status' },
          children: [{ type: 'badge', bind: { field: 'status' } }],
        },
      ],
    },
  ],
});
```

The framework walks this tree top-down, resolves each widget type from the registry, evaluates conditions, resolves bindings, and renders the component.

## WidgetNode

Every widget instance in the tree is a `WidgetNode`. This is the shape that code-first authoring, the builder API, and the visual editor all produce.

```typescript
interface WidgetNode {
  id?: string;
  type: string;
  props?: Record<string, any>;
  bind?: WidgetBinding;
  source?: WidgetSource;
  visible?: Condition | Condition[];
  on?: Record<string, WidgetAction | WidgetAction[]>;
  children?: WidgetNode[];
}
```

| Field      | Type          | Required | Description                                                  |
| ---------- | ------------- | -------- | ------------------------------------------------------------ |
| `id`       | string        | no       | Stable identifier for the visual editor. Runtime ignores it. |
| `type`     | string        | yes      | References a registered widget name.                         |
| `props`    | object        | no       | Static configuration or expression strings.                  |
| `bind`     | WidgetBinding | no       | Data binding declaration.                                    |
| `source`   | WidgetSource  | no       | Data source for the `data` widget.                           |
| `visible`  | Condition[]   | no       | Conditional rendering. Multiple conditions AND together.     |
| `on`       | object        | no       | Trigger-to-action wiring.                                    |
| `children` | WidgetNode[]  | no       | Child widgets. Only valid if the widget is a container.      |

## Widget categories

Every widget belongs to one category.

| Category  | Purpose                             | Examples                                                                              |
| --------- | ----------------------------------- | ------------------------------------------------------------------------------------- |
| `input`   | Accepts user input bound to a field | `input`                                                                               |
| `display` | Shows data (read-only)              | `text`, `badge`, `icon`, `image`                                                      |
| `layout`  | Arranges children spatially         | `group`, `section`, `split`, `grid`, `divider`, `spacer`, `column`, `drawer`, `modal` |
| `action`  | Triggers behavior on interaction    | `button`                                                                              |
| `data`    | Fetches data and provides context   | `data`, `repeat`, `table`                                                             |

## Data binding

Binding connects a widget to data. The `bind` field declares the connection.

### Field binding

Binds to a field on the nearest record in scope.

```json
{ "bind": { "field": "customer_id" } }
```

The runtime provides: value, setValue, and field metadata (type, label, required, options).

### Expression binding

Computed read-only value.

```json
{ "bind": { "expression": "{{qty * rate}}" } }
```

### Model binding

Widget fetches its own list data. Used by the `table` widget.

```json
{ "source": { "model": "sales.order", "filters": { "status": "draft" }, "limit": 10 } }
```

### No binding

Widget renders from props only. Omit `bind`.

## The data widget

The `data` widget is the data boundary. It fetches data and provides context to all its children.

```typescript
interface WidgetSource {
  model: string;
  id?: string;
}
```

The rule is simple. `id` present means single record. `id` absent means collection.

```typescript
// Single record by route param
{ type: 'data', source: { model: 'sales.order', id: '$route.id' }, children: [
  { type: 'input', bind: { field: 'customer_id' } },
  { type: 'input', bind: { field: 'order_date' } },
] }

// Collection with repeat
{ type: 'data', source: { model: 'sales.product' }, children: [
  { type: 'repeat', props: { layout: 'grid', columns: 3 }, children: [
    { type: 'text', bind: { field: 'name' } },
    { type: 'badge', bind: { field: 'status' } },
  ] },
] }
```

## Context tree

The runtime maintains a context tree mirroring the widget tree.

- Layout widgets (`group`, `section`, `split`, `grid`) do not create context. They pass through.
- The `data` widget in record mode creates a context scope from its fetched record.
- The `data` widget in collection mode provides records for child `repeat` or `table` widgets.
- The `repeat` widget iterates and creates a row-level context per record.
- The `table` widget creates a context scope. Each row gets its own row-level context.
- Nested `data` widgets create child scopes with `$parent` reference.

### Scope resolution

| Reference             | Resolves to                                 |
| --------------------- | ------------------------------------------- |
| `fieldName`           | Field on nearest record in scope            |
| `$parent.fieldName`   | One context level up                        |
| `$root.fieldName`     | Top-level page record                       |
| `$state.keyName`      | Page-level UI state                         |
| `$route.id`           | Route parameter                             |
| `$response.fieldName` | Service response (inside onSuccess/onError) |

## Reactive variables

All dynamic behavior is controlled by reactive variables set via `setValue` actions.

### $state

Flat key-value store for ephemeral UI state. Shared across the entire page. Never persisted.

```typescript
$state.activeTab;
$state.selectedId;
$state.drawerOpen;
```

Any widget can read or write any key. Widgets referencing a `$state` key re-render when it changes.

### $filter

Controls filtering on list data sources.

```
$filter.sales.order.status = 'draft'               // eq
$filter.sales.order.status = ['draft', 'pending']  // in
$filter.sales.order.total__gt = 100                // greater than
$filter.sales.order.name__like = 'acme'            // contains
```

Suffixes: `__gt`, `__gte`, `__lt`, `__lte`, `__like`, `__empty`, `__not_empty`.

### $sort

Controls sort on list data sources. Prefix `-` for descending.

```
$sort.sales.order = '-date,name'
```

### $page

Controls pagination. Value is a page number.

```
$page.sales.order = 2
```

### $route

Read-only. Contains route parameters.

```
$route.id
```

## Triggers and actions

Widgets emit triggers. Actions respond to them.

### Triggers

Events declared by a widget. Wired via the `on` field.

| Widget type    | Triggers                           |
| -------------- | ---------------------------------- |
| Input widgets  | `change`, `focus`, `blur`          |
| Action widgets | `click`                            |
| Table widget   | `rowClick`, `select`, `pageChange` |
| Any widget     | `mount`                            |

### Actions

What happens in response to a trigger.

```typescript
// Set a value
{ type: 'setValue', field: '$state.selectedId', value: '{{id}}' }

// Call a service
{ type: 'service', name: 'sales.submitOrder', onSuccess: { type: 'navigate', path: '/sales/orders' } }

// Sequence multiple actions
{ type: 'sequence', actions: [
  { type: 'validate' },
  { type: 'model.update', data: { status: 'submitted' } },
  { type: 'navigate', path: '/sales/orders' },
] }
```

Full action types: `setValue`, `clearValue`, `setValues`, `service`, `validate`, `model.create`, `model.update`, `model.delete`, `model.fetch`, `model.list`, `navigate`, `focus`, `addRow`, `removeRow`, `duplicateRow`, `sequence`, `conditional`.

## Conditional rendering

The `visible` field controls whether a widget renders.

```json
{ "visible": { "field": "$state.drawerOpen", "operator": "eq", "value": true } }
```

Multiple conditions AND together:

```json
{
  "visible": [
    { "field": "status", "operator": "eq", "value": "draft" },
    { "field": "total", "operator": "gt", "value": 0 }
  ]
}
```

Overlay widgets (drawer, modal) use `visible` for open/close state. No special open/close actions needed. Set `$state.drawerOpen = true` to show, `false` to hide.

## Expressions

Any string containing `{{}}` is an expression. A small sandboxed expression language for computing values.

```
{{qty * rate}}
{{format_currency(sum(items.amount), $parent.currency)}}
{{if(status == 'draft', 'Pending', upper(status))}}
```

Operators: `+`, `-`, `*`, `/`, `%`, `==`, `!=`, `>`, `<`, `>=`, `<=`, `&&`, `||`, `!`.

## Resolution order

When the renderer encounters a widget `type`:

1. App custom widgets (registered via `defineWidget()` in the app)
2. Framework built-in widgets
3. Error at boot

## Next steps

- [Pages](/concepts/pages): how widget trees become routable screens
- [defineWidget reference](/reference/define-widget): registering custom widgets
- [Built-in Widgets](/reference/built-in-widgets): all available widgets
- [Builder API](/reference/widget-builder): chainable shorthand for widget trees
