# Panel filter system

> **Planned** — not yet implemented.

## Overview

Widgets declare which fields they can be filtered by. The panel header collects these declarations and renders a unified filter UI. Filter state flows back down to widgets that declared those fields.

This decouples filter UI placement (panel header) from filter consumption (individual widgets). It also enables cross-widget filtering on dashboards where multiple widgets share the same filterable fields.

## How it works

1. A widget declares its filterable fields as metadata in its definition.
2. The panel scans its child widgets and collects all filter declarations.
3. The panel header renders a filter button when filterable fields exist.
4. User opens the filter dropdown, selects field, operator, and value.
5. Active filter state lives in the panel and flows down to each widget as props.
6. Each widget applies only the filters it declared.

## Filter declaration

Widgets declare filters in their options:

```typescript
widget.table('sales.order', {
  filters: [
    { field: 'status', type: 'select', options: ['draft', 'confirmed', 'shipped'] },
    { field: 'created_at', type: 'date-range' },
    { field: 'total', type: 'number' },
  ],
  columns: [widget.column('name'), widget.column('status'), widget.column('total')],
});
```

### Filter field schema

```typescript
interface FilterFieldDeclaration {
  field: string;
  type: 'text' | 'number' | 'select' | 'date' | 'date-range' | 'boolean';
  label?: string; // defaults to field name, title-cased
  options?: string[]; // required for 'select' type
  operators?: string[]; // override default operators for this type
}
```

### Default operators by type

| Type       | Default operators                                  |
| ---------- | -------------------------------------------------- |
| text       | contains, equals, starts_with, ends_with, is_empty |
| number     | equals, gt, gte, lt, lte, between                  |
| select     | is, is_not, is_any_of                              |
| date       | is, before, after, between                         |
| date-range | within, before, after                              |
| boolean    | is_true, is_false                                  |

## Cross-widget deduplication

When multiple widgets on the same panel declare the same field with the same type, the panel merges them into a single filter control. Changing that filter applies to all widgets that declared it.

```typescript
// Dashboard example: both widgets filter by date_range
widget.stats('sales.order', {
  filters: [{ field: 'date_range', type: 'date-range' }],
})

widget.table('sales.order', {
  filters: [
    { field: 'date_range', type: 'date-range' },
    { field: 'status', type: 'select', options: ['draft', 'confirmed'] },
  ],
  columns: [...],
})
```

The panel header shows two filter controls: `date_range` (shared) and `status` (table only). The stats widget receives only the `date_range` filter value.

Dedup key: `field` + `type`. If two widgets declare the same field with different types, both appear separately.

## State ownership

The panel owns filter state. Widgets are consumers.

```
┌─────────────────────────────────────────┐
│ Panel                                   │
│ ┌─────────────────────────────────────┐ │
│ │ Header: [Filter ▾] [status: draft]  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│  activeFilters: { status: 'draft' }     │
│         │                               │
│         ▼                               │
│ ┌───────────────┐  ┌─────────────────┐  │
│ │ Stats widget  │  │ Table widget    │  │
│ │ (ignores      │  │ (applies status │  │
│ │  status)      │  │  to query)      │  │
│ └───────────────┘  └─────────────────┘  │
└─────────────────────────────────────────┘
```

### Active filter value shape

```typescript
interface ActiveFilter {
  field: string;
  operator: string;
  value: unknown;
}

// Panel passes down:
interface FilterProps {
  activeFilters: ActiveFilter[];
}
```

Each widget receives the full `activeFilters` array. It applies only filters whose `field` matches one of its declared filter fields. Unrecognized fields are ignored.

## UI behavior

### Filter button

- Appears in the panel header when any child widget has filter declarations.
- Shows a count badge when filters are active.
- Clicking opens a dropdown.

### Filter dropdown

Two-step interaction:

1. Field selection. Lists all available filter fields (deduplicated across widgets). Shows the field label.
2. Operator + value. Once a field is selected, shows operator dropdown and value input appropriate to the filter type.

Active filters show as chips/tags next to the filter button. Each chip shows `field operator value` and has a remove button.

### Empty state

When no filters are declared by any child widget, the filter button does not render. No placeholder or disabled state.

## Integration with widget data hooks

In the client package, widgets that use `useModelQuery` pass active filters to the query:

```typescript
function TableWidget({ activeFilters, ...props }) {
  const query = useModelQuery(model, {
    filters: activeFilters.filter((f) => myDeclaredFields.includes(f.field)),
    page,
    sort,
  });
}
```

The `useModelQuery` hook already supports a `filters` parameter. No changes needed to the data layer.

## Packages affected

| Package          | Change                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| `@rangka/shared` | Add `FilterFieldDeclaration` type. Add `filters` to `TableOptions` and other widget option types. |
| `@rangka/ui`     | Panel header filter button + dropdown component. Filter chip display.                             |
| `@rangka/client` | Pass `activeFilters` from panel state to widget components. Wire into `useModelQuery`.            |

## Migration from current filter system

The current client package has `filter-operators.ts` and `TableToolbar.tsx` that render filters inside the table widget. These will be deprecated in favor of panel-level filters.

Migration path:

1. Implement panel filter system in `@rangka/ui` and wire in `@rangka/client`.
2. Keep `TableToolbar` functional during transition.
3. Remove `TableToolbar` filter UI once panel filters are stable.
4. Keep `filter-operators.ts` logic (operator definitions, type mapping). Move to shared or reuse in the panel filter dropdown.

## Out of scope

- Saved/named filter presets.
- Filter persistence across page navigation.
- Server-side filter validation.
- Filter permissions (hiding fields based on user role).

These may be added later as separate specs.
