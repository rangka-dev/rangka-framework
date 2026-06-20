---
status: stable
since: 0.1.0
last-updated: 2026-06-11
description: defineModule() API — parameters, options, and return value
---

# defineModule

Declares a module — the top-level organizational unit in a Rangka app. Modules group models, pages, and navigation together under a namespace.

See [Modules concept](../concepts/modules.md) for usage patterns.

## Signature

```typescript
import { defineModule } from 'rangka';

export default defineModule({
  name: 'accounting',
  label: 'Accounting',
  icon: 'calculator',
  order: 20,
  depends: ['core'],
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
    {
      section: '_settings',
      items: [
        { page: 'accounting.chart-of-accounts', label: 'Chart of Accounts', icon: 'sitemap' },
      ],
    },
  ],
});
```

## ModuleConfig

```typescript
interface ModuleConfig {
  name: string;
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  type?: 'internal' | 'external';
  order?: number;
  depends?: string[];
  scopes?: Record<string, ScopeDefinition>;
  navigation?: NavigationSection[];
}
```

### Fields

| Field         | Type                              | Default     | Description                                                                                                       |
| ------------- | --------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------- |
| `name`        | `string`                          | —           | **Required.** Unique identifier. Used as namespace prefix for models (`module.model`).                            |
| `label`       | `string`                          | —           | **Required.** Display name shown in the sidebar and breadcrumbs.                                                  |
| `description` | `string`                          | `undefined` | Module description shown in navigation.                                                                           |
| `icon`        | `string`                          | `undefined` | Lucide icon name for the module in the sidebar.                                                                   |
| `color`       | `string`                          | `undefined` | Module color for navigation UI.                                                                                   |
| `type`        | `'internal' \| 'external'`        | `undefined` | Module type.                                                                                                      |
| `order`       | `number`                          | `0`         | Sidebar sort order. Lower numbers appear first. Modules without `order` default to `0`.                           |
| `depends`     | `string[]`                        | `undefined` | Other modules this module depends on. Ensures dependencies load first.                                            |
| `scopes`      | `Record<string, ScopeDefinition>` | `undefined` | Available scopes this module provides. The framework renders a switcher in the sidebar for each switchable scope. |
| `navigation`  | `NavigationSection[]`             | `undefined` | Sidebar navigation structure. If omitted, the module's pages do not appear in the sidebar.                        |

## NavigationSection

```typescript
interface NavigationSection {
  section: string;
  items: NavigationItem[];
}
```

| Field     | Type               | Description                                                                     |
| --------- | ------------------ | ------------------------------------------------------------------------------- |
| `section` | `string`           | Section heading. Use `_settings` prefix to group items under the Settings page. |
| `items`   | `NavigationItem[]` | Ordered list of navigation items in this section.                               |

## NavigationItem

```typescript
interface NavigationItem {
  page: string;
  label: string;
  icon?: string;
}
```

| Field   | Type     | Default     | Description                                                                                                                   |
| ------- | -------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `page`  | `string` | —           | **Required.** Page key — qualified format `{module}.{page}` (e.g., `'sales.orders'`). Can reference pages from other modules. |
| `label` | `string` | —           | **Required.** Display text in the sidebar.                                                                                    |
| `icon`  | `string` | `undefined` | Lucide icon name for this navigation item.                                                                                    |

## ScopeDefinition

```typescript
interface ScopeDefinition {
  model: string;
  default: string;
  switchable?: boolean;
}
```

| Field        | Type      | Default | Description                                                                                                                                                                 |
| ------------ | --------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `model`      | `string`  | —       | **Required.** Qualified model name that provides scope values (e.g., `'core.company'`). Any model can be a scope — no special declaration needed on the scope model itself. |
| `default`    | `string`  | —       | **Required.** Dot-path to the user's default scope value (e.g., `'user.default_company'`).                                                                                  |
| `switchable` | `boolean` | `false` | If `true`, the framework renders a scope switcher in the sidebar so users can change their active scope.                                                                    |

## Directory Convention

```
modules/
└── accounting/
    ├── module.ts       # defineModule()
    ├── models/
    ├── pages/
    ├── hooks/
    ├── services/
    ├── jobs/
    └── fixtures/
```

## Navigation Behavior

- Items are filtered by the user's page permissions at boot time
- Sections with no permitted items are hidden entirely
- Cross-module page references use the `module.page` format

> **Planned** — not yet implemented.

- The `_settings` prefix places items under a dedicated Settings area
- All navigation items are indexed for the Cmd+K command palette
