---
status: stable
since: 0.1.0
last-updated: 2026-06-29
description: defineApp() API with parameters, options, and navigation
---

# defineApp

Declares an app. Apps are the top-level organizational unit in a Rangka project. They group models, pages, and navigation together under a namespace.

See [Apps concept](../concepts/apps.md) for usage patterns.

## Signature

```typescript
import { defineApp } from 'rangka';

export default defineApp({
  name: 'accounting',
  label: 'Accounting',
  icon: 'calculator',
  order: 20,
  depends: ['foundation'],
  scopes: {
    company: {
      model: 'core.company',
      default: 'user.default_company',
      switchable: true,
    },
  },
  navigation: [
    {
      section: 'Transactions',
      items: [
        { page: 'accounting.journal-entries', label: 'Journal Entries', icon: 'book' },
        { page: 'accounting.ledger', label: 'General Ledger', icon: 'list' },
      ],
    },
  ],
});
```

## AppConfig

| Field         | Type                             | Default     | Description                                                                   |
| ------------- | -------------------------------- | ----------- | ----------------------------------------------------------------------------- |
| `name`        | string                           |             | **Required.** Unique identifier. Used as namespace prefix for models.         |
| `label`       | string                           |             | **Required.** Display name shown in the sidebar and breadcrumbs.              |
| `description` | string                           | `undefined` | App description shown in the app selector.                                    |
| `icon`        | string                           | `undefined` | Lucide icon name for the sidebar.                                             |
| `color`       | string                           | `undefined` | App color for the app selector UI.                                            |
| `type`        | `'internal' \| 'external'`       | `undefined` | App type.                                                                     |
| `order`       | number                           | `0`         | Sidebar sort order. Lower numbers appear first.                               |
| `depends`     | string[]                         | `undefined` | Other apps this app depends on. Ensures dependencies load first.              |
| `scopes`      | Record\<string, ScopeDefinition> | `undefined` | Scopes this app provides. Renders a switcher for each switchable scope.       |
| `navigation`  | NavigationSection[]              | `undefined` | Sidebar navigation structure. Apps without navigation hide from the selector. |

## NavigationSection

| Field     | Type             | Description                               |
| --------- | ---------------- | ----------------------------------------- |
| `section` | string           | Section heading displayed in the sidebar. |
| `items`   | NavigationItem[] | Ordered list of navigation items.         |

## NavigationItem

| Field   | Type   | Default     | Description                                  |
| ------- | ------ | ----------- | -------------------------------------------- |
| `page`  | string |             | **Required.** Page key in `app.page` format. |
| `label` | string |             | **Required.** Display text in the sidebar.   |
| `icon`  | string | `undefined` | Lucide icon name for this navigation item.   |

## ScopeDefinition

| Field        | Type    | Default | Description                                                     |
| ------------ | ------- | ------- | --------------------------------------------------------------- |
| `model`      | string  |         | **Required.** Qualified model name that provides scope values.  |
| `default`    | string  |         | **Required.** Dot-path to the user's default scope value.       |
| `switchable` | boolean | `false` | If true, the framework renders a scope switcher in the sidebar. |

## Directory convention

```
my-app/
├── app.ts          # defineApp()
├── models/
├── pages/
├── hooks/
├── services/
├── jobs/
├── fixtures/
└── roles.ts
```

## Navigation behavior

- Items are filtered by the user's page permissions at boot time.
- Sections with no permitted items are hidden entirely.
- Cross-app page references use `app.page` format (e.g., `'sales.orders'`).
- Apps without `navigation` do not appear in the app selector but still contribute models and services.

## Reserved names

- `core` is reserved for the built-in framework app.
- Names starting with `rangka` are reserved for official prebuilt apps.
