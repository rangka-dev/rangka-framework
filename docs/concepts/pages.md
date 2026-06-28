---
status: stable
since: 0.2.0
last-updated: 2026-06-23
description: Page definition, widget tree, routing, and layout
---

# Pages

A page is a routable screen in your application. You define it as a widget tree. The framework handles routing, data fetching, and rendering.

```typescript
import { definePage, widget, action } from 'rangka';

export default definePage({
  key: 'sales.orders',
  label: 'Sales Orders',
  actions: [
    action.button('New Order', {
      icon: 'plus',
      action: { type: 'navigate', path: '/sales/orders/new' },
    }),
  ],
  widgets: [
    widget.table(
      'sales.order',
      {
        on: { rowClick: { type: 'setValue', field: '$state.selectedId', value: '{{id}}' } },
      },
      [
        widget.column('name', { label: 'Name' }),
        widget.column('customer_name', { label: 'Customer' }),
        widget.column('status', { label: 'Status' }),
      ],
    ),
    widget.drawer(
      {
        width: 'md',
        title: 'Order Detail',
        visible: { field: '$state.selectedId', operator: 'notEmpty' },
      },
      [
        widget.data('sales.order', { id: '$state.selectedId' }, [
          widget.text('name', { style: 'heading' }),
          widget.input('customer_id'),
          widget.input('status'),
          widget.input('total'),
        ]),
      ],
    ),
  ],
});
```

## Configuration

| Field     | Type         | Required | Description                                       |
| --------- | ------------ | -------- | ------------------------------------------------- |
| `key`     | string       | yes      | Unique identifier (`app.name`)                    |
| `label`   | string       | yes      | Display name for nav, breadcrumbs, tab title      |
| `path`    | string       | no       | Custom route path. Auto-generated if omitted.     |
| `layout`  | string       | no       | `'default'` or `'full'`. Defaults to `'default'`. |
| `actions` | Action[]     | no       | Topbar action buttons (shell-level)               |
| `widgets` | WidgetNode[] | yes      | The entire page content as a widget tree          |

## Routing

Pages get routes automatically from their key:

| Key                          | Route                         |
| ---------------------------- | ----------------------------- |
| `sales.orders`               | `/sales/orders`               |
| `accounting.journal-entries` | `/accounting/journal-entries` |

Override with `path` when you need something custom:

```typescript
definePage({
  key: 'sales.order-detail',
  label: 'Order Detail',
  path: '/sales/orders/$id',
  widgets: [...],
});
```

## Actions

Page-level actions render in the topbar. They are shell-managed and independent of the widget tree.

```typescript
import { action } from 'rangka';

actions: [
  action.button('New Order', {
    icon: 'plus',
    action: { type: 'navigate', path: '/sales/orders/new' },
  }),
  action.button('Export', {
    variant: 'secondary',
    action: { type: 'service', name: 'sales.export' },
  }),
  action.menu('More', [
    { label: 'Archive', action: { type: 'service', name: 'sales.archive' } },
    { label: 'Duplicate', action: { type: 'service', name: 'sales.duplicate' } },
  ]),
];
```

Action types: `button`, `menu`, `toggle-group`, `separator`.

## Layout

Layout is handled by widgets in the `widgets` array. There is no page-level layout configuration beyond the `layout` field which controls the shell frame.

### Side by side

Use `split` to divide the page into columns:

```typescript
widgets: [
  widget.split({ sizes: [60, 40] }, [
    widget.table('sales.order', {}, [...]),
    widget.data('sales.order', { id: '$state.selectedId' }, [...]),
  ]),
]
```

### Grid layout

Use `grid` for a dashboard-style layout:

```typescript
widgets: [
  widget.grid({ columns: 3 }, [
    widget.data('sales.order', {}, [...]),
    widget.data('sales.customer', {}, [...]),
    widget.data('sales.product', {}, [...]),
  ]),
]
```

### Sections

Use `section` for collapsible groups:

```typescript
widgets: [
  widget.section({ label: 'General', collapsible: true }, [...]),
  widget.section({ label: 'Line Items', collapsible: true }, [...]),
]
```

## Data fetching

Data fetching is handled by the `data` widget, not the page. Place a `data` widget in the tree to fetch records and provide context to its children.

```typescript
// Single record from route
widget.data('sales.order', { id: '$route.id' }, [...])

// Collection
widget.data('sales.product', {}, [...])

// Nested: related record from parent context
widget.data('sales.order', { id: '$route.id' }, [
  widget.input('customer_id'),
  widget.data('sales.customer', { id: 'customer_id' }, [
    widget.text('company_name'),
  ]),
])
```

## Overlays

Drawers and modals are widgets in the `widgets` array with `visible` conditions. No special page configuration needed.

```typescript
widgets: [
  // Main content
  widget.table('sales.order', {
    on: { rowClick: { type: 'setValue', field: '$state.drawerOpen', value: true } },
  }, [...]),

  // Drawer appears when $state.drawerOpen is true
  widget.drawer({ width: 'md', title: 'Detail', visible: { field: '$state.drawerOpen', operator: 'eq', value: true } }, [...]),
]
```

Close the drawer by setting `$state.drawerOpen` back to false via a button or other trigger.

## Common patterns

### Collection with master-detail

```typescript
import { definePage, widget } from 'rangka';

definePage({
  key: 'sales.orders',
  label: 'Sales Orders',
  widgets: [
    widget.split({ sizes: [60, 40] }, [
      widget.table(
        'sales.order',
        {
          on: { rowClick: { type: 'setValue', field: '$state.selectedId', value: '{{id}}' } },
        },
        [widget.column('name', { label: 'Name' }), widget.column('status', { label: 'Status' })],
      ),
      widget.data('sales.order', { id: '$state.selectedId' }, [
        widget.text('name', { style: 'heading' }),
        widget.badge('status'),
        widget.text(null, { style: 'default', expression: '{{format_currency(total, currency)}}' }),
      ]),
    ]),
  ],
});
```

### Record page with form

```typescript
import { definePage, widget } from 'rangka';

definePage({
  key: 'sales.order-detail',
  label: 'Order Detail',
  path: '/sales/orders/$id',
  widgets: [
    widget.data('sales.order', { id: '$route.id' }, [
      widget.section({ label: 'General' }, [
        widget.grid({ columns: 2 }, [
          widget.input('customer_id'),
          widget.input('order_date'),
          widget.input('status'),
          widget.input('currency'),
        ]),
      ]),
      widget.section({ label: 'Line Items' }, [
        widget.repeat('line_items', [
          widget.input('product_id'),
          widget.input('qty'),
          widget.input('rate'),
        ]),
        widget.button({
          label: 'Add Row',
          icon: 'plus',
          variant: 'ghost',
          on: { click: { type: 'addRow', field: 'line_items' } },
        }),
      ]),
    ]),
  ],
});
```

### Dashboard

```typescript
import { definePage, widget } from 'rangka';

definePage({
  key: 'sales.dashboard',
  label: 'Sales Dashboard',
  widgets: [
    widget.grid({ columns: 4 }, [
      widget.data('sales.order', {}, [
        widget.text(null, { style: 'heading', expression: '{{count(records)}}' }),
        widget.text(null, { style: 'muted', expression: '{{"Total Orders"}}' }),
      ]),
      widget.data('sales.customer', {}, [
        widget.text(null, { style: 'heading', expression: '{{count(records)}}' }),
        widget.text(null, { style: 'muted', expression: '{{"Customers"}}' }),
      ]),
    ]),
  ],
});
```
