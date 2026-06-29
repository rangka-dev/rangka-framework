---
status: stable
since: 0.2.0
last-updated: 2026-06-29
description: Widget tree, categories, bindings, controllers, and the three-layer architecture
---

# Widgets

Everything visible on a page is a widget. A text label, an input field, a data table, a layout column. You compose widgets into trees, and those trees become your screens.

## The widget tree

A page's content is an array of widget nodes. Each node can contain children, forming a recursive tree.

```typescript
import { definePage, widget } from 'rangka';

export default definePage({
  key: 'sales.orders',
  label: 'Sales Orders',
  widgets: [
    widget.table('sales.order', [
      widget.column('name', { label: 'Name' }),
      widget.column('status', { label: 'Status' }),
    ]),
  ],
});
```

The framework walks this tree top-down, resolves each widget type, evaluates conditions, resolves bindings, and renders the result.

## Three-layer architecture

The widget system has three layers, each with a distinct responsibility.

| Layer    | Package          | Responsibility                                        |
| -------- | ---------------- | ----------------------------------------------------- |
| Contract | `@rangka/shared` | WidgetNode trees, WidgetAction union, builder DSL     |
| Client   | `@rangka/client` | Controllers, renderer, state store, action dispatcher |
| UI       | `@rangka/ui`     | Visual components that render DOM                     |

The contract layer defines the data structures. The client layer resolves data, manages state, and dispatches actions. It produces no DOM itself. The UI layer receives fully resolved data via `WidgetProps` and renders the final interface.

This separation means you can swap the UI layer without changing page definitions or business logic.

## WidgetNode

Every widget in the tree is a `WidgetNode`:

```typescript
interface WidgetNode {
  id?: string;
  type: string;
  props?: Record<string, unknown>;
  bind?: WidgetBinding;
  source?: WidgetSource;
  visible?: Condition | Condition[];
  on?: Record<string, WidgetAction | WidgetAction[]>;
  children?: WidgetNode[];
}
```

| Field      | Purpose                                                        |
| ---------- | -------------------------------------------------------------- |
| `type`     | Which registered widget to render                              |
| `props`    | Static configuration (label, variant, size, etc.)              |
| `bind`     | Data binding declaration (connects widget to a field)          |
| `source`   | Data source for data-container widgets (model and optional id) |
| `visible`  | Conditional rendering. Multiple conditions AND together.       |
| `on`       | Trigger-to-action wiring                                       |
| `children` | Child widget nodes                                             |

## Widget categories

Every widget belongs to one category. The category determines how the renderer handles it.

| Category         | Purpose                             | Examples                                                         |
| ---------------- | ----------------------------------- | ---------------------------------------------------------------- |
| `input`          | Accepts user input bound to a field | `input`, `select`, `checkbox`, `datepicker`, `money`             |
| `display`        | Shows data (read-only)              | `text`, `badge`, `icon`, `image`                                 |
| `layout`         | Arranges children spatially         | `group`, `grid`, `section`, `card`, `split`, `stack`             |
| `action`         | Triggers behavior on interaction    | `button`                                                         |
| `data-container` | Controller-backed, manages data     | `data`, `form`, `table`, `repeat`, `datagrid`, `modal`, `drawer` |

Layout widgets pass children through without affecting data context. Data-container widgets have controllers that fetch data, build context, and coordinate state before delegating to the UI layer.

## Data-container controllers

Data-container widgets are the most important category. Each has a controller in the client layer that handles:

- Fetching data from the API
- Building a `WidgetContext` (record, model, mode) for children
- Integrating with the page state store for `$filter`, `$sort`, `$page`
- Coordinating form state (validation, dirty tracking, submit)

The controllers:

| Widget     | Controller responsibility                                   |
| ---------- | ----------------------------------------------------------- |
| `data`     | Fetches a single record or collection by `source`           |
| `form`     | Provides form state, validation, submit/reset via ref       |
| `table`    | Fetches paginated list, reacts to `$filter`/`$sort`/`$page` |
| `repeat`   | Iterates a collection, creates row-level context per record |
| `datagrid` | Inline-editable grid bound to a child table field           |
| `modal`    | Overlay with visibility state                               |
| `drawer`   | Side panel with visibility state                            |

## Data binding

Binding connects a widget to data. The `bind` field declares the connection.

### Field binding

Binds to a field on the nearest record in scope:

```typescript
widget.input('customer_id');
// Produces: { type: 'input', bind: { field: 'customer_id' } }
```

The runtime provides: current value, a setter function, and field metadata (type, label, required, options, readOnly).

### Expression binding

Computed read-only value:

```json
{ "bind": { "expression": "{{qty * rate}}" } }
```

### No binding

Widget renders from props only. Omit `bind`.

## Data sources

The `source` field declares where a data-container widget gets its data:

```typescript
interface WidgetSource {
  model: string;
  id?: string;
}
```

`id` present means single record. `id` absent means collection.

```typescript
// Single record from route param
widget.data('sales.order', { id: '$route.id' }, [...])

// Collection (table fetches a list)
widget.table('sales.order', [...])
```

## Context tree

The runtime maintains a context tree that mirrors the widget tree.

- Layout widgets do not create context. They pass through.
- `data` in record mode creates a scope from its fetched record.
- `data` in collection mode provides records for child `repeat` or `table` widgets.
- `table` creates a row-level context per row.
- `repeat` iterates and creates a row-level context per record.
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

All dynamic behavior is controlled by reactive variables in the page state store.

| Variable                  | Controls              |
| ------------------------- | --------------------- |
| `$state.{key}`            | Ephemeral UI state    |
| `$filter.{model}.{field}` | Which records to show |
| `$sort.{model}`           | Order of records      |
| `$page.{model}`           | Pagination            |

Set a filter variable and the table re-fetches. Change the sort and it re-fetches. No manual refresh.

```typescript
// An input that filters the table as the user types
widget.input('search', {
  on: { change: action.setValue('$filter.sales.order.name__like', '{{value}}') }
})

// The table responds automatically
widget.table('sales.order', [...])
```

## Triggers and actions

Widgets emit triggers. Actions respond to them. The `on` field wires triggers to actions.

| Widget type    | Triggers                           |
| -------------- | ---------------------------------- |
| Input widgets  | `change`, `focus`, `blur`          |
| Action widgets | `click`                            |
| Table widget   | `rowClick`, `select`, `pageChange` |
| Any widget     | `mount`                            |

```typescript
widget.button('Submit', {
  variant: 'primary',
  on: { click: action.service('sales.submitOrder') },
});
```

## Conditional rendering

The `visible` field controls whether a widget renders. It is a live subscription. When the referenced value changes, the widget appears or disappears.

```typescript
widget.drawer({
  width: 'md',
  title: 'Detail',
  visible: { field: '$state.selectedId', operator: 'notEmpty' }
}, [...])
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

## WidgetProps contract

Every widget component receives a single `WidgetProps` object from the renderer:

```typescript
interface WidgetProps {
  props: Record<string, unknown>;
  bind: {
    value: unknown;
    setValue?: (val: unknown) => void;
    meta?: {
      type: string;
      label: string;
      required: boolean;
      options?: unknown[];
      readOnly: boolean;
    };
    error?: string;
    id?: string;
  };
  on: Record<string, (...args: unknown[]) => void>;
  context: {
    record: Record<string, unknown>;
    model: string;
    mode: 'view' | 'edit';
    index?: number;
  };
  childNodes?: WidgetNode[];
  children?: ReactNode;
}
```

The UI layer never fetches data or manages state. It receives resolved values and renders them. This is the boundary between the client layer and the UI layer.

## Expressions

Any string containing `{{}}` is an expression evaluated at render time:

```
{{qty * rate}}
{{format_currency(sum(items.amount), $parent.currency)}}
{{if(status == 'draft', 'Pending', upper(status))}}
```

Operators: `+`, `-`, `*`, `/`, `%`, `==`, `!=`, `>`, `<`, `>=`, `<=`, `&&`, `||`, `!`.

## Widget resolution order

When the renderer encounters a widget `type`:

1. App custom widgets (registered via `defineWidget()`)
2. Framework built-in widgets
3. Error at boot if unresolved

## Builder DSL

The `widget` factory provides named helpers for built-in types:

```typescript
import { widget } from 'rangka';

widget.input('name', { required: true });
widget.table('sales.order', [widget.column('name')]);
widget.card({ title: 'Details' }, [widget.input('name')]);
widget.form('sales.order', { id: '$route.id' }, [widget.input('name')]);
```

Use `widget(type, opts)` for custom widget types:

```typescript
widget('kanban', { props: { groupBy: 'status' }, source: { model: 'sales.order' } });
```
