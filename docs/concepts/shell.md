---
status: stable
since: 0.2.0
last-updated: 2026-06-15
description: 'Shell layout: sidebar, topbar, breadcrumbs, and rendering flow'
---

# Shell

The shell is the outermost container of the application. It provides the frame around every screen: the sidebar, topbar, breadcrumbs, and command palette. Your pages fill the frame with widget trees. The frame itself is consistent and managed for you.

## What the shell manages

| Concern         | Description                                            |
| --------------- | ------------------------------------------------------ |
| Auth            | Session management, login gate                         |
| Permissions     | What the user can access (filtered at boot)            |
| Navigation      | Sidebar built from module definitions                  |
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
│ │          │              (page body)                     │ │
│ │          │                                             │ │
│ └──────────┴──────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

The content area renders the matched page's `body` widget tree directly via the `WidgetRenderer`.

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

Action string prefixes:

| Prefix           | Behavior                                                  |
| ---------------- | --------------------------------------------------------- |
| `navigate:/path` | Navigate to a route                                       |
| (no prefix)      | Dispatches as a `rangka:action` event for custom handling |

## Rendering flow

```
Route match
  → Shell renders sidebar + topbar
    → PageRenderer looks up PageDefinition by route
      → WidgetRenderer walks the page body tree recursively
```

The shell is the boundary between framework-managed chrome (sidebar, topbar, breadcrumbs) and application-defined content (the widget tree). Everything inside the content area is your page definition.

## Sidebar

Built from module navigation definitions. See [Navigation](/concepts/navigation) for how it is configured.

The sidebar shows:

- Module groups ordered by `order` field
- Navigation sections and items within each module
- Permission-filtered items (users only see what they can access)
- Active state based on current route

## Breadcrumbs

Auto-generated from the route:

```
Home > Sales > Sales Orders
Home > Sales > Sales Orders > ORD-001
```

For `record` type pages the breadcrumb includes the parent collection and the record title.

## Command palette

All navigation items are indexed for Cmd+K search. Users search by label, module name, or page key.
