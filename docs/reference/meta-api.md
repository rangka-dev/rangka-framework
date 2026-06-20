---
status: stable
since: 0.1.0
last-updated: 2026-06-10
description: Meta API — boot payload and model metadata endpoints
---

# Meta API

The boot endpoint provides all metadata the frontend shell needs to initialize. This includes the user session, permissions, navigation, page definitions, model schemas, and widget definitions.

See [How It Works concept](../concepts/how-it-works.md) for the lifecycle context.

## Boot Endpoint

```
GET /api/meta/boot
```

**Authentication:** Required. Returns `401` if no valid session.

**Caching:** Response is user-specific (contains permissions). Not cacheable by CDN. Client should cache locally and invalidate on role/permission changes.

## Response Shape

```typescript
interface BootResponse {
  user: BootUser;
  permissions: BootPermissions;
  navigation: NavigationTree[];
  pages: PageDefinition[];
  models: Record<string, ModelMeta>;
  widgets?: WidgetDefinitionMeta[];
}
```

### BootUser

```typescript
interface BootUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
}
```

| Field   | Type       | Description                                            |
| ------- | ---------- | ------------------------------------------------------ |
| `id`    | `string`   | User record ID.                                        |
| `name`  | `string`   | Display name.                                          |
| `email` | `string`   | Email address.                                         |
| `roles` | `string[]` | All roles assigned to this user (including inherited). |

### BootPermissions

```typescript
interface BootPermissions {
  models: Record<string, ModelPermissions>;
  pages: string[];
}
```

| Field    | Type                               | Description                                                     |
| -------- | ---------------------------------- | --------------------------------------------------------------- |
| `models` | `Record<string, ModelPermissions>` | Keyed by qualified model name. Merged result of all user roles. |
| `pages`  | `string[]`                         | Page keys the user is allowed to access.                        |

### ModelPermissions

```typescript
interface ModelPermissions {
  read?: boolean | 'own';
  write?: boolean | 'own';
  create?: boolean;
  delete?: boolean | 'own';
  fieldPermissions?: Record<string, { read?: boolean; write?: boolean }>;
}
```

| Field              | Type                              | Default     | Description                                                                                     |
| ------------------ | --------------------------------- | ----------- | ----------------------------------------------------------------------------------------------- |
| `read`             | `boolean \| 'own'`                | `false`     | Can list and view records. When `'own'`, user can only read records they own.                   |
| `write`            | `boolean \| 'own'`                | `false`     | Can update existing records. When `'own'`, user can only update records they own.               |
| `create`           | `boolean`                         | `false`     | Can create new records.                                                                         |
| `delete`           | `boolean \| 'own'`                | `false`     | Can delete records. When `'own'`, user can only delete records they own.                        |
| `fieldPermissions` | `Record<string, {read?, write?}>` | `undefined` | Per-field overrides. If a field is not listed, it inherits from the model-level `read`/`write`. |

### NavigationTree

```typescript
interface NavigationTree {
  module: string;
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  order?: number;
  type?: 'internal' | 'external';
  sections: NavigationTreeSection[];
}
```

| Field         | Type                       | Description                                                      |
| ------------- | -------------------------- | ---------------------------------------------------------------- |
| `module`      | `string`                   | Module name.                                                     |
| `label`       | `string`                   | Module display label.                                            |
| `description` | `string`                   | Short description of the module.                                 |
| `icon`        | `string`                   | Module icon (Lucide name).                                       |
| `color`       | `string`                   | Module theme color.                                              |
| `order`       | `number`                   | Sort order for sidebar.                                          |
| `type`        | `'internal' \| 'external'` | Whether the module links internally or to an external URL.       |
| `sections`    | `NavigationTreeSection[]`  | Grouped navigation items (already filtered by user permissions). |

### NavigationTreeSection

```typescript
interface NavigationTreeSection {
  section: string;
  items: NavigationTreeItem[];
}
```

### NavigationTreeItem

```typescript
interface NavigationTreeItem {
  page: string;
  label: string;
  icon?: string;
}
```

### ModelMeta

```typescript
interface ModelMeta {
  qualifiedName: string;
  label?: string;
  fields: FieldMeta[];
}
```

| Field           | Type          | Description                     |
| --------------- | ------------- | ------------------------------- |
| `qualifiedName` | `string`      | `module.model` format.          |
| `label`         | `string`      | Human-readable model name.      |
| `fields`        | `FieldMeta[]` | All fields with their metadata. |

### FieldMeta

```typescript
interface FieldMeta {
  name: string;
  type: string;
  label?: string;
  required?: boolean;
  searchable?: boolean;
  options?: readonly string[];
  relationship?: {
    type: 'link' | 'hasMany' | 'children' | 'manyToMany' | 'dynamicLink';
    model?: string;
    foreignKey?: string;
    through?: string;
    modelField?: string;
  };
}
```

| Field          | Type                | Description                                                   |
| -------------- | ------------------- | ------------------------------------------------------------- |
| `name`         | `string`            | Field identifier.                                             |
| `type`         | `string`            | Field type (string, int, link, etc.).                         |
| `label`        | `string`            | Display label.                                                |
| `required`     | `boolean`           | Whether the field is required.                                |
| `searchable`   | `boolean`           | Whether the field is included in search queries.              |
| `options`      | `readonly string[]` | Enum values (only present for `type: 'enum'`).                |
| `relationship` | `object`            | Relationship metadata (only present for relationship fields). |

#### Relationship metadata fields

| Field        | Present When                                | Description                                         |
| ------------ | ------------------------------------------- | --------------------------------------------------- |
| `type`       | Always                                      | Relationship type.                                  |
| `model`      | `link`, `hasMany`, `children`, `manyToMany` | Target model qualified name.                        |
| `foreignKey` | `hasMany`, `children`                       | Field on the related model that points back.        |
| `through`    | `manyToMany`                                | Junction table model name.                          |
| `modelField` | `dynamicLink`                               | Field that stores the target model name at runtime. |

## Example Response

```json
{
  "user": {
    "id": "usr_001",
    "name": "Jane Smith",
    "email": "jane@company.com",
    "roles": ["Sales Manager", "Sales User"]
  },
  "permissions": {
    "models": {
      "sales.invoice": {
        "read": true,
        "write": true,
        "create": true,
        "delete": false,
        "fieldPermissions": {
          "cost_center": { "read": true, "write": false }
        }
      }
    },
    "pages": ["invoices", "customers", "reports"]
  },
  "navigation": [
    {
      "module": "sales",
      "label": "Sales",
      "icon": "shopping-cart",
      "order": 10,
      "sections": [
        {
          "section": "Transactions",
          "items": [
            { "page": "invoices", "label": "Sales Invoices", "icon": "file-text" },
            { "page": "customers", "label": "Customers", "icon": "users" }
          ]
        }
      ]
    }
  ],
  "pages": [
    {
      "key": "invoices",
      "label": "Sales Invoices",
      "type": "collection",
      "body": [
        {
          "type": "split",
          "props": { "sizes": [60, 40] },
          "children": [
            {
              "type": "table",
              "bind": { "model": { "name": "sales.invoice" } },
              "children": [
                { "type": "column", "props": { "label": "Number" }, "bind": { "field": "number" } },
                {
                  "type": "column",
                  "props": { "label": "Customer" },
                  "bind": { "field": "customer_name" }
                },
                {
                  "type": "column",
                  "props": { "label": "Status" },
                  "children": [{ "type": "badge", "bind": { "field": "status" } }]
                }
              ]
            },
            {
              "type": "data",
              "source": { "model": "sales.invoice", "id": "$state.selectedId" },
              "children": [
                { "type": "input", "bind": { "field": "customer_id" } },
                { "type": "input", "bind": { "field": "status" } }
              ]
            }
          ]
        }
      ]
    }
  ],
  "models": {
    "sales.invoice": {
      "qualifiedName": "sales.invoice",
      "label": "Sales Invoice",
      "fields": [
        { "name": "id", "type": "string", "required": true },
        {
          "name": "customer",
          "type": "link",
          "label": "Customer",
          "required": true,
          "relationship": { "type": "link", "model": "sales.customer" }
        },
        { "name": "status", "type": "enum", "options": ["Draft", "Submitted", "Cancelled"] },
        {
          "name": "items",
          "type": "children",
          "relationship": {
            "type": "children",
            "model": "sales.invoice_item",
            "foreignKey": "invoice_id"
          }
        }
      ]
    }
  }
}
```

## Error Response

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Valid session required"
  }
}
```

## Session Endpoints

### Login

```
POST /api/core/session
```

**Body:**

```json
{
  "email": "user@company.com",
  "password": "..."
}
```

**Response:**

```json
{
  "data": {
    "token": "eyJhbG...",
    "expires_at": "2026-06-20T06:00:00.000Z"
  }
}
```

### Logout

```
DELETE /api/core/session
```

**Authentication:** Required.

**Response:** `204 No Content`
