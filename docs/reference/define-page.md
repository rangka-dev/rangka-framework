---
status: stable
since: 0.2.0
last-updated: 2026-06-15
description: definePage() API — page types, widget tree, and routing config
---

# definePage

Declares a page. A page is a routable screen whose content is a widget tree.

See [Pages concept](/concepts/pages) for usage patterns. See [Widgets concept](/concepts/widgets) for how the widget tree works.

## Signature

```typescript
import { definePage } from 'rangka';

export default definePage({
  key: 'sales.orders',
  label: 'Sales Orders',
  type: 'collection',
  actions: [
    { type: 'button', label: 'New Order', icon: 'plus', action: 'navigate:/sales/orders/new' },
  ],
  body: [
    {
      type: 'table',
      bind: { model: { name: 'sales.order' } },
      on: { rowClick: { type: 'setValue', field: '$state.selectedId', value: '{{id}}' } },
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

## PageDefinition

```typescript
interface PageDefinition {
  key: string;
  label: string;
  type: 'collection' | 'record' | 'dashboard';
  path?: string;
  actions?: Action[];
  body: WidgetNode[];
}
```

### Fields

| Field     | Type         | Default | Description                                                     |
| --------- | ------------ | ------- | --------------------------------------------------------------- |
| `key`     | string       | —       | Unique identifier. Format: `module.name`.                       |
| `label`   | string       | —       | Page title. Displayed in breadcrumbs and tab title.             |
| `type`    | enum         | —       | Semantic hint for the client renderer. Does not affect routing. |
| `path`    | string       | auto    | Custom URL path. Auto-generated from key if omitted.            |
| `actions` | Action[]     | —       | Topbar buttons rendered by the shell.                           |
| `body`    | WidgetNode[] | —       | The entire page content as a widget tree.                       |

## Page types

| Type         | Description                                           |
| ------------ | ----------------------------------------------------- |
| `collection` | List of records. Client renders list-oriented layout. |
| `record`     | Single record. Client renders detail-oriented layout. |
| `dashboard`  | No implicit data context. Free-form widget layout.    |

The `type` field is a semantic hint for the client renderer. It does not affect URL generation or routing. A `record` page does not automatically get `/:id` in its route. You must specify that via `path` if needed.

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
  type: 'record',
  path: '/sales/orders/:id',
  body: [...],
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
  action?: string;
  items?: ActionItem[];
}

interface ActionItem {
  label: string;
  action: string;
  icon?: string;
}
```

### Action fields

| Field     | Type         | Description                                   |
| --------- | ------------ | --------------------------------------------- |
| `type`    | enum         | `button`, `menu`, `toggle-group`, `separator` |
| `label`   | string       | Button or menu label                          |
| `icon`    | string       | Lucide icon identifier                        |
| `variant` | enum         | Button style. Default: `primary`.             |
| `action`  | string       | Action string (see below)                     |
| `items`   | ActionItem[] | Menu items (for `menu` type)                  |

### Action strings

| Prefix           | Behavior                              |
| ---------------- | ------------------------------------- |
| `navigate:/path` | Navigate to a route                   |
| (no prefix)      | Dispatches as a `rangka:action` event |

## Body

The `body` field is an array of `WidgetNode` objects forming a recursive tree. This is the complete page content. Layout, data fetching, overlays, and interactions are all expressed as widgets in the tree.

See [Widgets concept](/concepts/widgets) for the `WidgetNode` shape and [Built-in Widgets reference](/reference/built-in-widgets) for available widget types.

## Validation at boot

Currently the framework warns about duplicate page keys and invalid source model references at startup.

> **Planned** — not yet implemented. Full widget schema validation at boot is planned. This will include checking widget types against the registry, validating props against widget schemas, enforcing container rules, and verifying binding modes.

## Rendering chain

```
Route match
  → Shell (sidebar, topbar)
    → PageRenderer (looks up PageDefinition by key)
      → WidgetRenderer (recursive, walks body tree)
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
