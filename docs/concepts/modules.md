---
status: stable
since: 0.1.0
last-updated: 2026-06-12
description: Module definition, namespacing, and dependency declaration
---

# Modules

Software mirrors the organizations that build it. A business has departments and each department has its own language and concerns. Modules let you honor those boundaries in code.

Sales logic lives in the sales module. Inventory logic lives in the inventory module. Each module is a self-contained folder that groups related models, pages, services, and logic together. As the system grows, the boundaries stay legible because the structure enforces them.

## Defining a module

Every module needs a `module.ts` file at its root:

```typescript
// modules/inventory/module.ts
import { defineModule } from 'rangka';

export default defineModule({
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

This is enough to get a module showing up in the sidebar with its own navigation sections.

## Configuration

| Field        | Type                          | Description                                     |
| ------------ | ----------------------------- | ----------------------------------------------- |
| `name`       | `string`                      | Unique identifier, used as namespace for models |
| `label`      | `string`                      | Display name in the UI                          |
| `icon`       | `string`                      | Lucide icon name for the sidebar                |
| `order`      | `number`                      | Sidebar position (lower = higher)               |
| `depends`    | `string[]`                    | Modules that must load before this one          |
| `scopes`     | `Record<string, ScopeConfig>` | Filtering dimensions (see [Scopes](#scopes))    |
| `navigation` | `NavigationSection[]`         | Sidebar sections and items                      |

## File layout

A module follows conventions. The framework discovers files by their directory:

```
modules/sales/
├── module.ts              # Required
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

Only `module.ts` is required. Add other directories as you need them.

## Namespacing

A model's full name is `{module}.{model}`. So a model defined in `modules/sales/models/order.ts` becomes `sales.order`. All cross-module references use this qualified name:

```typescript
// In the accounting module, linking to a sales model
fields: {
  sales_order: field.link('sales.order'),
}
```

This naming convention keeps references unambiguous, even as the number of modules grows.

## Dependencies

When your module references models from another module, declare the dependency:

```typescript
defineModule({
  name: 'accounting',
  label: 'Accounting',
  depends: ['core', 'sales'],
});
```

This ensures dependent modules load first. Their models, hooks, and services are registered before yours, so references always resolve.

## Scopes

Scopes are filtering dimensions that automatically restrict queries. The most common example: a multi-company setup where users only see data from their active company.

```typescript
defineModule({
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

| Field        | Type      | Description                          |
| ------------ | --------- | ------------------------------------ |
| `model`      | `string`  | Model that provides scope values     |
| `default`    | `string`  | Dot-path to the user's default value |
| `switchable` | `boolean` | Show a switcher in the sidebar       |

Models opt in with `scope: 'core.company'` in their definition. Once opted in, all queries are filtered automatically. The user never sees data from a company they have not selected.

## Splitting large domains

As a domain grows complex, it often makes sense to break it into multiple modules that collaborate:

```
modules/
├── hr/                    # Core HR (employees, departments)
├── payroll/               # Payroll processing (depends: ['hr'])
├── attendance/            # Time tracking (depends: ['hr'])
└── recruitment/           # Hiring pipeline (depends: ['hr'])
```

Each has its own navigation, models, and pages. They reference each other's models freely through the dependency system.

## Third-party modules

Modules can be distributed as npm packages. Install one, and its models, pages, and logic merge into your app automatically on the next restart. No extra configuration beyond `npm install`.
