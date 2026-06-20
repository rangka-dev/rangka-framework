---
status: stable
since: 0.1.0
last-updated: 2026-06-12
description: defineRoles() API — role definitions and permission grants
---

# defineRoles

Declares roles for a module. Roles are registered in-memory via PermissionRegistry at boot and used for permission enforcement.

See [Permissions concept](../concepts/permissions.md) for how permissions are resolved and enforced.

## Signature

```typescript
import { defineRoles } from 'rangka';

export default defineRoles({
  sales_user: {
    label: 'Sales User',
    models: {
      'sales.customer': { read: true, create: true, write: true },
      'sales.order': { read: true, create: true, write: true },
    },
    pages: ['sales.orders', 'sales.customers', 'sales.dashboard'],
  },

  sales_manager: {
    label: 'Sales Manager',
    extends: 'sales_user',
    models: {
      'sales.order': { delete: true },
      'sales.customer': { delete: true },
    },
    pages: ['sales.reports', 'sales.settings'],
  },
});
```

## File Location

```
modules/{module}/roles.ts
```

One file per module. Each module declares its own roles.

## RoleDefinition

```typescript
interface RoleDefinition {
  label: string;
  extends?: string;
  models?: Record<string, ModelPermissions>;
  pages?: string[];
}
```

| Field     | Type                               | Required | Description                                                           |
| --------- | ---------------------------------- | -------- | --------------------------------------------------------------------- |
| `label`   | `string`                           | Yes      | Human-readable display name.                                          |
| `extends` | `string`                           | No       | Name of another role to inherit from. Permissions merge permissively. |
| `models`  | `Record<string, ModelPermissions>` | No       | Model-level CRUD permissions.                                         |
| `pages`   | `string[]`                         | No       | Page keys this role can access.                                       |

## ModelPermissions

```typescript
interface ModelPermissions {
  read?: boolean | 'own';
  create?: boolean;
  write?: boolean | 'own';
  delete?: boolean | 'own';
  fieldPermissions?: Record<string, { read?: boolean; write?: boolean }>;
}
```

| Field              | Type                  | Default     | Description                                                      |
| ------------------ | --------------------- | ----------- | ---------------------------------------------------------------- |
| `read`             | `boolean \| 'own'`    | `false`     | Can view records. `'own'` restricts to records the user created. |
| `create`           | `boolean`             | `false`     | Can create new records.                                          |
| `write`            | `boolean \| 'own'`    | `false`     | Can update records. `'own'` restricts to own records.            |
| `delete`           | `boolean \| 'own'`    | `false`     | Can delete records. `'own'` restricts to own records.            |
| `fieldPermissions` | `Record<string, ...>` | `undefined` | Per-field read/write overrides within this model.                |

Unspecified permissions default to `false`.

## FieldPermissions

Field-level overrides are declared inline in `ModelPermissions.fieldPermissions`:

```typescript
models: {
  'sales.order': {
    read: true,
    write: true,
    fieldPermissions: {
      cost_price: { read: false },
      discount_percent: { read: true, write: false },
    },
  },
}
```

## Inheritance

```typescript
sales_manager: {
  label: 'Sales Manager',
  extends: 'sales_user',
  models: { ... },
}
```

When a role extends another:

- All model permissions from the parent are inherited
- All page permissions from the parent are inherited
- Permissions declared on the child are merged on top (most permissive wins)
- Multi-level inheritance is supported (`controller` extends `manager` extends `user`)
- Circular inheritance is detected and raises an error at boot

The `extends` target must be a role defined in the same module or a previously registered module (respects module dependency order).

## Admin operations

> **Planned** — not yet implemented.

## Example: Cross-Module Roles

A role can reference models from any installed module:

```typescript
// modules/core/roles.ts
export default defineRoles({
  system_admin: {
    label: 'System Admin',
    models: {
      'core.user': { read: true, create: true, write: true, delete: true },
      'core.role': { read: true, create: true, write: true, delete: true },
    },
    pages: ['core.users', 'core.roles', 'core.settings'],
  },
});
```

```typescript
// modules/sales/roles.ts
export default defineRoles({
  sales_user: {
    label: 'Sales User',
    models: {
      'sales.order': { read: true, create: true, write: true },
      'core.user': { read: true }, // can see users (for assignment fields)
    },
    pages: ['sales.orders'],
  },
});
```

A user assigned both `system_admin` and `sales_user` gets the union of all permissions.
