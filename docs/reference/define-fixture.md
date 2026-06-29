---
status: stable
since: 0.1.0
last-updated: 2026-06-29
description: defineFixture() API — seed data format and loading order
---

# defineFixture

Declares seed data. Records loaded into the database for initial setup, demos, or testing.

See [Fixtures concept](../concepts/fixtures.md) for usage patterns.

## Signature

```typescript
import { defineFixture } from 'rangka';

export default defineFixture({
  model: 'accounting.account',
  key: 'code',
  variant: 'demo',
  depends: ['accounting.account-type'],
  records: [
    { code: '1000', name: 'Cash', account_type: { ref: 'accounting.account-type', key: 'asset' } },
    {
      code: '1100',
      name: 'Accounts Receivable',
      account_type: { ref: 'accounting.account-type', key: 'asset' },
    },
    {
      code: '2000',
      name: 'Accounts Payable',
      account_type: { ref: 'accounting.account-type', key: 'liability' },
    },
    {
      code: '4000',
      name: 'Revenue',
      account_type: { ref: 'accounting.account-type', key: 'income' },
    },
    {
      code: '5000',
      name: 'Cost of Goods Sold',
      account_type: { ref: 'accounting.account-type', key: 'expense' },
    },
  ],
});
```

## FixtureConfig

```typescript
interface FixtureConfig {
  model: string;
  key: string;
  variant?: string;
  depends?: string[];
  records: Record<string, unknown>[];
}
```

### Fields

| Field     | Type                        | Default     | Description                                                                                 |
| --------- | --------------------------- | ----------- | ------------------------------------------------------------------------------------------- |
| `model`   | `string`                    | —           | **Required.** Qualified model name to insert records into.                                  |
| `key`     | `string`                    | —           | **Required.** Field used for upsert matching. Determines how existing records are detected. |
| `variant` | `string`                    | `undefined` | Load condition. See Variants below.                                                         |
| `depends` | `string[]`                  | `undefined` | Other fixture files (by model name) that must be loaded first.                              |
| `records` | `Record<string, unknown>[]` | —           | **Required.** Array of record data objects to insert.                                       |

## Variants

| Variant                  | When Loaded                                                                     |
| ------------------------ | ------------------------------------------------------------------------------- |
| `undefined` (no variant) | Always loaded. Required for app to function (config, defaults, system records). |
| `'demo'`                 | Loaded when running with demo data (development, staging).                      |
| `'test'`                 | Loaded for automated tests only.                                                |
| Custom string            | Loaded only when explicitly requested by name.                                  |

## References

Use `FixtureRef` to reference records from other fixtures by their key value:

```typescript
interface FixtureRef {
  ref: string; // Qualified model name of the referenced fixture
  key: string; // Key value of the referenced record
}
```

At load time, the framework resolves the reference to the actual record ID:

```typescript
records: [
  {
    name: 'Main Warehouse',
    company: { ref: 'core.company', key: 'acme' }, // Resolved to company.id at load time
  },
];
```

### Explicit field lookup

For references where the key field is ambiguous, use the `field:value` syntax to specify which field to match:

```typescript
records: [
  {
    name: 'Accounts Payable',
    account_type: { ref: 'accounting.account-type', key: 'account_code:2100' },
  },
];
```

This resolves the reference by looking up the record where `account_code = '2100'` in the referenced fixture.

## Dependencies

The `depends` array ensures fixtures are loaded in the correct order. The framework performs topological sorting:

```typescript
// This fixture depends on account-type being loaded first
defineFixture({
  model: 'accounting.account',
  depends: ['accounting.account-type'],
  // ...
});
```

> **Planned** — circular dependency detection is not yet implemented.

## Idempotent Loading

The framework tracks fixture state using `_fixture_source` and `_fixture_hash` columns added to the table. For each record:

1. If the record does not exist → insert it
2. If the record exists and its fixture hash matches → skip (no change needed)
3. If the record exists and its fixture hash differs (definition changed) → update the record

This means fixtures can be re-run safely without duplicating data. Changed definitions are automatically applied on next load.

### Force mode

Pass `{ force: true }` to always overwrite records regardless of hash:

```typescript
loadFixtures(db, definitions, { force: true });
```

## File Discovery

Fixtures are discovered from the `fixtures/` directory in each app:

```
apps/accounting/
  fixtures/
    account-type.ts     # defineFixture({ model: 'accounting.account-type', ... })
    account.ts          # defineFixture({ model: 'accounting.account', ... })
    currency.ts         # defineFixture({ model: 'accounting.currency', ... })
```

## Loading Order

1. Sorted by dependency order via topological sort based on `depends` declarations
2. Cross-app dependencies are resolved globally (not per-app)

## Example: Full Fixture Set

```typescript
// fixtures/currency.ts - no dependencies, no variant (always loaded)
export default defineFixture({
  model: 'accounting.currency',
  key: 'code',
  records: [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
  ],
});

// fixtures/demo-invoices.ts - demo variant, depends on customer fixture
export default defineFixture({
  model: 'sales.invoice',
  key: 'name',
  variant: 'demo',
  depends: ['sales.customer'],
  records: [
    {
      name: 'INV-0001',
      customer: { ref: 'sales.customer', key: 'acme-corp' },
      posting_date: '2026-01-15',
      total: 5000,
    },
  ],
});
```
