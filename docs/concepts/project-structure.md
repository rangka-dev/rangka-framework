---
status: stable
since: 0.1.0
last-updated: 2026-06-28
description: File and folder conventions, naming rules, and auto-discovery
---

# Project structure

A Rangka project is a Node.js application with an app definition. You install the framework, define your app, and run. There are no boilerplate generators and no scaffolding commands to memorize.

The structure is intentionally predictable. Once you understand the conventions, you can navigate any Rangka project without surprises.

## Single app (most common)

```
my-app/
├── package.json
├── rangka.config.ts       # Database, server, runtime settings
├── app.ts                 # defineApp() (required)
├── tsconfig.json
├── models/
│   ├── customer.ts        # defineModel()
│   └── order.ts           # defineModel()
├── pages/
│   └── orders.ts          # definePage()
├── hooks/
│   └── order.ts           # defineHooks()
├── services/
│   └── pricing.ts         # defineService()
├── jobs/
│   └── send-confirmation.ts # defineJob()
├── fixtures/
│   └── seed.ts            # defineFixture()
└── roles.ts               # defineRoles()
```

## Multi-app composition

When running multiple apps together, external apps live in `apps/`:

```
my-erp/
├── package.json
├── rangka.config.ts       # apps: ['foundation', 'crm', 'hr']
├── app.ts                 # defineApp({ name: 'my-erp', label: 'My ERP' })
├── models/                # your own models (optional)
├── apps/
│   ├── foundation/        # cloned prebuilt app
│   │   ├── app.ts
│   │   └── models/
│   ├── crm/
│   │   ├── app.ts
│   │   └── models/
│   └── hr/
```

## rangka.config.ts

```typescript
import { defineConfig } from 'rangka';

export default defineConfig({
  apps: ['foundation', 'crm'], // external apps in apps/ directory
  database: {
    dialect: 'pg',
    host: 'localhost',
    database: 'my-erp',
  },
  server: {
    port: 3000,
  },
});
```

The `apps` field lists external apps by name. The framework resolves each from `apps/<name>/`. Omit `apps` when running a single app with no external dependencies.

## App layout

Every app (root or external) follows the same flat structure:

```
├── app.ts                 # defineApp() (required)
├── models/
│   ├── customer.ts        # defineModel()
│   ├── order.ts           # defineModel()
│   └── order_item.ts      # defineModel()
├── pages/
│   ├── customers.ts       # definePage()
│   └── orders.ts          # definePage()
├── hooks/
│   └── order.ts           # defineHooks()
├── services/
│   ├── pricing.ts         # defineService()
│   └── submitOrder.ts     # defineService()
├── jobs/
│   └── send-confirmation.ts # defineJob()
├── fixtures/
│   └── seed.ts            # defineFixture()
├── roles.ts               # defineRoles()
├── extensions/
│   └── customer.ts        # defineExtension()
└── widgets/
    └── PipelineBoard.tsx  # defineWidget()
```

Only `app.ts` is required. Add directories as you need them.

## Discovery

The framework loads files based on their parent folder:

| Directory     | Expected export     | How it's identified            |
| ------------- | ------------------- | ------------------------------ |
| `models/`     | `defineModel()`     | Qualified name: `{app}.{name}` |
| `pages/`      | `definePage()`      | Page key from config           |
| `hooks/`      | `defineHooks()`     | Model from first argument      |
| `services/`   | `defineService()`   | Service name from config       |
| `jobs/`       | `defineJob()`       | Job name from config           |
| `fixtures/`   | `defineFixture()`   | Target model from config       |
| `extensions/` | `defineExtension()` | Target model from first arg    |
| `widgets/`    | `defineWidget()`    | Widget name from config        |
| `roles.ts`    | `defineRoles()`     | App root scan                  |

Each file must have a default export with the corresponding `define*()` call. One file, one definition.

## Naming conventions

**Filenames:**

- `snake_case` for models: `order_item.ts`, `stock_entry.ts`
- `kebab-case` for pages and jobs: `daily-summary.ts`
- `PascalCase` for custom widgets: `PipelineBoard.tsx`

**Qualified names:**

```
App:    defineApp({ name: 'sales' })
Model:  defineModel({ name: 'order' })
Result: sales.order         (qualified name)
        sales__order        (database table)
        /api/sales/order    (API endpoint)
```

**Services and jobs** follow `{app}.{purpose}`:

```typescript
defineService({ name: 'sales.pricing' });
defineService({ name: 'sales.submitOrder' });
defineJob('sales.send-confirmation', { ... });
```

## Multiple hooks per model

You can split hooks across files when they serve different purposes:

```
hooks/
├── order.ts               # Validation and data enrichment
└── order-notifications.ts # Notification side effects
```

Both export `defineHooks('sales.order', {...})`. Their hooks merge and execute in discovery order.

## Extending other apps

An app can add fields and hooks to models from another app using the `extensions/` directory:

```
my-app/
├── app.ts                 # depends: ['sales']
├── extensions/
│   └── customer.ts        # defineExtension('sales.customer', { fields, hooks })
└── pages/
    └── rewards.ts
```

Extensions merge into the target model's schema without modifying the source app.
