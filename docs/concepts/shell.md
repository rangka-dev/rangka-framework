---
status: stable
since: 0.2.0
last-updated: 2026-06-29
description: 'Shell layout: sidebar, topbar, breadcrumbs, and rendering flow'
---

# Shell

The shell is the outermost frame of the application. It wraps every screen with a sidebar, topbar, breadcrumbs, and command palette. Your pages fill the content area with widget trees. The shell itself stays consistent across all screens.

## What the shell manages

| Concern         | Description                                            |
| --------------- | ------------------------------------------------------ |
| Auth            | Session management, login gate                         |
| Permissions     | What the user can access (filtered at boot)            |
| Navigation      | Sidebar built from app definitions                     |
| Breadcrumbs     | Auto-derived from route and page label                 |
| Command palette | Cmd+K search across all pages                          |
| Topbar          | Breadcrumbs left, page actions right                   |
| Page rendering  | Routes to the correct page and renders its widget tree |

The shell does not manage layout, data fetching, overlays, or widget state. Those belong to the widget tree.

## Structure

```
┌─────────────────────────────────────────────────────────────┐
│ ┌──────────┬──────────────────────────────────────────────┐ │
│ │          │ Topbar (breadcrumbs + actions)               │ │
│ │          ├──────────────────────────────────────────────┤ │
│ │ Sidebar  │                                             │ │
│ │          │              Widget tree                     │ │
│ │          │              (page content)                  │ │
│ │          │                                             │ │
│ └──────────┴──────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

The content area renders the matched page's `widgets` tree via the `WidgetRenderer`.

## Topbar actions

Actions are declared per page in `definePage()`:

```typescript
actions: [
  {
    type: 'button',
    label: 'Export',
    variant: 'secondary',
    action: { type: 'service', name: 'sales.export' },
  },
  {
    type: 'button',
    label: 'New Order',
    icon: 'plus',
    action: { type: 'navigate', path: '/sales/orders/new' },
  },
  {
    type: 'menu',
    label: 'More',
    items: [
      { label: 'Archive', action: { type: 'service', name: 'sales.archive' } },
      { label: 'Duplicate', action: { type: 'service', name: 'sales.duplicate' } },
    ],
  },
];
```

Action types: `button`, `menu`, `toggle-group`, `separator`.

## Rendering flow

```
Route match
  → Shell renders sidebar + topbar
    → PageRenderer looks up PageDefinition by route
      → WidgetRenderer walks the widgets tree recursively
```

The shell is the boundary between framework-managed chrome and application-defined content. Sidebar, topbar, and breadcrumbs are framework territory. Everything inside the content area is your page definition.

## Sidebar

Built from app navigation definitions. See [Navigation](/concepts/navigation) for configuration details.

The sidebar shows:

- App groups ordered by `order` field
- Navigation sections and items within each app
- Permission-filtered items (users only see what they can access)
- Active state based on current route

## Breadcrumbs

Auto-generated from the route:

```
Home > Sales > Sales Orders
Home > Sales > Sales Orders > ORD-001
```

Record pages include the parent collection and the record title in the breadcrumb.

## Command palette

All navigation items are indexed for Cmd+K search. Users search by label, app name, or page key.
