---
status: stable
since: 0.1.0
last-updated: 2026-06-12
description: Seed data and test fixture loading
---

# Fixtures

Every application needs some data to exist before users start working. Default roles, base currencies, demo records for onboarding, test data for automated tests. Fixtures are how you declare that seed data.

You write the records you need. The framework ensures they exist in the database, safely and idempotently.

## Defining a fixture

```typescript
// fixtures/seed.ts
import { defineFixture } from 'rangka';

export default defineFixture({
  model: 'sales.customer',
  key: 'customer_name',
  records: [
    { customer_name: 'Acme Corp', type: 'Company', email: 'orders@acme.com', is_active: true },
    {
      customer_name: 'Globex Inc',
      type: 'Company',
      email: 'purchasing@globex.com',
      is_active: true,
    },
    { customer_name: 'Jane Smith', type: 'Individual', email: 'jane@example.com', is_active: true },
  ],
});
```

## Configuration

| Field     | Type       | Description                                               |
| --------- | ---------- | --------------------------------------------------------- |
| `model`   | `string`   | Which model to insert records into                        |
| `key`     | `string`   | Field used to detect existing records (skip if present)   |
| `variant` | `string`   | Category for selective loading (`'demo'`, `'test'`, etc.) |
| `depends` | `string[]` | Other fixtures that must load first                       |
| `records` | `array`    | Record objects matching the model's fields                |

## Idempotent

Fixtures use the `key` field to check for existing records. If a record with that key value already exists, the framework compares a hash of the fixture data against the stored hash. If the data has changed, the record is updated. If unchanged, it is skipped. Running fixtures multiple times is safe and records stay in sync with your fixture definitions.

```typescript
defineFixture({
  model: 'core.role',
  key: 'name',
  records: [
    { name: 'Admin', description: 'Full system access' },
    { name: 'Sales User', description: 'Sales app access' },
  ],
});
// Running this twice creates exactly 2 roles, not 4
```

## Dependencies

When fixtures reference records from other fixtures, declare the dependency:

```typescript
defineFixture({
  model: 'core.currency',
  key: 'code',
  records: [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
  ],
});

defineFixture({
  model: 'sales.price_list',
  key: 'name',
  depends: ['core.currency'],
  records: [
    { name: 'Standard Selling', currency: { ref: 'core.currency', key: 'code:USD' } },
    { name: 'Export', currency: { ref: 'sales.currency', key: 'code:EUR' } },
  ],
});
```

The `ref` syntax resolves to the referenced record's ID at load time. The framework topologically sorts fixtures so dependencies always load first.

## Variants

Fixtures can be categorized for selective loading:

```typescript
// No variant: always loaded (system essentials)
defineFixture({
  model: 'core.currency',
  key: 'code',
  records: [{ code: 'USD', name: 'US Dollar', symbol: '$' }],
});

// Only in demo environments
defineFixture({
  model: 'sales.customer',
  key: 'customer_name',
  variant: 'demo',
  records: [
    { customer_name: 'Demo Customer A', type: 'Company' },
    { customer_name: 'Demo Customer B', type: 'Individual' },
  ],
});

// Only for tests
defineFixture({
  model: 'sales.order',
  key: 'name',
  variant: 'test',
  depends: ['sales.customer'],
  records: [
    {
      name: 'TEST-SO-001',
      customer: { ref: 'sales.customer', key: 'customer_name:Demo Customer A' },
    },
  ],
});
```

## Typical use cases

- **System essentials**: roles, currencies, default fiscal year
- **Configuration defaults**: tax templates, print formats, settings
- **Demo data**: realistic records for demonstrations and onboarding
- **Test data**: known state for automated tests
