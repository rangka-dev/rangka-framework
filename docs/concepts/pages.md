---
status: stable
since: 0.2.0
last-updated: 2026-06-15
description: Page definition, widget tree body, routing, and page types
---

# Pages

A page is a routable screen in your application. You define it as a widget tree. The framework handles routing, data fetching, and rendering.

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
        { type: 'column', props: { label: 'Customer' }, bind: { field: 'customer_name' } },
        {
          type: 'column',
          props: { label: 'Status' },
          children: [{ type: 'badge', bind: { field: 'status' } }],
        },
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
          ],
        },
      ],
    },
  ],
});
```

## Configuration

| Field     | Type         | Required | Description                                   |
| --------- | ------------ | -------- | --------------------------------------------- |
| `key`     | string       | yes      | Unique identifier (`module.name`)             |
| `label`   | string       | yes      | Display name for nav, breadcrumbs, tab title  |
| `type`    | PageType     | yes      | Routing context                               |
| `path`    | string       | no       | Custom route path. Auto-generated if omitted. |
| `actions` | Action[]     | no       | Topbar action buttons (shell-level)           |
| `body`    | WidgetNode[] | yes      | The entire page content as a widget tree      |

## Page types

Page type controls routing and whether `$route.id` is available. It does not control data fetching or layout. Those are handled by widgets in the tree.

| Type         | URL pattern          | Meaning                        |
| ------------ | -------------------- | ------------------------------ |
| `collection` | `/:module/:page`     | List of records                |
| `record`     | `/:module/:page/:id` | Single record (`:id` in route) |
| `dashboard`  | `/:module/:page`     | No implicit data context       |

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
  type: 'record',
  path: '/sales/orders/:id',
  body: [...],
});
```

## Actions

Page-level actions render in the topbar. They are shell-managed and independent of the widget tree.

```typescript
actions: [
  { type: 'button', label: 'New Order', icon: 'plus', action: 'navigate:/sales/orders/new' },
  { type: 'button', label: 'Export', variant: 'secondary', action: 'export' },
  {
    type: 'menu',
    label: 'More',
    items: [
      { label: 'Archive', action: 'archive' },
      { label: 'Duplicate', action: 'duplicate' },
    ],
  },
];
```

Action types: `button`, `menu`, `toggle-group`, `separator`.

## Layout

Layout is handled by widgets in the body. There is no page-level layout configuration.

### Side by side

Use `split` to divide the page into columns:

```typescript
body: [
  {
    type: 'split',
    props: { sizes: [60, 40] },
    children: [
      { type: 'table', bind: { model: { name: 'sales.order' } }, children: [...] },
      { type: 'data', source: { model: 'sales.order', id: '$state.selectedId' }, children: [...] },
    ],
  },
]
```

### Grid layout

Use `grid` for a dashboard-style layout:

```typescript
body: [
  {
    type: 'grid',
    props: { columns: 3 },
    children: [
      { type: 'data', source: { model: 'sales.order' }, children: [...] },
      { type: 'data', source: { model: 'sales.customer' }, children: [...] },
      { type: 'data', source: { model: 'sales.product' }, children: [...] },
    ],
  },
]
```

### Sections

Use `section` for collapsible groups:

```typescript
body: [
  { type: 'section', props: { label: 'General', collapsible: true }, children: [...] },
  { type: 'section', props: { label: 'Line Items', collapsible: true }, children: [...] },
]
```

## Data fetching

Data fetching is handled by the `data` widget, not the page. Place a `data` widget in the tree to fetch records and provide context to its children.

```typescript
// Single record from route
{ type: 'data', source: { model: 'sales.order', id: '$route.id' }, children: [...] }

// Collection
{ type: 'data', source: { model: 'sales.product' }, children: [...] }

// Nested: related record from parent context
{ type: 'data', source: { model: 'sales.order', id: '$route.id' }, children: [
  { type: 'input', bind: { field: 'customer_id' } },
  { type: 'data', source: { model: 'sales.customer', id: 'customer_id' }, children: [
    { type: 'text', bind: { field: 'company_name' } },
  ] },
] }
```

## Overlays

Drawers and modals are widgets in the body with `visible` conditions. No special page configuration needed.

```typescript
body: [
  // Main content
  { type: 'table', bind: { model: { name: 'sales.order' } },
    on: { rowClick: { type: 'setValue', field: '$state.drawerOpen', value: true } },
    children: [...] },

  // Drawer appears when $state.drawerOpen is true
  { type: 'drawer', props: { width: 'md', title: 'Detail' },
    visible: { field: '$state.drawerOpen', operator: 'eq', value: true },
    children: [...] },
]
```

Close the drawer by setting `$state.drawerOpen` back to false via a button or other trigger.

## Common patterns

### Collection with master-detail

```typescript
definePage({
  key: 'sales.orders',
  label: 'Sales Orders',
  type: 'collection',
  body: [
    {
      type: 'split',
      props: { sizes: [60, 40] },
      children: [
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
        {
          type: 'data',
          source: { model: 'sales.order', id: '$state.selectedId' },
          children: [
            { type: 'text', bind: { field: 'name' }, props: { style: 'heading' } },
            { type: 'badge', bind: { field: 'status' } },
            { type: 'text', bind: { expression: '{{format_currency(total, currency)}}' } },
          ],
        },
      ],
    },
  ],
});
```

### Record page with form

```typescript
definePage({
  key: 'sales.order-detail',
  label: 'Order Detail',
  type: 'record',
  path: '/sales/orders/:id',
  body: [
    {
      type: 'data',
      source: { model: 'sales.order', id: '$route.id' },
      children: [
        {
          type: 'section',
          props: { label: 'General' },
          children: [
            {
              type: 'grid',
              props: { columns: 2 },
              children: [
                { type: 'input', bind: { field: 'customer_id' } },
                { type: 'input', bind: { field: 'order_date' } },
                { type: 'input', bind: { field: 'status' } },
                { type: 'input', bind: { field: 'currency' } },
              ],
            },
          ],
        },
        {
          type: 'section',
          props: { label: 'Line Items' },
          children: [
            {
              type: 'repeat',
              bind: { field: 'line_items' },
              children: [
                { type: 'input', bind: { field: 'product_id' } },
                { type: 'input', bind: { field: 'qty' } },
                { type: 'input', bind: { field: 'rate' } },
              ],
            },
            {
              type: 'button',
              props: { label: 'Add Row', icon: 'plus', variant: 'ghost' },
              on: { click: { type: 'addRow', field: 'line_items' } },
            },
          ],
        },
      ],
    },
  ],
});
```

### Dashboard

```typescript
definePage({
  key: 'sales.dashboard',
  label: 'Sales Dashboard',
  type: 'dashboard',
  body: [
    {
      type: 'grid',
      props: { columns: 4 },
      children: [
        {
          type: 'data',
          source: { model: 'sales.order' },
          children: [
            {
              type: 'text',
              props: { style: 'heading' },
              bind: { expression: '{{count(records)}}' },
            },
            { type: 'text', props: { style: 'muted' }, bind: { expression: '{{"Total Orders"}}' } },
          ],
        },
        {
          type: 'data',
          source: { model: 'sales.customer' },
          children: [
            {
              type: 'text',
              props: { style: 'heading' },
              bind: { expression: '{{count(records)}}' },
            },
            { type: 'text', props: { style: 'muted' }, bind: { expression: '{{"Customers"}}' } },
          ],
        },
      ],
    },
  ],
});
```
