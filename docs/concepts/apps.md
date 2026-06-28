---
status: stable
since: 0.1.0
last-updated: 2026-06-28
description: App definition, namespacing, dependency declaration, and multi-app composition
---

# Apps

Software mirrors the organizations that build it. A business has departments and each department has its own language and concerns. Apps let you honor those boundaries in code.

Sales logic lives in the sales app. Inventory logic lives in the inventory app. Each app is a self-contained project that groups related models, pages, services, and logic together. A single Rangka instance can run one app or compose multiple apps together.

## Defining an app

Every app needs an `app.ts` file at its root:

```typescript
// app.ts
import { defineApp } from 'rangka';

export default defineApp({
  name: 'inventory',
  label: 'Inventory',
  icon: 'warehouse',
  order: 30,
  navigation: [
    {
      section: 'Items',
      items: [
        { page: 'inventory.items', label: 'Items', icon: 'box' },
        { page: 'inventory.item-groups', label: 'Item Groups', icon: 'folders' },
      ],
    },
    {
      section: 'Transactions',
      items: [
        { page: 'inventory.stock-entries', label: 'Stock Entries', icon: 'arrow-right-left' },
      ],
    },
  ],
});
```

This is enough to get an app showing up in the sidebar with its own navigation sections.

## Configuration

| Field         | Type                              | Default     | Description                                     |
| ------------- | --------------------------------- | ----------- | ----------------------------------------------- |
| `name`        | `string`                          | —           | Unique identifier, used as namespace for models |
| `label`       | `string`                          | —           | Display name in the UI                          |
| `description` | `string`                          | `undefined` | App description shown in navigation             |
| `icon`        | `string`                          | `undefined` | Lucide icon name for the sidebar                |
| `color`       | `string`                          | `undefined` | App color for navigation UI                     |
| `type`        | `'internal' \| 'external'`        | `undefined` | App type                                        |
| `order`       | `number`                          | `0`         | Sidebar position (lower = higher)               |
| `depends`     | `string[]`                        | `undefined` | Apps that must load before this one             |
| `scopes`      | `Record<string, ScopeDefinition>` | `undefined` | Filtering dimensions (see [Scopes](#scopes))    |
| `navigation`  | `NavigationSection[]`             | `undefined` | Sidebar sections and items                      |

## File layout

An app follows conventions. The framework discovers files by their directory:

```
my-app/
├── app.ts                 # Required
├── rangka.config.ts       # Framework config (database, server, external apps)
├── models/
│   ├── customer.ts        # defineModel()
│   └── order.ts           # defineModel()
├── pages/
│   └── orders.ts          # definePage()
├── hooks/
│   └── order.ts           # defineHooks()
├── services/
│   ├── pricing.ts         # defineService()
│   └── submitOrder.ts     # defineService()
├── jobs/
│   └── daily-summary.ts   # defineJob()
├── fixtures/
│   └── seed.ts            # defineFixture()
└── widgets/
    └── PipelineBoard.tsx  # defineWidget()
```

Only `app.ts` is required. Add other directories as you need them.

## Namespacing

A model's full name is `{app}.{model}`. So a model defined in `models/order.ts` inside an app named `sales` becomes `sales.order`. All cross-app references use this qualified name:

```typescript
// In the accounting app, linking to a sales model
fields: {
  sales_order: field.link('sales.order'),
}
```

This naming convention keeps references unambiguous, even as the number of apps grows.

## Dependencies

When your app references models from another app, declare the dependency:

```typescript
defineApp({
  name: 'accounting',
  label: 'Accounting',
  depends: ['sales'],
});
```

This ensures dependent apps load first. Their models, hooks, and services are registered before yours, so references always resolve.

## Multi-app composition

A Rangka instance can run multiple apps. External apps live in the `apps/` directory and are listed in `rangka.config.ts`:

```typescript
// rangka.config.ts
import { defineConfig } from 'rangka';

export default defineConfig({
  apps: ['foundation', 'crm', 'hr'],
  database: { dialect: 'pg', host: 'localhost', database: 'my-erp' },
});
```

```
my-project/
├── rangka.config.ts       # lists external apps
├── app.ts                 # your root app (defineApp)
├── models/                # your custom models
├── apps/
│   ├── foundation/        # cloned prebuilt app
│   │   ├── app.ts
│   │   └── models/
│   ├── crm/               # cloned prebuilt app
│   │   ├── app.ts
│   │   └── models/
│   └── hr/
```

All apps are peers. The root app just happens to live at the project root instead of `apps/`. The `depends` field controls boot order. The config controls what is installed.

Apps without `navigation` defined do not appear in the app selector. This makes the root app invisible in the UI when it exists purely for composition.

## Navigation

Navigation defines the sidebar structure for your app. Each section groups related items:

```typescript
navigation: [
  {
    section: 'Transactions',
    items: [
      { page: 'accounting.journal-entries', label: 'Journal Entries', icon: 'book' },
      { page: 'accounting.ledger', label: 'General Ledger', icon: 'list' },
    ],
  },
],
```

Navigation items are filtered by the user's page permissions at boot time. Sections with no permitted items are hidden entirely.

## Scopes

Scopes are filtering dimensions that automatically restrict queries. The most common example: a multi-company setup where users only see data from their active company.

```typescript
defineApp({
  name: 'core',
  label: 'Core',
  scopes: {
    company: {
      model: 'core.company',
      default: 'user.default_company',
      switchable: true,
    },
  },
});
```

| Field        | Type      | Default | Description                                                     |
| ------------ | --------- | ------- | --------------------------------------------------------------- |
| `model`      | `string`  | —       | Model that provides scope values                                |
| `default`    | `string`  | —       | Dot-path to the user's default value                            |
| `switchable` | `boolean` | `false` | Show a switcher in the sidebar so users can change active scope |

Models opt in with `scope: 'company'` in their definition. Once opted in, all queries are filtered automatically. The user never sees data from a scope they have not selected.

## Prebuilt apps

Prebuilt apps are standalone Rangka apps distributed as git repositories. Each prebuilt app has the same flat structure as any other Rangka app. It can run on its own or be composed into a larger project.

To install a prebuilt app, clone it into your `apps/` directory and add its name to `rangka.config.ts`:

```bash
git clone https://github.com/rangka-dev/rangka-crm apps/crm
```

```typescript
// rangka.config.ts
export default defineConfig({
  apps: ['foundation', 'crm'],
});
```

Each prebuilt app declares its own dependencies. If `crm` depends on `foundation`, and `foundation` is not listed in your config, boot fails with a clear error.

## Splitting large domains

As a domain grows complex, break it into multiple apps that collaborate:

```
apps/
├── hr/                    # Core HR (employees, departments)
├── payroll/               # Payroll processing (depends: ['hr'])
├── attendance/            # Time tracking (depends: ['hr'])
└── recruitment/           # Hiring pipeline (depends: ['hr'])
```

Each has its own navigation, models, and pages. They reference each other's models freely through the dependency system.
