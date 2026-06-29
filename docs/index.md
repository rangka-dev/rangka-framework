---
status: stable
since: 0.1.0
last-updated: 2026-06-29
description: What Rangka is, who it's for, and how to get started
---

# Rangka

The TypeScript framework for business applications. Define models, get everything else.

```typescript
import { defineModel, field } from 'rangka';

export default defineModel({
  name: 'order',
  label: 'Sales Order',
  traits: ['timestamped'],
  fields: {
    customer: field.link('sales.customer', { required: true }),
    order_date: field.date({ required: true, default: 'today' }),
    items: field.children('sales.order_item', { foreignKey: 'order_id' }),
    total: field.decimal({ precision: 18, scale: 2, readOnly: true }),
    status: field.enum(['Draft', 'Submitted', 'Cancelled'], { default: 'Draft' }),
  },
});
```

From this one file you get: a database table, REST API with filtering and pagination, a form with linked record pickers and date inputs, a list view with sortable columns, and permission gates. You described what exists. The framework handles the rest.

## How it works

Rangka is metadata-driven. You write declarations. Models, pages, actions, permissions. The framework interprets them into a running application at runtime.

This is not code generation. There is no scaffold to maintain. Add a field to a model and the form gains an input, the API accepts the new value, and the database gets a column. One change, everything updates.

## Who it's for

Internal business applications. ERPs, admin panels, operational tools. Software where 80% of screens are lists, forms, and data operations. You write the remaining 20% of custom logic. Rangka handles the rest.

## Quick start

```bash
pnpm create rangka my-erp
cd my-erp
pnpm install
pnpm start
```

Open the browser. You have a working application shell with navigation, a starter model, and a page ready to build on.

## Project structure

```
my-erp/
├── package.json
├── rangka.config.ts
└── apps/
    ├── core/              # Users, companies, settings
    ├── sales/             # Customers, orders, invoices
    ├── inventory/         # Items, warehouses, stock
    └── accounting/        # Journal entries, ledgers
```

Each app is one business domain. Apps declare dependencies on each other.

## Next steps

- [Your First App](/guides/your-first-app) — build a working app in 15 minutes
- [How It Works](/concepts/how-it-works) — the lifecycle from definition to running app
- [Models](/concepts/models) — the core building block
- [Widgets](/concepts/widgets) — the universal UI building block
- [Pages](/concepts/pages) — composing widgets into screens
