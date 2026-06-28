# Auto-CRUD Pages

Every model gets a full CRUD UI by default. Define a model, get list + create + edit pages automatically at boot. No page definition required for basic CRUD.

## Design decisions

- Generated at boot time in `core` (not client-side)
- Client is dumb — receives pages via BootPayload like any other page
- Generated pages are standard `PageDefinition` objects, indistinguishable from hand-written ones
- Navigation stays manual — auto-generated pages are routable but don't appear in nav unless explicitly added to `module.ts` navigation config
- Override is per-key — overriding the list page doesn't affect the generated create/edit pages

## Page keys and routes

For a model `invoice` in module `sales`:

| Page key             | Route          | Behavior                                                      |
| -------------------- | -------------- | ------------------------------------------------------------- |
| `sales.invoice`      | `/invoice`     | List view (table)                                             |
| `sales.invoice.new`  | `/invoice/new` | Create form, always editable, redirects to detail on save     |
| `sales.invoice.edit` | `/invoice/:id` | Detail view (read-only by default), edit toggle via form mode |

## Model opt-out

```typescript
defineModel({
  name: 'order_item',
  crud: false,
  fields: { ... }
});
```

- `crud` defaults to `true` (omitted = pages generated)
- `crud: false` skips auto-generation for this model
- Manual `definePage()` still works regardless of `crud` setting

## Override behavior

Write a `definePage()` with the matching key to fully replace a generated page:

```typescript
definePage({
  key: 'sales.invoice',
  label: 'Invoices',
  widgets: [
    /* custom list implementation */
  ],
});
```

This replaces only the list page. The create (`sales.invoice.new`) and edit (`sales.invoice.edit`) pages remain auto-generated.

## Generation logic

**Location:** `core/src/boot/crud-page-generator.ts`

**Boot sequence:**

1. Schema resolves, `ResolvedModel[]` available
2. Load manual pages from `pages/` directory
3. For each model where `crud !== false`:
   - Generate list, create, edit page definitions
   - Skip any page key that already has a manual override
4. Merge generated + manual pages into final `PageDefinition[]`

## Field heuristics

| Page       | Selection logic                                                                                                                                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **List**   | First 5-7 displayable fields as columns. Skip: text/richtext, json, password, large fields. Prioritize: name/title, required fields, status-like fields. Always include a clickable name/title column that navigates to detail. |
| **Create** | All user-editable fields. Skip: auto-generated (id, created_at, updated_at), computed. Group: required first, then optional, then relations.                                                                                    |
| **Edit**   | Same fields as create, pre-populated. Read-only by default, edit toggle switches to editable.                                                                                                                                   |

These heuristics are intentionally simple. They can be refined later as we see real usage patterns.

## Generated widget trees

### List page

```typescript
definePage({
  key: 'sales.invoice',
  label: 'Invoices',
  layout: 'full',
  actions: [{ type: 'button', label: 'New', action: { type: 'navigate', path: '/invoice/new' } }],
  widgets: [
    widget.table('sales.invoice', [
      widget.column('name', { label: 'Name', sortable: true }),
      widget.column('status', { label: 'Status' }),
      // ... heuristic-selected columns
    ]),
  ],
});
```

### Create page

```typescript
definePage({
  key: 'sales.invoice.new',
  label: 'New Invoice',
  layout: 'default',
  widgets: [
    widget.form({ model: 'sales.invoice', mode: 'create' }, [
      widget.section('Basic Info', [
        widget.input('name', { required: true }),
        widget.input('amount', { required: true }),
      ]),
      widget.section('Details', [widget.textarea('notes'), widget.select('status')]),
    ]),
  ],
});
```

### Edit page

```typescript
definePage({
  key: 'sales.invoice.edit',
  label: 'Invoice',
  layout: 'default',
  widgets: [
    widget.form({ model: 'sales.invoice', mode: 'view' }, [
      widget.section('Basic Info', [
        widget.input('name', { required: true }),
        widget.input('amount', { required: true }),
      ]),
      widget.section('Details', [widget.textarea('notes'), widget.select('status')]),
    ]),
  ],
});
```

The form widget handles the edit/save/cancel toolbar internally based on its mode state. When `mode: 'view'`, fields render read-only. The form component provides a built-in edit toggle that switches mode to `'edit'`, enabling fields and showing save/cancel actions.

## What this does NOT cover

- Auto-adding pages to navigation (stays manual)
- Partial page overrides (full replacement only)
- Custom field ordering annotations on the model
- Inline editing in list view
- Bulk actions in list view
