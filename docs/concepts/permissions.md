---
status: stable
since: 0.1.0
last-updated: 2026-06-12
description: Roles, model permissions, and field-level access control
---

# Permissions

Every business application faces the same fundamental question: who is allowed to do what? A clerk should not approve invoices. A regional manager should only see their territory's data. An admin should have full access but still operate within audit boundaries.

Rangka uses role-based access control that reaches deep. Roles define what a user can see and do, down to individual fields. Modules ship with sensible default roles but admins can create and edit roles through the UI without touching code.

## The two layers

1. **Code-defined roles** (`defineRoles()`) ship with your module as defaults. They seed the database on first install.
2. **Database-stored roles** are the runtime source of truth. Admins manage these through the built-in role editor.

Code roles are the starting point. The database is where permissions actually live.

## Defining roles

```typescript
// modules/sales/roles.ts
import { defineRoles } from 'rangka';

export default defineRoles({
  sales_user: {
    label: 'Sales User',
    models: {
      'sales.customer': { read: true, create: true, write: true },
      'sales.order': { read: true, create: true, write: true },
      'sales.invoice': { read: true },
    },
    pages: ['sales.orders', 'sales.customers', 'sales.dashboard'],
  },

  sales_manager: {
    label: 'Sales Manager',
    extends: 'sales_user',
    models: {
      'sales.order': { delete: true },
      'sales.invoice': { create: true, write: true },
    },
    pages: ['sales.reports', 'sales.settings'],
  },
});
```

## Model permissions

Each model supports these flags:

| Permission | What it controls            |
| ---------- | --------------------------- |
| `read`     | Can view records            |
| `create`   | Can create new records      |
| `write`    | Can update existing records |
| `delete`   | Can delete records          |

### Owner-based

Use `'own'` to restrict operations to records the user created:

```typescript
'sales.order': { read: true, create: true, write: 'own', delete: 'own' }
```

Owner-based permissions rely on the `created_by` field from the `timestamped` trait. The framework automatically stamps `created_by` with the current user's ID when a record is created. If a model does not have the `timestamped` trait then `'own'` permissions deny all access to that model.

**How each action behaves with `'own'`:**

| Action   | Behavior                                                                                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `read`   | List endpoints only return records owned by the user. Single-record endpoints return 404 for records owned by others (not 403 to avoid leaking existence). |
| `write`  | Returns 403 if the user tries to update a record they did not create.                                                                                      |
| `delete` | Returns 403 if the user tries to delete a record they did not create.                                                                                      |

**Merge rules:** When a user has multiple roles and one grants `true` while another grants `'own'` on the same action, `true` wins. The most permissive value always takes precedence.

```typescript
// User has: ['sales_user', 'sales_manager']
// sales_user:    sales.order { write: 'own' }
// sales_manager: sales.order { write: true }
// Resolved:      sales.order { write: true }
```

## Field-level permissions

Control visibility and editability of individual fields:

```typescript
sales_user: {
  models: {
    'sales.order': {
      read: true,
      write: true,
      fieldPermissions: {
        cost_price: { read: false },                    // Hidden entirely
        discount_percent: { read: true, write: false }, // Visible but not editable
      },
    },
  },
}
```

This affects everything: the API strips hidden fields from responses, rejects writes to read-only fields, and the UI hides or disables inputs accordingly.

## Page-level permissions

Control which screens a role can access:

```typescript
sales_user: {
  pages: ['sales.orders', 'sales.customers', 'sales.dashboard'],
}
```

Pages not listed are hidden from the sidebar and return 403 if accessed directly.

## Role inheritance

Roles can extend other roles. Permissions merge with the most permissive value winning:

```typescript
sales_manager: {
  extends: 'sales_user',
  models: {
    'sales.order': { delete: true },
  },
}
```

The Sales Manager gets everything Sales User has, plus delete.

## Row filters

Restrict which records a role can see:

```typescript
sales_user: {
  filters: {
    'sales.order': { territory: '$user.territory' },
  },
}
```

A Sales User querying orders only sees orders in their territory. `$user.*` references resolve at query time against the current user's profile.

## How permissions reach the UI

The boot API resolves a user's complete permission set and returns it. The frontend uses this to:

- Show/hide sidebar items
- Show/hide create, save, delete buttons
- Disable or hide form fields
- Show/hide action buttons

Users only see what they can act on. There are no "access denied" dead ends in the interface.

## Multiple roles

When a user has multiple roles, permissions merge (most permissive wins):

```typescript
// User has: ['sales_user', 'finance_user']
// sales_user:   sales.order { read, create, write }
// finance_user: sales.order { read }
// Resolved:     sales.order { read, create, write }
```

## API enforcement

Every request passes through: authentication, model permission check, scope filter, row filter, field write check, handler, field strip. Permissions are enforced server-side regardless of what client is making the request.

## Admin role management

Every Rangka app includes a built-in role editor. Admins can create roles, edit permissions via a visual matrix, assign roles to users, and clone existing roles. Admin edits persist through module upgrades because the sync only adds new permissions and never removes existing ones.

## Real-world example

```typescript
export default defineRoles({
  accounts_clerk: {
    label: 'Accounts Clerk',
    models: {
      'accounting.journal_entry': { read: true, create: true, write: true },
      'accounting.payment': { read: true, create: true },
      'accounting.invoice': { read: true },
    },
    pages: ['accounting.journal-entries', 'accounting.payments'],
  },

  accountant: {
    label: 'Accountant',
    extends: 'accounts_clerk',
    models: {
      'accounting.payment': { write: true },
      'accounting.invoice': { create: true, write: true },
    },
    pages: ['accounting.invoices', 'accounting.trial-balance'],
  },

  finance_controller: {
    label: 'Finance Controller',
    extends: 'accountant',
    models: {
      'accounting.journal_entry': { delete: true },
      'accounting.payment': { delete: true },
      'accounting.invoice': { delete: true },
    },
    pages: ['accounting.profit-loss', 'accounting.balance-sheet', 'accounting.settings'],
  },
});
```

Clerk can create drafts. Accountant can also write payments and invoices. Controller can delete. Each level sees more pages and can do more. The hierarchy reflects how real accounting teams operate.
