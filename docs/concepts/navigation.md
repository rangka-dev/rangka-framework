---
status: stable
since: 0.1.0
last-updated: 2026-06-12
description: Sidebar navigation derived from app definitions
---

# Navigation

Navigation builds itself from your app definitions. The sidebar, breadcrumbs, and command palette all derive from the `navigation` arrays you write in `defineApp()`. You do not configure them separately.

This means the navigation is always in sync with what actually exists. If you add a page, it appears. If a user lacks permission, it disappears. The structure reflects reality.

## How it works

Each app declares sections and items:

```typescript
defineApp({
  name: 'accounting',
  label: 'Accounting',
  icon: 'calculator',
  order: 20,
  navigation: [
    {
      section: 'Transactions',
      items: [
        { page: 'accounting.journal-entries', label: 'Journal Entries', icon: 'book' },
        { page: 'accounting.invoices', label: 'Invoices', icon: 'file-text' },
        { page: 'accounting.payments', label: 'Payments', icon: 'credit-card' },
      ],
    },
    {
      section: 'Reports',
      items: [
        { page: 'accounting.trial-balance', label: 'Trial Balance', icon: 'bar-chart' },
        { page: 'accounting.profit-loss', label: 'Profit & Loss', icon: 'trending-up' },
      ],
    },
  ],
});
```

At boot the framework collects all apps, sorts them by `order`, filters items by the user's permissions, removes empty sections, and sends the result to the frontend. The shell renders it directly.

## Structure

```typescript
interface NavigationSection {
  section: string;
  items: NavigationItem[];
}

interface NavigationItem {
  page: string; // Must match a definePage() key
  label: string;
  icon?: string; // Lucide icon name
}
```

## App ordering

The `order` field controls sidebar position. Lower values appear higher:

```typescript
defineApp({ name: 'sales', order: 10 });
defineApp({ name: 'accounting', order: 20 });
defineApp({ name: 'inventory', order: 30 });
```

Apps without `order` sort alphabetically after ordered ones.

## Settings pages

Sections named `_settings` do not appear in the app's main navigation. They are collected into a global Settings area:

```typescript
navigation: [
  { section: 'Transactions', items: [...] },
  {
    section: '_settings',
    items: [
      { page: 'sales.settings', label: 'Sales Settings', icon: 'settings' },
      { page: 'sales.tax-templates', label: 'Tax Templates', icon: 'percent' },
    ],
  },
]
```

This keeps daily-use navigation clean while configuration lives in a dedicated place.

## Cross-app references

You can reference pages from other apps in your navigation:

```typescript
navigation: [
  {
    section: 'Related',
    items: [
      { page: 'accounting.invoices', label: 'Invoices' },
      { page: 'inventory.stock-entries', label: 'Deliveries' },
    ],
  },
];
```

The referenced pages must exist and the user must have permission to view them.

## Permission filtering

The sidebar is permission-aware. If a user's roles do not grant access to a page, that item is excluded from the boot response. Users only see pages they can actually visit.

A Sales User might see three items. A Sales Manager sees six. An Admin sees everything. Same definition, different visibility.

## Breadcrumbs

Auto-generated from the route:

```
Home > Sales > Sales Orders
Home > Sales > Sales Orders > ORD-001
```

For `record` type pages the breadcrumb includes the parent collection and the record title.

## Command palette

All navigation items are indexed for Cmd+K search automatically. Users can search by label, app name, or page key.
