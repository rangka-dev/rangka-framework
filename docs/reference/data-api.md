---
status: stable
since: 0.1.0
last-updated: 2026-06-10
description: REST data API — CRUD endpoints, filtering, and pagination
---

# Data API

REST API conventions for all model CRUD operations. Every registered model gets auto-generated endpoints following these patterns.

See [Models concept](../concepts/models.md) and [Permissions concept](../concepts/permissions.md) for context on access control.

## Endpoint Pattern

```
GET    /api/:app/:model          # List records
GET    /api/:app/:model/:id      # Get single record
POST   /api/:app/:model          # Create record
PUT    /api/:app/:model/:id      # Update record
DELETE /api/:app/:model/:id      # Delete record
```

## Query Parameters

### Pagination

| Parameter | Type      | Default | Max   | Description                                        |
| --------- | --------- | ------- | ----- | -------------------------------------------------- |
| `page`    | `integer` | `1`     | —     | Page number (1-indexed).                           |
| `limit`   | `integer` | `25`    | `100` | Records per page. Values below 1 are clamped to 1. |

### Sorting

| Parameter | Type     | Description                                                  |
| --------- | -------- | ------------------------------------------------------------ |
| `sort`    | `string` | Comma-separated field names. Prefix with `-` for descending. |

```
GET /api/sales/invoice?sort=-posting_date,customer
```

Sorts by `posting_date` descending, then `customer` ascending.

### Field Selection

| Parameter | Type     | Description                                                                  |
| --------- | -------- | ---------------------------------------------------------------------------- |
| `fields`  | `string` | Comma-separated field names to include in response. `id` is always included. |

```
GET /api/sales/invoice?fields=customer,total,status
```

### Includes (Eager Loading)

| Parameter | Type     | Description                                                            |
| --------- | -------- | ---------------------------------------------------------------------- |
| `include` | `string` | Comma-separated relation names. Dot notation for nested (max depth 2). |

```
GET /api/sales/invoice?include=items,customer
GET /api/sales/invoice?include=items.item_group
```

Only fields declared as relationships (`link`, `hasMany`, `children`, `manyToMany`) can be included.

### Search

| Parameter | Type     | Description                                                      |
| --------- | -------- | ---------------------------------------------------------------- |
| `search`  | `string` | ILIKE search across all fields marked `searchable` on the model. |

```
GET /api/sales/order?search=INV-001
```

### Include archived records

| Parameter         | Type      | Description                                                                        |
| ----------------- | --------- | ---------------------------------------------------------------------------------- |
| `includeArchived` | `boolean` | Include soft-deleted records. Only applies to models with the `soft_delete` trait. |

```
GET /api/sales/order?includeArchived=true
```

### Filters

| Parameter | Type     | Description                                    |
| --------- | -------- | ---------------------------------------------- |
| `filter`  | `object` | Nested object: `filter[field][operator]=value` |

```
GET /api/sales/invoice?filter[status][eq]=Draft&filter[total][gte]=1000
GET /api/sales/invoice?filter[customer][in]=C-001,C-002
GET /api/sales/invoice?filter[notes][isnull]=true
```

## Filter Operators

| Operator | Description               | Valid For                                     | Example                                |
| -------- | ------------------------- | --------------------------------------------- | -------------------------------------- |
| `eq`     | Equal                     | All types                                     | `filter[status][eq]=Draft`             |
| `neq`    | Not equal                 | All types                                     | `filter[status][neq]=Cancelled`        |
| `gt`     | Greater than              | `int`, `decimal`, `money`, `date`, `datetime` | `filter[total][gt]=1000`               |
| `gte`    | Greater than or equal     | `int`, `decimal`, `money`, `date`, `datetime` | `filter[posting_date][gte]=2026-01-01` |
| `lt`     | Less than                 | `int`, `decimal`, `money`, `date`, `datetime` | `filter[total][lt]=5000`               |
| `lte`    | Less than or equal        | `int`, `decimal`, `money`, `date`, `datetime` | `filter[posting_date][lte]=2026-12-31` |
| `like`   | Case-insensitive contains | `string`, `text`                              | `filter[name][like]=INV`               |
| `in`     | Value in set              | All types                                     | `filter[status][in]=Draft,Submitted`   |
| `isnull` | Null check                | All types                                     | `filter[deleted_at][isnull]=true`      |

### Operator Type Restrictions

- `gt`, `gte`, `lt`, `lte` — only valid for numeric (`int`, `decimal`, `money`) and date (`date`, `datetime`) fields. Returns `400` if used on other types.
- `like` — only valid for `string` and `text` fields. Returns `400` if used on other types. The framework wraps the value with `%` on both sides and uses `ILIKE`. Passing `filter[name][like]=INV` produces `WHERE name ILIKE '%INV%'`.

### Value Coercion

- Numeric fields: string values are parsed to numbers
- Boolean fields: `'true'` → `true`, `'false'` → `false`
- `in` operator: comma-separated string is split into an array, each element coerced per field type
- `isnull` operator: value is coerced to boolean (`'true'` or `'false'`)

## Request/Response Shapes

### List Response

```typescript
{
  data: (Record < string, unknown > []);
  meta: {
    total: number; // Total records matching filters
    page: number; // Current page
    limit: number; // Records per page
    totalPages: number; // Computed total pages
  }
}
```

```json
{
  "data": [
    { "id": "inv-001", "customer": "C-001", "total": 5000, "status": "Draft" },
    { "id": "inv-002", "customer": "C-002", "total": 3200, "status": "Submitted" }
  ],
  "meta": {
    "total": 47,
    "page": 1,
    "limit": 25,
    "totalPages": 2
  }
}
```

### Get Response

The single record endpoint also supports `fields` and `include` query parameters. They work the same as in the list endpoint.

```
GET /api/sales/invoice/inv-001?fields=customer,total&include=items
```

```typescript
{
  data: Record<string, unknown>;
}
```

```json
{
  "data": {
    "id": "inv-001",
    "customer": "C-001",
    "posting_date": "2026-01-15",
    "total": 5000,
    "status": "Draft",
    "items": [{ "id": "item-001", "item": "Widget A", "qty": 10, "rate": 500 }]
  }
}
```

### Create Request/Response

**Request body:** Field values for the new record. Omit `id` (auto-generated).

```json
{
  "customer": "C-001",
  "posting_date": "2026-01-15",
  "items": [{ "item": "Widget A", "qty": 10, "rate": 500 }]
}
```

**Response:** `201 Created`

```json
{
  "data": {
    "id": "inv-003",
    "customer": "C-001",
    "posting_date": "2026-01-15",
    "total": 5000,
    "status": "Draft"
  }
}
```

### Update Request/Response

**Request body:** Only the fields being changed (partial update).

```json
{
  "posting_date": "2026-01-20"
}
```

**Response:** `200 OK`

```json
{
  "data": {
    "id": "inv-003",
    "customer": "C-001",
    "posting_date": "2026-01-20",
    "total": 5000,
    "status": "Draft"
  }
}
```

### Delete Response

**Response:** `204 No Content` (empty body)

## Error Format

All errors follow a consistent shape:

```typescript
{
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

### Error Codes

| HTTP Status | Code                     | Description                                |
| ----------- | ------------------------ | ------------------------------------------ |
| `400`       | `VALIDATION_ERROR`       | Request body failed validation             |
| `400`       | `QUERY_VALIDATION_ERROR` | Invalid filter, sort, or include parameter |
| `401`       | `UNAUTHORIZED`           | Missing or invalid session                 |
| `403`       | `FORBIDDEN`              | User lacks required model permission       |
| `404`       | `NOT_FOUND`              | Record does not exist                      |
| `500`       | `INTERNAL_ERROR`         | Unexpected server error                    |

## Permission Enforcement Pipeline

Every request passes through these stages in order:

1. **Authentication** — validate session token
2. **Model Permission** — check user roles against model CRUD permission
3. **Scope Filtering** — apply row-level security filters to queries
4. **Scope Validation** — verify write operations don't violate scope boundaries
5. **Field Write Guard** — strip fields the user cannot write
6. **Field Read Strip** — remove fields the user cannot read from responses

## Content Type

- Request: `application/json`
- Response: `application/json`

## OpenAPI

The framework auto-generates an OpenAPI 3.0 schema from registered models. Available at:

```
GET /api/docs/json
```
