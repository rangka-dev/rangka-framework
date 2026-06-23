---
status: stable
since: 0.2.0
last-updated: 2026-06-23
description: definePage() API — widget tree, routing config, and builder helpers
---

# definePage

Declares a page. A page is a routable screen whose content is a widget tree.

See [Pages concept](/concepts/pages) for usage patterns. See [Widgets concept](/concepts/widgets) for how the widget tree works.

## Signature

```typescript
import { definePage, widget, action } from 'rangka';

export default definePage({
  key: 'sales.orders',
  label: 'Sales Orders',
  actions: [
    {
      type: 'button',
      label: 'New Order',
      icon: 'plus',
      action: action.navigate('/sales/orders/new'),
    },
  ],
  widgets: [
    widget.card({ title: 'All Orders' }, [
      widget.table('sales.order', { sortable: true }, [
        widget.column('name', { label: 'Name', sortable: true }),
        widget.column('status', { label: 'Status', filterable: true }),
        widget.column('total', { label: 'Total', align: 'right' }),
      ]),
    ]),
  ],
});
```

## PageDefinition

```typescript
interface PageDefinition {
  key: string;
  label: string;
  path?: string;
  layout?: 'default' | 'full';
  actions?: Action[];
  widgets: WidgetNode[];
}
```

### Fields

| Field     | Type         | Default     | Description                                                                                    |
| --------- | ------------ | ----------- | ---------------------------------------------------------------------------------------------- |
| `key`     | string       | —           | Unique identifier. Format: `module.name`.                                                      |
| `label`   | string       | —           | Page title. Displayed in breadcrumbs and tab title.                                            |
| `path`    | string       | auto        | Custom URL path. Auto-generated from key if omitted.                                           |
| `layout`  | enum         | `'default'` | Page layout mode. `default` adds padding. `full` removes all padding for edge-to-edge content. |
| `actions` | Action[]     | —           | Topbar buttons rendered by the shell.                                                          |
| `widgets` | WidgetNode[] | —           | The entire page content as a widget tree.                                                      |

## Layout

| Value     | Description                                                                        |
| --------- | ---------------------------------------------------------------------------------- |
| `default` | Standard page padding (`px-6 py-4`). Used for most pages.                          |
| `full`    | No padding. Content fills edge-to-edge. Used for datagrids and full-bleed widgets. |

Use `layout: 'full'` when the page content is a single widget that should fill the entire viewport. The datagrid widget is the primary use case.

```typescript
definePage({
  key: 'sales.orders',
  label: 'Sales Orders',
  layout: 'full',
  widgets: [
    widget('datagrid', {
      source: { model: 'sales.order' },
      props: { pageSize: 50, editable: true, addRow: true },
    }),
  ],
});
```

## Routing

Pages are automatically routed based on their key:

| Key                          | Generated path                |
| ---------------------------- | ----------------------------- |
| `sales.orders`               | `/sales/orders`               |
| `sales.order-detail`         | `/sales/order-detail`         |
| `accounting.journal-entries` | `/accounting/journal-entries` |

Override with `path` for custom routes:

```typescript
definePage({
  key: 'sales.order-detail',
  label: 'Order Detail',
  path: '/sales/orders/$id',
  widgets: [...],
});
```

## Actions

Topbar actions rendered by the shell. Independent of the widget tree.

```typescript
interface Action {
  type: 'button' | 'menu' | 'toggle-group' | 'separator';
  label?: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  action?: WidgetAction;
  items?: ActionItem[];
}

interface ActionItem {
  label: string;
  action: WidgetAction;
  icon?: string;
}
```

### Action fields

| Field     | Type         | Description                                        |
| --------- | ------------ | -------------------------------------------------- |
| `type`    | enum         | `button`, `menu`, `toggle-group`, `separator`      |
| `label`   | string       | Button or menu label                               |
| `icon`    | string       | Lucide icon identifier                             |
| `variant` | enum         | Button style. Default: `primary`.                  |
| `action`  | WidgetAction | Structured action (same format as widget triggers) |
| `items`   | ActionItem[] | Menu items (for `menu` type)                       |

### Examples

```typescript
import { action } from 'rangka';

// Navigate to a page
{ type: 'button', label: 'New Order', icon: 'plus', action: action.navigate('/sales/orders/new') }

// Call a service
{ type: 'button', label: 'Export', variant: 'secondary', action: action.service('sales.export') }
```

Page actions use the same `WidgetAction` format as widget triggers. See [Actions concept](/concepts/actions) for all available action types. The `action` helper provides typed shortcuts for all built-in actions.

## Widgets

The `widgets` field is an array of `WidgetNode` objects forming a recursive tree. This is the complete page content. Layout, data fetching, overlays, and interactions are all expressed as widgets in the tree.

You can write widget nodes as raw objects or use the `widget` helper for a shorter syntax:

```typescript
// Raw WidgetNode — always works
widgets: [{ type: 'input', bind: { field: 'name' }, props: { required: true } }];

// widget helper — same output, less typing
widgets: [widget.input('name', { required: true })];
```

See [Widget Builder reference](/reference/widget-builder) for the full `widget` and `action` helper API. See [Built-in Widgets reference](/reference/built-in-widgets) for available widget types.

## Validation at boot

The framework validates pages at startup:

- Warns about duplicate page keys across modules.
- Warns about source models that do not exist in the schema registry.
- Warns about bind.field references that do not exist on the source model in scope.

Pages with the deprecated `body` field are auto-migrated to `widgets` with a warning.

## Rendering chain

```
Route match
  → Shell (sidebar, topbar)
    → PageRenderer (looks up PageDefinition by key)
      → WidgetRenderer (recursive, walks widget tree)
        → for each WidgetNode:
          → evaluate visible conditions
          → resolve props expressions
          → resolve binding
          → render component with WidgetProps
          → if container: recurse into children
```

## Boot payload

Pages are included in the boot response sent to the client:

```typescript
interface BootResponse {
  user: BootUser;
  permissions: BootPermissions;
  navigation: NavigationTree[];
  pages: PageDefinition[];
  models: Record<string, ModelMeta>;
  widgets?: WidgetDefinitionMeta[];
}
```
