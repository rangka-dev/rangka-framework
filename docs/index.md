---
status: stable
since: 0.1.0
last-updated: 2026-06-21
description: What Rangka is, who it's for, and how to get started
---

# Rangka

Most frameworks ask you to build things piece by piece. Write the migration, the model, the controller, the routes, the serializer, the list component, the form component, the sidebar config. Ten files to get one entity working.

Rangka asks a different question: what if you just described what you want?

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

From this single file, Rangka gives you a database table, REST API with filtering and pagination, a form with a customer picker and date input, a list view with sortable columns, and permission gates. You didn't build any of that. You described what exists, and the framework figured out the rest.

## The idea

Rangka is a metadata-driven framework. You write declarations (models, pages, actions, permissions) and the framework interprets them into a running application. The same model definition drives your database, your API, your UI, and your access control. Change it once, everything updates together.

This isn't code generation. There's no scaffold to maintain. The framework reads your definitions at runtime and renders accordingly. Add a field to a model, and the form gains an input, the API accepts the new value, and the database gets a column. No glue code.

## Who it's for

Rangka is for building internal business applications. ERPs, admin panels, operational tools. The kind of software where 80% of screens are lists, forms, and data operations, and the remaining 20% is genuinely custom logic. You write that 20%. Rangka handles the rest.

## Quick start

```bash
pnpm create rangka my-erp
cd my-erp
pnpm install
pnpm start
```

This scaffolds a project with a `rangka.config.ts`, a starter module, a model, and a page. Open the browser and you have a working application shell with navigation and a module ready to build on.

You can also use `npm create rangka` or `yarn create rangka`. The scaffolder detects your package manager automatically.

## What a typical project looks like

```
my-erp/
├── package.json
├── rangka.config.ts
└── modules/
    ├── core/              # Users, companies, settings
    ├── sales/             # Customers, orders, invoices
    ├── inventory/         # Items, warehouses, stock
    └── accounting/        # Journal entries, ledgers
```

Each module is one business domain. They declare dependencies on each other.

## Next steps

- [Your First Module](/guides/your-first-module): build a working module in 15 minutes
- [How It Works](/concepts/how-it-works): understand the lifecycle from definition to running app
- [Models](/concepts/models): the core building block
- [Widgets](/concepts/widgets): the universal UI building block
- [Pages](/concepts/pages): composing widgets into screens
