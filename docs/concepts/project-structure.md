---
status: stable
since: 0.1.0
last-updated: 2026-06-12
description: File and folder conventions, naming rules, and auto-discovery
---

# Project Structure

A Rangka project is a Node.js application with modules. You install the framework, create modules, and run. There are no boilerplate generators and no scaffolding commands to memorize.

The structure is intentionally predictable. Once you understand the conventions, you can navigate any Rangka project without surprises.

## Top-level layout

```
my-erp/
├── package.json
├── rangka.config.ts       # Database, server, runtime settings
├── tsconfig.json
└── modules/
    ├── core/              # Users, companies, currencies
    ├── sales/             # Customers, orders, invoices
    ├── inventory/         # Items, warehouses, stock
    └── accounting/        # Journal entries, ledgers
```

## rangka.config.ts

```typescript
import { defineConfig } from 'rangka';

export default defineConfig({
  database: {
    dialect: 'pg',
    connectionString: process.env.DATABASE_URL,
  },
  server: {
    port: 3000,
  },
});
```

No module registration needed. The framework discovers everything under `modules/` automatically.

## Module layout

Each module is a folder with a `module.ts` at its root:

```
modules/sales/
├── module.ts              # defineModule() (required)
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
└── widgets/
    └── PipelineBoard.tsx  # defineWidget()
```

Only `module.ts` is required. Add directories as you need them.

## Discovery

The framework loads files based on their parent folder:

| Directory   | Expected export   | How it's identified               |
| ----------- | ----------------- | --------------------------------- |
| `models/`   | `defineModel()`   | Qualified name: `{module}.{name}` |
| `pages/`    | `definePage()`    | Page key from config              |
| `hooks/`    | `defineHooks()`   | Model from first argument         |
| `services/` | `defineService()` | Service name from config          |
| `jobs/`     | `defineJob()`     | Job name from config              |
| `fixtures/` | `defineFixture()` | Target model from config          |
| `widgets/`  | `defineWidget()`  | Widget name from config           |
| `roles.ts`  | `defineRoles()`   | Module root scan                  |

Each file must have a default export with the corresponding `define*()` call. One file, one definition.

## Naming conventions

**Filenames:**

- `snake_case` for models: `order_item.ts`, `stock_entry.ts`
- `kebab-case` for pages and jobs: `daily-summary.ts`
- `PascalCase` for custom views: `SalesDashboard.tsx`

**Qualified names:**

```
Module: modules/sales/
Model:  defineModel({ name: 'order' })
Result: sales.order         (qualified name)
        sales__order        (database table)
        /api/sales/order    (API endpoint)
```

**Services and jobs** follow `{module}.{purpose}`:

```typescript
defineService({ name: 'sales.pricing' });
defineService({ name: 'sales.submitOrder' });
defineJob({ name: 'sales.send-confirmation' });
```

## Multiple hooks per model

You can split hooks across files when they serve different purposes:

```
hooks/
├── order.ts               # Validation and data enrichment
└── order-notifications.ts # Notification side effects
```

Both export `defineHooks('sales.order', {...})`. Their hooks merge and execute in discovery order.

## Third-party modules

Modules can be npm packages:

```bash
npm install @rangka/accounting
```

A package with `"rangka": { "module": true }` in its `package.json` is discovered from `node_modules` at boot and merged alongside your local modules. No extra configuration.

## Extending other modules

A module can add fields and hooks to models from another module:

```
modules/loyalty/
├── module.ts              # depends: ['sales']
├── extensions/
│   └── customer.ts        # defineExtension('sales.customer', { fields, hooks })
└── pages/
    └── rewards.ts
```

Extensions merge into the target model's schema without modifying the source.
