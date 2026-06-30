# Record mode spec

The form widget gains a new rendering mode for existing records. Instead of a global view/edit toggle, each field renders as a read-only display and transitions to an inline editor on click. Fields save independently on blur.

No changes to the widget DSL or WidgetProps contract. The change is internal to the UI layer.

## Problem

The current edit page uses a global `$state.editing` toggle that switches all fields between view and edit simultaneously. This creates two problems:

1. Layout shift. View mode shows compact `label | value` rows. Edit mode shows full-width inputs with labels above. Switching between them is visually jarring.
2. Unnecessary friction. To change one field the user must enter edit mode for the entire form, make the change, then save all fields.

Business app users spend most of their time reviewing records and making small corrections. The interface should optimize for that.

## Solution

When a form has an `id` binding (existing record), input widgets render in record mode. When a form has no `id` (new record), input widgets render in create mode. The form already derives mode from `id` presence. The only change is how the UI layer responds to that mode.

| Mode     | When          | Rendering                                          | Save behavior          |
| -------- | ------------- | -------------------------------------------------- | ---------------------- |
| `create` | No record ID  | Traditional form (label above input, all editable) | Batch submit           |
| `record` | Has record ID | Per-field display (label \| value), click to edit  | Per-field save on blur |

---

## 1. No API changes

The widget DSL stays exactly the same. These page definitions work today and will work with record mode. No new props, no new widget types.

### Record mode (existing record)

```typescript
widget.form('sales.order', { id: '$route.id' }, [
  widget.section('General', [
    widget.grid({ columns: 2 }, [
      widget.input('customer_name'),
      widget.select('status'),
      widget.money('total'),
      widget.datepicker('due_date'),
    ]),
  ]),
]);
```

The form sees `id: '$route.id'` and passes `mode: 'record'` to children via context. Each input widget renders as `label | formatted value`. Clicking a field opens its editor. Blur or Enter saves. Escape cancels.

### Create mode (new record)

```typescript
widget.form(
  'sales.order',
  {
    on: { success: action.navigate('/sales/orders/{{id}}') },
  },
  [
    widget.section('General', [
      widget.grid({ columns: 2 }, [
        widget.input('customer_name'),
        widget.select('status'),
        widget.money('total'),
        widget.datepicker('due_date'),
      ]),
    ]),
    widget.button('Save', { variant: 'primary', on: { click: action.submit() } }),
  ],
);
```

No ID means create mode. All fields render as traditional inputs with labels above. Unchanged from today.

### Drawer peek (from list page)

```typescript
widget.drawer(
  {
    title: 'Order',
    width: 'md',
    visible: { field: '$state.selectedId', operator: 'neq', value: null },
    on: { close: action.setValue('$state.selectedId', null) },
  },
  [
    widget.form('sales.order', { id: '$state.selectedId' }, [
      widget.section('Overview', [
        widget.input('customer_name'),
        widget.select('status'),
        widget.money('total'),
      ]),
      widget.group({ direction: 'row', gap: 'sm', justify: 'end' }, [
        widget.button('Open', {
          variant: 'primary',
          icon: 'external-link',
          on: { click: action.navigate('/sales/orders/{{id}}') },
        }),
      ]),
    ]),
  ],
);
```

Same form widget. The drawer provides the container. Fields render in record mode because the form has an `id`.

---

## 2. Mode derivation

The FormProvider already derives mode:

```typescript
// Current (unchanged)
const mode = modeProp ?? (id ? 'edit' : 'create');
```

The change: rename `'edit'` to `'record'` internally. For backward compat, if someone passes `mode: 'edit'` or `mode: 'view'`, both map to `'record'`.

```typescript
// New derivation
const mode = deriveMode(modeProp, id);

function deriveMode(modeProp, id) {
  if (!id) return 'create';
  if (modeProp === 'create') return 'create';
  return 'record'; // 'edit', 'view', or undefined all become 'record'
}
```

The `mode` is exposed to child widgets via `FormContext.mode` (already exists). Input widgets read it to decide their render path.

---

## 3. Input widget rendering

Each input widget gains a conditional at the top of its render function. No new components, no new props, no new interfaces.

```typescript
// Example: InputWidget
export function InputWidget({ props, bind, on, context }: WidgetComponentProps) {
  // Record mode: render compact display with click-to-edit
  if (context.mode === 'record') {
    return <RecordFieldRender /* ... */ />;
  }

  // Create mode: render traditional input (existing code, unchanged)
  return (
    <Field>
      <Field.Label>{label}</Field.Label>
      <Input /* ... */ />
    </Field>
  );
}
```

The `RecordFieldRender` is an internal helper (not exported, not a widget). It handles the display/edit toggle for that specific field type.

### Record mode field layout

Each field renders as a fixed-height row (36px):

```
┌──────────────────────────────────────────┐
│ [icon] Label          Formatted Value    │
└──────────────────────────────────────────┘
```

- Label area: fixed 140px width, field type icon + label text
- Value area: flex-1, formatted value with font-medium
- Row height fixed at 36px. Editors that need more space (date picker, select dropdown) render as floating popovers below the row.
- Hover shows subtle background + pencil icon on the right
- Click opens the editor

### Editor types by field

| Widget                | Inline editor                     | Popover editor                  |
| --------------------- | --------------------------------- | ------------------------------- |
| `input` (string)      | Text input in-row                 | —                               |
| `input` (int/decimal) | Number input in-row               | —                               |
| `money`               | Number input with $ prefix in-row | —                               |
| `select` / enum       | —                                 | Dropdown list below row         |
| `datepicker`          | —                                 | Calendar below row              |
| `datetime`            | —                                 | Calendar + time input below row |
| `checkbox`            | Toggles directly on click         | —                               |
| `link`                | —                                 | Searchable dropdown below row   |
| `textarea`            | Text input in-row (single line)   | —                               |
| `json`                | —                                 | Code editor popover             |
| `code`                | —                                 | Code editor popover             |
| `attachment`          | —                                 | File picker popover             |

Inline editors render inside the 36px row without changing height. Popover editors float absolutely below the row.

### Display formatting by field type

| Field type | Display format                                    | Empty state             |
| ---------- | ------------------------------------------------- | ----------------------- |
| string     | Plain text                                        | "Empty" (italic, muted) |
| int        | Formatted integer with locale separators          | "Empty"                 |
| decimal    | Formatted with 2 decimal places                   | "Empty"                 |
| money      | Currency formatted (e.g., `$1,234.56`)            | "Empty"                 |
| enum       | Badge with option label                           | "Empty"                 |
| date       | Formatted date (e.g., `Jun 30, 2026`)             | "Empty"                 |
| datetime   | Formatted datetime (e.g., `Jun 30, 2026 3:45 PM`) | "Empty"                 |
| boolean    | Checkbox (always interactive)                     | Unchecked               |
| link       | Record display name in primary color              | "Empty"                 |
| textarea   | Single-line truncated text                        | "Empty"                 |

### Read-only fields

Fields where `bind.meta.readOnly === true` render in display mode without click-to-edit. No hover highlight, no cursor change, no pencil icon.

---

## 4. Per-field save lifecycle

Each field in record mode manages its own edit state independently.

### State machine

```
DISPLAY → (click) → EDITING → (blur/Enter) → SAVING → (success) → DISPLAY
                            → (Escape)     → DISPLAY (revert)
                                           → (error)  → EDITING (show error)
```

### Behavior

1. **Click**: Field transitions to editing. The current value populates the editor. Focus moves to the input.
2. **Blur or Enter**: Field submits a PATCH request with only the changed field. Shows a brief saving indicator (opacity fade).
3. **Escape**: Reverts to the original value. Returns to display mode.
4. **Error**: Field stays in editing mode. Shows validation error below the input.
5. **Concurrent edits**: Multiple fields can be in editing state simultaneously. Each saves independently.

### API call

Per-field save uses the same endpoint as datagrid cell edit:

```
PUT /api/{module}/{model}/{id}
Body: { "field_name": "new_value" }
```

Only the changed field is sent. The server runs hooks (validate, beforeSave, afterSave) for the single-field update.

### Optimistic update

The display value updates immediately on blur. If the server rejects the change, the field reverts to the previous value and shows the error.

---

## 5. FormProvider changes

### Internal changes only

The FormProvider interface does not change for app developers. Internally:

1. Mode derivation maps `'edit'` and `'view'` to `'record'` when `id` is present.
2. A new internal `saveField(field, value)` method on FormContext handles per-field PATCH.
3. Input widgets call `saveField` on blur in record mode instead of the batch `submit`.

```typescript
// Added to FormContextValue (internal, not public API)
interface FormContextValue {
  mode: 'create' | 'record';
  // ... existing fields unchanged
  saveField: (field: string, value: unknown) => Promise<void>;
}
```

The `saveField` method:

- Updates the local form values optimistically
- Calls `PUT /api/{module}/{model}/{id}` with the single field
- On success: value persists
- On error: reverts value, returns error string for the field

---

## 6. CRUD page generator changes

### List page

The drawer changes from `widget.data` to `widget.form`:

```typescript
// Before
widget.data(model.qualifiedName, { id: '$state.selectedId' }, [...peekFields]);

// After
widget.form(model.qualifiedName, { id: '$state.selectedId' }, [...peekFields]);
```

This makes drawer fields editable instead of just display-only.

### Create page

No change.

### Edit page (becomes record page)

Drops the edit/cancel/save buttons and the `mode` prop:

```typescript
// Before
actions: [
  { label: 'Edit', action: action.setValue('$state.editing', true) },
  { label: 'Cancel', action: action.sequence([action.reset(), action.setValue('$state.editing', false)]) },
  { label: 'Save', action: action.submit() },
],
widgets: [widget.form(model, { id: '$route.id', mode: '$state.editing' }, sections)]

// After
actions: [
  { label: 'Back', icon: 'arrow-left', variant: 'ghost', action: action.navigate(basePath) },
],
widgets: [widget.form(model, { id: '$route.id' }, sections)]
```

### Record page header

The generated page includes a record header showing:

- **Title**: the model's naming field value (e.g., "Acme Corp")
- **Subtitle**: sequence field value if the model has one (e.g., "ORD-00142")

No badge, no concatenated fields. The fields themselves are visible in the sections below.

---

## 7. Layout behavior

Layout widgets (`grid`, `section`, `group`, `stack`) are unchanged. They render the same structure regardless of mode. The difference is that input widgets inside them are shorter in record mode (36px fixed height vs ~64px with label above).

A `widget.grid({ columns: 2 })` in record mode creates a 2-column grid where each cell is a compact field row. In create mode the same grid creates a 2-column form with full inputs.

The section widget renders with a collapsible header. In record mode it acts as a visual group separator.

---

## 8. Permissions integration

Field-level permissions control editability in record mode:

| Permission   | Behavior                                  |
| ------------ | ----------------------------------------- |
| Read + Write | Normal click-to-edit                      |
| Read only    | Display value, no hover, no click-to-edit |
| No read      | Field hidden entirely                     |

Model-level permissions:

| Permission          | Behavior                       |
| ------------------- | ------------------------------ |
| Can update model    | Record mode with click-to-edit |
| Cannot update model | All fields render read-only    |

---

## 9. Backward compatibility

### No breaking API changes

The widget DSL does not change. Existing page definitions continue to work. The `mode` prop on forms still works:

- `mode: 'view'` → maps to `'record'` (fields are read-only but with record mode layout)
- `mode: 'edit'` → maps to `'record'` (fields are per-field editable)
- `mode: 'create'` → stays as create (traditional form)
- No `mode` prop + has `id` → `'record'`
- No `mode` prop + no `id` → `'create'`

### Batch submit opt-out

Forms that need all-or-nothing saves (cross-field validation) can pass `batch: true`:

```typescript
widget.form('sales.order', { id: '$route.id', batch: true }, [...])
```

This renders traditional form with all fields editable and requires explicit submit. Same as the old `mode: 'edit'` behavior.

---

## 10. Implementation scope

All changes are in two packages:

### packages/ui (UI layer)

- Each input widget file gains a record mode render path
- New internal helper for record field display/edit toggle
- No new exported components
- No new widget types

### packages/client (client layer)

- FormProvider: mode derivation change (`'edit'` → `'record'`)
- FormProvider: add internal `saveField` method
- FormController: pass derived mode to UI
- CRUD page generator: simplify edit page output

### packages/shared

- No changes. WidgetProps, WidgetNode, widget builders all unchanged.

---

## 11. Implementation phases

### Phase 1: Foundation

- FormProvider mode derivation (internal rename)
- Add `saveField` to FormContext
- InputWidget and SelectWidget gain record mode render path
- Wire click-to-edit state machine with proper editors

### Phase 2: All input widgets

- DatePickerWidget: calendar popover editor
- DateTimeWidget: calendar + time popover editor
- MoneyWidget: inline $ input editor
- LinkWidget: searchable dropdown popover editor
- CheckboxWidget: direct toggle (no editor state)
- TextareaWidget: inline text editor
- Remaining widgets (json, code, attachment): popover editors

### Phase 3: CRUD generator

- Update `generateEditPage` to drop mode toggle and action buttons
- Update `generateListPage` drawer to use `widget.form`
- Add record header generation (title from naming field, subtitle from sequence)
- Update tests

### Phase 4: Polish

- Saving indicator (opacity fade on the value)
- Keyboard navigation (Tab between fields)
- Handle concurrent saves gracefully
- Error display below the field row
