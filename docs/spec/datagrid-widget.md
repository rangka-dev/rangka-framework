# Datagrid widget spec

> **Draft** — not yet implemented.

The datagrid widget provides a spreadsheet-like editing experience for model data. It renders a virtualized grid with inline cell editing, column resizing, keyboard navigation, and row management. It uses the same data source API as the table widget.

---

## Status

|                    |                  |
| ------------------ | ---------------- |
| **Stage**          | Draft            |
| **Target package** | `@rangka/client` |
| **Blocked by**     | None             |

### Scope of changes

| Package               | Impact | What changes                                                                                                                                                                   |
| --------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@rangka/client`      | High   | New widget component, ~20 new files under `widgets/components/datagrid/`. New dependencies: `@tanstack/react-table`, `@tanstack/react-virtual`. Registration in `register.ts`. |
| `@rangka/shared`      | None   | No type changes. The datagrid reuses existing `WidgetNode`, `WidgetSource`, `WidgetDefinitionMeta`, and `column` child type as-is.                                             |
| `@rangka/core`        | None   | No server changes. Uses existing model CRUD API endpoints (`GET /api/{module}/{model}`, `POST`, `PUT`, `DELETE`).                                                              |
| `@rangka/cli`         | None   | No CLI changes.                                                                                                                                                                |
| `@rangka/studio-core` | None   | No studio changes.                                                                                                                                                             |

### Summary

The datagrid is entirely client-side. It adds no new shared types, no new API endpoints, and no server logic. All changes are confined to `packages/client/src/widgets/components/` plus two new npm dependencies.

---

## Principles

- The datagrid is a data container. It fetches records via `useModelQuery` and exposes them as an editable grid.
- Columns are declared as child `column` widgets. The same column definition format used by the table widget works here.
- Edits save immediately on commit (blur or Enter). No explicit save button. Each cell mutation is independent.
- Sorting and filtering are server-side. The datagrid writes to the same reactive variables (`$sort`, `$filter`, `$page`, `$search`) that the table widget uses.
- Virtual scrolling handles large datasets. Only visible rows are rendered in the DOM.
- Keyboard navigation follows spreadsheet conventions. Arrow keys move between cells. Enter commits and moves down. Tab moves right. Escape cancels.

---

## 1. Public API

### Basic usage

```typescript
{
  type: 'datagrid',
  source: { model: 'sales.order' },
  props: {
    pageSize: 50,
    editable: true,
    selectable: true,
  },
  on: {
    cellChange: { type: 'refreshSource' },
  },
  children: [
    { type: 'column', bind: { field: 'customer' }, props: { label: 'Customer', sortable: true, filterable: true } },
    { type: 'column', bind: { field: 'status' }, props: { label: 'Status', editable: true } },
    { type: 'column', bind: { field: 'total' }, props: { label: 'Total', align: 'right', editable: false } },
  ],
}
```

### Read-only mode

```typescript
{
  type: 'datagrid',
  source: { model: 'sales.order' },
  props: {
    pageSize: 100,
    editable: false,
    resizable: true,
  },
  children: [
    { type: 'column', bind: { field: 'customer' }, props: { label: 'Customer', sortable: true } },
    { type: 'column', bind: { field: 'date' }, props: { label: 'Date', sortable: true } },
  ],
}
```

### With row management

```typescript
{
  type: 'datagrid',
  source: { model: 'inventory.item' },
  props: {
    pageSize: 50,
    editable: true,
    selectable: true,
    addRow: true,
  },
  on: {
    rowCreate: { type: 'navigate', path: '/inventory/items/{{$response.id}}' },
    rowDelete: { type: 'refreshSource' },
  },
  children: [
    { type: 'column', bind: { field: 'sku' }, props: { label: 'SKU' } },
    { type: 'column', bind: { field: 'name' }, props: { label: 'Name' } },
    { type: 'column', bind: { field: 'quantity' }, props: { label: 'Qty', align: 'right' } },
  ],
}
```

### Auto-columns (no children)

```typescript
{
  type: 'datagrid',
  source: { model: 'sales.order' },
  props: { pageSize: 50, editable: true },
}
```

When `children` is empty or absent the datagrid auto-generates columns from model metadata. This is the quickest way to get a working grid without manually listing every field.

---

## 2. Props

| Prop          | Type                                          | Default        | Description                                                                 |
| ------------- | --------------------------------------------- | -------------- | --------------------------------------------------------------------------- |
| `pageSize`    | number                                        | 50             | Records per page. Enables smart mode (server-side fetching).                |
| `rowHeight`   | `'compact'` \| `'default'` \| `'comfortable'` | `'default'`    | Row height. Compact is 32px, default is 40px, comfortable is 52px.          |
| `editable`    | boolean                                       | true           | Global toggle for inline editing. Columns can override per-field.           |
| `resizable`   | boolean                                       | true           | Allow column width resizing via drag.                                       |
| `reorderable` | boolean                                       | true           | Allow column reordering via drag.                                           |
| `selectable`  | boolean                                       | true           | Show row selection checkboxes.                                              |
| `addRow`      | boolean                                       | false          | Show add-row button in footer.                                              |
| `variant`     | `'card'` \| `'flat'`                          | `'card'`       | Visual container style. Card has border and background. Flat is borderless. |
| `emptyText`   | string                                        | `'No records'` | Message shown when no data is available.                                    |

---

## 3. Column props

Columns use the existing `column` widget type. The datagrid reads these additional props beyond what the table widget uses.

| Prop         | Type                                | Default            | Description                                       |
| ------------ | ----------------------------------- | ------------------ | ------------------------------------------------- |
| `label`      | string                              | field name         | Column header text.                               |
| `width`      | string                              | `'150'`            | Initial width in pixels (as string).              |
| `minWidth`   | string                              | `'80'`             | Minimum width during resize.                      |
| `maxWidth`   | string                              | —                  | Maximum width during resize.                      |
| `align`      | `'left'` \| `'center'` \| `'right'` | `'left'`           | Cell content alignment.                           |
| `sortable`   | boolean                             | false              | Allow sorting by clicking header.                 |
| `filterable` | boolean                             | false              | Include in filter dropdown options.               |
| `editable`   | boolean                             | inherits from grid | Override grid-level `editable` for this column.   |
| `resizable`  | boolean                             | inherits from grid | Override grid-level `resizable` for this column.  |
| `frozen`     | boolean                             | false              | Pin column to left edge during horizontal scroll. |

---

## 4. Auto-columns

When `children` is empty or absent the datagrid derives columns automatically from model metadata (`useModelMeta`).

### Derivation rules

1. Fetch all fields from model metadata.
2. Skip internal and audit fields: `id`, `created_at`, `updated_at`, `deleted_at`, `created_by`, `updated_by`.
3. Skip relation fields that are back-references (`hasMany`, `manyToMany`). Only `link` (belongsTo) fields are included.
4. Order columns by model field definition order.

### Default column props per field type

| Field type    | Width | Align  | Editable | Sortable | Filterable |
| ------------- | ----- | ------ | -------- | -------- | ---------- |
| `string`      | 180   | left   | yes      | yes      | yes        |
| `text`        | 250   | left   | yes      | no       | no         |
| `int`         | 100   | right  | yes      | yes      | yes        |
| `decimal`     | 120   | right  | yes      | yes      | yes        |
| `money`       | 130   | right  | yes      | yes      | yes        |
| `boolean`     | 90    | center | yes      | no       | yes        |
| `date`        | 120   | left   | yes      | yes      | yes        |
| `datetime`    | 160   | left   | yes      | yes      | yes        |
| `enum`        | 130   | left   | yes      | yes      | yes        |
| `link`        | 180   | left   | yes      | no       | yes        |
| `sequence`    | 100   | left   | no       | yes      | no         |
| `computed`    | 150   | left   | no       | yes      | no         |
| `json`        | 200   | left   | no       | no       | no         |
| `code`        | 200   | left   | no       | no       | no         |
| `attachment`  | 150   | left   | no       | no       | no         |
| `attachments` | 150   | left   | no       | no       | no         |

### Behavior

- Label defaults to the field's `label` from metadata, falling back to the field name in title case.
- `readOnly` fields from metadata are never editable regardless of the defaults above.
- The grid-level `editable: false` overrides all auto-derived editable flags.
- Once the user defines even one `column` child, auto-columns are completely disabled. No mixing.

---

## 5. Data source

The datagrid uses `useModelQuery` identically to the table widget.

### Smart mode

When `source.model` and `props.pageSize` are both present the datagrid fetches data server-side.

```
source: { model: 'sales.order' }
props: { pageSize: 50 }
→ useModelQuery({ model: 'sales.order', pageSize: 50, staticFilters: source.filters })
```

The hook reads reactive variables from the page state store:

- `$filter.{model}.*` for filters
- `$sort.{model}` for sort order
- `$page.{model}` for current page
- `$search.{model}` for search text

### Static mode

When `pageSize` is absent the datagrid renders records passed from parent context (`ctx.records`). No server fetching. No pagination. No toolbar.

### Static filters

`source.filters` passes additional server-side filters that are always applied:

```typescript
source: { model: 'sales.order', filters: { status: 'active' } }
```

---

## 6. Inline editing

### Cell editing lifecycle

```
idle → double-click or Enter or F2 → editing → blur or Enter → saving → idle
                                    → Escape → idle (revert)
                                    → saving fails → editing (show error)
```

### Editor selection

The datagrid selects an inline editor based on the field's type from model metadata.

| Field type | Editor          | Behavior                                                 |
| ---------- | --------------- | -------------------------------------------------------- |
| `string`   | Text input      | Single line. Commit on Enter/blur.                       |
| `text`     | Text input      | Single line in cell. Expandable on focus (grows height). |
| `int`      | Number input    | Integer only. Step buttons optional.                     |
| `decimal`  | Number input    | Allows decimals.                                         |
| `boolean`  | Checkbox        | Toggles immediately on click. No edit mode needed.       |
| `date`     | Date picker     | Popover calendar anchored to cell.                       |
| `datetime` | Datetime picker | Popover with date + time (12-hour AM/PM).                |
| `enum`     | Select dropdown | Popover with options list.                               |
| `link`     | Combobox        | Search-as-you-type relation picker.                      |
| `money`    | Money input     | Number with currency formatting.                         |
| `json`     | Read-only       | Not editable inline.                                     |
| `code`     | Read-only       | Not editable inline.                                     |
| `computed` | Read-only       | Never editable.                                          |
| `sequence` | Read-only       | Auto-generated. Never editable.                          |

### Editor interface

All editors share a common interface:

```typescript
interface CellEditorProps {
  value: unknown;
  onChange: (value: unknown) => void;
  onCommit: () => void;
  onCancel: () => void;
  fieldMeta: FieldMeta;
  autoFocus: boolean;
}
```

### Save behavior

On commit the datagrid calls `useMutation().update(rowId, { [field]: newValue })`.

Optimistic update: the cached query data is immediately patched via `queryClient.setQueryData`. If the server rejects the mutation the cell reverts to its previous value and shows an error toast.

The `on.cellChange` trigger fires after a successful save:

```typescript
on.cellChange?.({ field: 'customer', value: 'Acme Corp', previousValue: 'Acme', row: { id: '123', ... } })
```

### Editable conditions

A cell is editable when all of these are true:

- Grid-level `props.editable` is true (or absent, which defaults true)
- Column-level `props.editable` is not explicitly false
- The field type has an editor (not json, code, computed, or sequence)
- The field's `readOnly` metadata is not true

---

## 7. Column resizing

Column borders are draggable. On drag the column width updates in real-time. The resize uses TanStack Table's built-in column resize API.

Visual indicator: a 2px vertical line appears on hover over the column border. During drag the line is highlighted.

Minimum width enforced by `column.props.minWidth` (default 80px). Maximum by `column.props.maxWidth` (no default).

Column widths are stored in component state. They do not persist across page navigation. Future iteration may persist to user preferences.

---

## 8. Column reordering

When `props.reorderable` is true, column headers support drag-and-drop reordering.

Behavior:

- Grab a header cell to start dragging
- A ghost of the header follows the cursor
- A vertical drop indicator shows between columns
- Drop reorders the column array

Implementation uses HTML5 drag events on the header cells. TanStack Table's `columnOrder` state tracks the order.

Frozen columns cannot be reordered. Non-frozen columns cannot be moved before frozen columns.

---

## 9. Sorting

Clicking a sortable column header cycles through: ascending, descending, none.

The datagrid writes to `$sort.{model}` in the page state store. This triggers `useModelQuery` to refetch with the new sort parameter.

Sort indicators: chevron-up for ascending, chevron-down for descending. Same icons as the table widget.

When sort changes the page resets to 1.

---

## 10. Filtering

The datagrid toolbar includes a filter button that opens a filter popover. The filter UI and operators are identical to the table widget's filter system.

Filters write to `$filter.{model}.{field}` and `$filter.{model}.{field}__{operator}` in the page state store.

Active filters display as dismissible badges below the toolbar.

The datagrid reuses the filter operator helpers from `table/filter-operators.ts`.

---

## 11. Search

When the model has searchable fields the toolbar shows a search input. Typing writes to `$search.{model}` with a 300ms debounce. This triggers a server-side search via `useModelQuery`.

---

## 12. Pagination

The footer shows pagination controls when in smart mode:

- "Showing X-Y of Z" text
- Previous/Next page buttons
- Page number indicator

Page changes write to `$page.{model}` in the page state store.

The `on.pageChange` trigger fires on page change.

---

## 13. Row selection

When `props.selectable` is true:

- A checkbox column appears as the first column
- Click a checkbox to toggle that row's selection
- Shift+click selects a range from the last selected row
- Ctrl/Cmd+click toggles individual rows without affecting others
- Header checkbox toggles select-all for the current page

Selected row state is local to the component. It resets on page change or data refresh.

The `on.rowSelect` trigger fires when selection changes:

```typescript
on.rowSelect?.({ selectedRows: [{ id: '123', ... }, { id: '456', ... }] })
```

---

## 14. Row creation

When `props.addRow` is true the footer shows an "Add row" button.

On click:

1. Call `useMutation().create({})` to create an empty record
2. On success, refetch the current page
3. Scroll to the new row (if on current page)
4. Enter edit mode on the first editable cell of the new row
5. Fire `on.rowCreate?.({ row: newRecord })`

The new row appears at the end of the current sort order. If the user has a sort applied the row may not appear on the current page. In that case the grid navigates to the page containing the new row.

---

## 15. Row deletion

When rows are selected the toolbar shows a delete button.

On click:

1. Show confirmation (number of rows to delete)
2. Call `useMutation().remove(id)` for each selected row
3. Optimistic removal from the displayed list
4. Fire `on.rowDelete?.({ rows: deletedRows })`
5. Clear selection state

---

## 16. Keyboard navigation

The grid container is focusable. One cell is always the "active cell" (highlighted with a focus ring).

| Key                | Context                  | Action                                                |
| ------------------ | ------------------------ | ----------------------------------------------------- |
| Arrow Up           | Not editing              | Move active cell up one row                           |
| Arrow Down         | Not editing              | Move active cell down one row                         |
| Arrow Left         | Not editing              | Move active cell left one column                      |
| Arrow Right        | Not editing              | Move active cell right one column                     |
| Tab                | Not editing              | Move active cell right. Wrap to next row at end.      |
| Shift+Tab          | Not editing              | Move active cell left. Wrap to previous row at start. |
| Enter              | Not editing              | Enter edit mode on active cell                        |
| Enter              | Editing                  | Commit edit, move active cell down                    |
| F2                 | Not editing              | Enter edit mode on active cell                        |
| Escape             | Editing                  | Cancel edit, revert value                             |
| Escape             | Not editing              | Clear selection                                       |
| Delete / Backspace | Not editing              | Clear active cell value (if editable)                 |
| Space              | Not editing, on checkbox | Toggle row selection                                  |
| Ctrl+C / Cmd+C     | Not editing              | Copy active cell value to clipboard                   |
| Ctrl+A / Cmd+A     | Not editing              | Select all rows                                       |
| Home               | Not editing              | Move to first cell in row                             |
| End                | Not editing              | Move to last cell in row                              |
| Ctrl+Home          | Not editing              | Move to first cell in grid (top-left)                 |
| Ctrl+End           | Not editing              | Move to last cell in grid (bottom-right)              |

When editing, arrow keys are captured by the editor input. Only Enter, Escape, and Tab exit editing.

---

## 17. Clipboard

Ctrl+C copies the active cell's display value as plain text to the clipboard via `navigator.clipboard.writeText()`.

Future iteration may support multi-cell copy and paste.

---

## 18. Column visibility

The toolbar includes a columns dropdown button. It lists all columns with checkboxes. Unchecking a column hides it from the grid.

Column visibility is local component state. It does not persist across navigation.

At least one column must remain visible. The last visible column cannot be hidden.

---

## 19. Triggers

| Trigger      | Fires when                    | Payload                                |
| ------------ | ----------------------------- | -------------------------------------- |
| `cellChange` | Cell value saved successfully | `{ field, value, previousValue, row }` |
| `rowSelect`  | Row selection changes         | `{ selectedRows }`                     |
| `rowCreate`  | New row created               | `{ row }`                              |
| `rowDelete`  | Rows deleted                  | `{ rows }`                             |
| `pageChange` | Page navigation               | page number                            |

---

## 20. Accessibility

The grid follows the WAI-ARIA Grid pattern.

| Element        | Role           | ARIA attributes                                          |
| -------------- | -------------- | -------------------------------------------------------- |
| Grid container | `grid`         | `aria-label`, `aria-rowcount`, `aria-colcount`           |
| Header row     | `row`          | —                                                        |
| Header cell    | `columnheader` | `aria-sort` (ascending/descending/none), `aria-colindex` |
| Body row       | `row`          | `aria-rowindex`, `aria-selected`                         |
| Body cell      | `gridcell`     | `aria-colindex`, `aria-readonly`                         |
| Checkbox cell  | `gridcell`     | `aria-checked`                                           |

Focus management uses `aria-activedescendant` on the grid container. The active cell has `tabindex="0"`. All other cells have `tabindex="-1"`.

Screen reader announcements:

- On cell focus: "[column label], [value], row [n] of [total]"
- On sort change: "Sorted by [column], [direction]"
- On edit start: "Editing [column label]"
- On save: "Saved"
- On error: "Error: [message]"

---

## 21. Virtual scrolling

The grid uses row virtualization. Only visible rows plus a configurable overscan (default 5 rows above and below) are rendered in the DOM.

The scroll container has a fixed height determined by `min(pageSize * rowHeight, viewportHeight)`. When all rows fit within the viewport no scrollbar appears.

Row positioning uses CSS transforms (`translateY`) for smooth scrolling without layout recalculation.

Column virtualization is not implemented in the initial version. Typical grids have fewer than 30 columns which renders efficiently without virtualization.

---

## 22. Frozen columns

Columns with `props.frozen: true` pin to the left edge during horizontal scroll. They render in a separate container that does not scroll horizontally.

Frozen columns:

- Always appear first (leftmost)
- Have a right border shadow to visually separate from scrollable columns
- Cannot be reordered
- The selection checkbox column (if enabled) is always frozen

---

## 23. Error handling

### Cell save failure

If a cell mutation fails:

1. Revert the optimistic update
2. Show the cell with a red border
3. Show error as a tooltip on the cell
4. The cell remains in edit mode with the rejected value
5. User can fix and retry or press Escape to revert

### Network failure

If the data fetch fails the grid shows an error state with a retry button. Same pattern as the table widget's error handling.

### Validation

Client-side validation runs before sending the mutation:

- Required fields cannot be cleared
- Numeric fields reject non-numeric input
- Enum fields only accept valid options

If validation fails the editor shows inline feedback and does not commit.

---

## 24. Loading states

| State        | Display                                                   |
| ------------ | --------------------------------------------------------- |
| Initial load | Skeleton rows matching `pageSize` count                   |
| Page change  | Previous data dimmed (opacity 50%), skeleton overlay      |
| Cell saving  | Cell shows a subtle loading indicator (spinner in corner) |
| Row creating | Footer button shows loading state                         |
| Row deleting | Selected rows dim before removal                          |

---

## 25. Relationship with table widget

The table and datagrid widgets serve different use cases:

| Aspect                | Table                                  | Datagrid                |
| --------------------- | -------------------------------------- | ----------------------- |
| Primary use           | Read-only data display                 | Editable spreadsheet    |
| Rendering             | Native `<table>` HTML                  | Div-based with CSS Grid |
| Virtual scrolling     | No                                     | Yes                     |
| Inline editing        | No                                     | Yes                     |
| Column resizing       | No                                     | Yes                     |
| Column reordering     | No                                     | Yes                     |
| Keyboard navigation   | No                                     | Yes (full spreadsheet)  |
| Row creation/deletion | No                                     | Yes                     |
| Data source           | `useModelQuery`                        | `useModelQuery` (same)  |
| Reactive variables    | `$sort`, `$filter`, `$page`, `$search` | Same                    |
| Column definition     | `column` child widgets                 | Same                    |

Use the table widget for simple read-only lists with row-click navigation. Use the datagrid when users need to edit data inline, manage rows, or work with large datasets.

---

## 26. Implementation dependencies

```
@tanstack/react-table    — headless table logic (column resize, row selection, column ordering, column visibility)
@tanstack/react-virtual  — row virtualization
```

Both are in the TanStack ecosystem already used by the project (Query, Router).

---

## 27. Widget meta

```typescript
DatagridWidget.widgetMeta = {
  name: 'datagrid',
  label: 'Datagrid',
  category: 'data',
  schema: {
    pageSize: { type: 'number' },
    rowHeight: { type: 'enum', options: ['compact', 'default', 'comfortable'] },
    editable: { type: 'boolean' },
    resizable: { type: 'boolean' },
    reorderable: { type: 'boolean' },
    selectable: { type: 'boolean' },
    addRow: { type: 'boolean' },
    variant: { type: 'enum', options: ['card', 'flat'] },
    emptyText: { type: 'string' },
  },
  binding: 'none',
  triggers: ['cellChange', 'rowSelect', 'rowCreate', 'rowDelete', 'pageChange'],
  container: true,
  accepts: ['column'],
};
```

---

## 28. What is NOT in scope (future iteration)

- Multi-cell copy/paste (paste from spreadsheet)
- Formula columns (computed from other columns client-side)
- Row grouping and subtotals
- Column aggregation (sum, avg, count in footer)
- Undo/redo stack for cell edits
- Collaborative editing (real-time multi-user)
- Export to CSV/Excel
- Conditional cell formatting (color based on value)
- Cell comments/notes
- Row expand/detail panel
- Persisted column widths and order (user preferences)
