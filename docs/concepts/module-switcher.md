---
status: draft
since: 0.1.0
last-updated: 2026-06-13
description: Module switcher UI for navigating between app modules
---

# Module Switcher & Navigation

> **Planned** — not yet implemented.

This document captures the concept for module-scoped navigation. The existing `definePages` API and page registration behavior remain unchanged — this is purely a shell-level presentation concern.

## Problem

An app with 20+ modules where each module has 10+ pages means 200+ sidebar items rendered at once. The sidebar becomes unusable. Users cannot find what they need without scrolling through unrelated pages from other modules.

## Solution

Introduce two complementary navigation mechanisms:

1. **Module Selector Page** — a full-screen card grid shown on boot for deliberate module selection
2. **Module Switcher (Sidebar)** — a compact module list in the sidebar for quick switching

Once a module is active, the sidebar only renders that module's navigation groups. No API changes — `definePages`, routing, and permissions all work as before.

## Module Selector Page

When the app boots (or when no module is active), the shell renders a full-screen page displaying all available modules as a grid of cards. This is the user's entry point into the application.

Each module card displays:

- Icon
- Label
- Description (optional)

Cards are filtered by the current user's roles — only modules the user has at least one accessible page in are shown.

Clicking a card sets that module as active and transitions to the standard shell layout with scoped sidebar navigation.

## Module Switcher (Sidebar)

Once inside a module, the sidebar includes a module switcher for quick access to other modules without returning to the full-screen selector page.

The switcher shows:

- The currently active module (highlighted)
- Other available modules for quick switching

Clicking a different module in the switcher updates the active module and re-renders the sidebar with that module's navigation groups.

## Sidebar Scoping

When a module is active, the sidebar renders only that module's navigation groups as defined in `definePages`. The existing grouped structure remains the same — the only difference is that groups from other modules are hidden.

```
┌─────────────────────────────────────────┐
│  Sidebar                                │
│ ┌─────────────────────────────────────┐ │
│ │  Module Switcher                    │ │
│ │  [Sales] [Inventory] [HR] ...       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│  Orders                                 │
│    • Orders                             │
│    • Quotations                         │
│    • Invoices                           │
│                                         │
│  Master Data                            │
│    • Customers                          │
│    • Products                           │
│    • Price Lists                        │
│                                         │
│  Reports                                │
│    • Pipeline                           │
│    • Revenue Report                     │
│                                         │
└─────────────────────────────────────────┘
```

## Navigation Flow

```
App boots
  → full-screen module selector page (card grid)
  → user clicks a module card
  → shell transitions to standard layout
  → sidebar shows module switcher + active module's navigation
  → user navigates pages within the module via sidebar
  → user switches module via sidebar switcher (quick)
    OR returns to selector page (deliberate)
```

## Role Filtering

Navigation is filtered at two levels using existing permission mechanisms:

1. **Module level** — the selector page and sidebar switcher only show modules the user has at least one accessible page in
2. **Page level** — within the active module, pages the user cannot access are hidden from the sidebar

No changes to how permissions are defined or evaluated.
