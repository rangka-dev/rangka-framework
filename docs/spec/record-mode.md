# Record mode spec

The form widget gains a new rendering mode for existing records. Instead of a global view/edit toggle, each field renders as a read-only display and transitions to an inline editor on click. Fields save independently on blur.

## Problem

The current edit page uses a global `$state.editing` toggle that switches all fields between view and edit simultaneously. This creates two problems:

1. Layout shift. View mode shows compact `label | value` rows. Edit mode shows full-width inputs with labels above. Switching between them is visually jarring.
2. Unnecessary friction. To change one field the user must enter edit mode for the entire form, make the change, then save all fields.

Business app users spend most of their time reviewing records and making small corrections. The interface should optimize for that.

## Solution

Replace the three form modes (`create | edit | view`) with two:

| Mode     | When          | Rendering                                          | Save behavior          |
| -------- | ------------- | -------------------------------------------------- | ---------------------- |
| `create` | No record ID  | Traditional form (label above input, all editable) | Batch submit           |
| `record` | Has record ID | Per-field display (label \| value), click to edit  | Per-field save on blur |

The form auto-detects mode from binding. If `bind.id` is present the form loads a record and renders in record mode. If absent it renders in create mode.

---

## 1. Public API

### Record mode (existing record)

```typescript
widget.form('sales.order', { id: '$route.id' }, [
  widget.grid({ columns: 2 }, [
    widget.input('customer_name'),
    widget.select('status'),
    widget.money('total'),
    widget.datepicker('due_date'),
  ]),
  widget.section('Line Items', [
    widget.datagrid('items', [
      widget.column('product_id'),
      widget.column('qty'),
      widget.column('rate'),
    ]),
  ]),
]);
```

No mode prop needed. The form sees `id: '$route.id'` and renders in record mode. Each field displays as `label | formatted value`. Clicking a field opens it for editing. Blur or Enter saves. Escape cancels.

### Create mode (new record)

```typescript
widget.form(
  'sales.order',
  {
    on: { success: action.navigate('/sales/orders/{{id}}') },
  },
  [
    widget.grid({ columns: 2 }, [
      widget.input('customer_name'),
      widget.select('status'),
      widget.money('total'),
      widget.datepicker('due_date'),
    ]),
    widget.button('Save', { variant: 'primary', on: { click: action.submit() } }),
  ],
);
```

No ID means create mode. All fields render as traditional inputs with labels above. A submit button triggers batch save.

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
        widget.grid({ columns: 2 }, [
          widget.input('customer_name'),
          widget.select('status'),
          widget.money('total'),
        ]),
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

Same form widget, same behavior. The drawer provides the container. Fields inside are per-field editable.

---

## 2. Mode derivation

```
bind.id present → record mode
bind.id absent  → create mode
```

The `mode` prop on FormProvider is removed from public API. Internal mode is derived from binding only. Permissions may further restrict: if the user lacks write permission on a field, that field stays read-only (no click-to-edit).

---

## 3. Input widget rendering

Every input widget gains two render paths. The widget checks `formContext.mode` to decide which path to use.

### Record mode render (default state)

```
┌──────────────────────────────────────────┐
│ Status           Active                  │  ← label | formatted value
└──────────────────────────────────────────┘
```

Clicking the value area transitions to editing:

```
┌──────────────────────────────────────────┐
│ Status           [Active ▾]              │  ← label | inline editor
└──────────────────────────────────────────┘
```

### Create mode render

```
┌──────────────────────────────────────────┐
│ Status                                   │
│ ┌──────────────────────────────────────┐ │
│ │ Active ▾                             │ │  ← label above, full-width input
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

### Display formatting by field type

| Widget            | Display format                                       | Editor              |
| ----------------- | ---------------------------------------------------- | ------------------- |
| `input` (string)  | Plain text, empty shows `—`                          | Text input          |
| `input` (int)     | Formatted integer                                    | Number input        |
| `input` (decimal) | Formatted decimal                                    | Number input        |
| `money`           | Currency formatted (e.g., `$1,234.56`)               | Money input         |
| `select` / enum   | Option label (not value)                             | Dropdown            |
| `datepicker`      | Formatted date (e.g., `Jun 30, 2026`)                | Date picker         |
| `datetime`        | Formatted datetime (e.g., `Jun 30, 2026 3:45 PM`)    | DateTime picker     |
| `checkbox`        | Toggle switch (always interactive, no click-to-edit) | Toggle              |
| `link`            | Related record display name                          | Link search/select  |
| `textarea`        | Truncated text, full on hover/click                  | Expandable textarea |
| `json`            | `{...}` indicator or key count                       | JSON editor         |
| `code`            | Truncated preview                                    | Code editor         |
| `attachment`      | Filename or thumbnail                                | File picker         |

### Empty state

Fields with no value display `—` (em dash character) in muted text. Clicking still opens the editor.

### Read-only fields

Fields where `bind.meta.readOnly === true` or the user lacks field-level write permission render in display mode without the click-to-edit affordance. No hover highlight, no cursor change.

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
2. **Blur or Enter**: Field submits a PATCH request with only the changed field. Shows a brief saving indicator.
3. **Escape**: Reverts to the original value. Returns to display mode.
4. **Error**: Field stays in editing mode. Shows validation error below the input.
5. **Concurrent edits**: Multiple fields can be in editing state simultaneously. Each saves independently.

### API call

Per-field save uses the same endpoint as datagrid cell edit:

```
PATCH /api/{module}/{model}/{id}
Body: { "field_name": "new_value" }
```

Only the changed field is sent. The server runs hooks (validate, beforeSave, afterSave) for the single-field update.

### Optimistic update

The display value updates immediately on blur. If the server rejects the change, the field reverts to the previous value and shows the error.

---

## 5. FormProvider changes

### Current interface

```typescript
interface FormProviderProps {
  model: string;
  id?: string | null;
  mode?: 'create' | 'edit' | 'view';
  onSuccess?: (record, mode) => void;
  onError?: (errors, message) => void;
  children: ReactNode;
}
```

### New interface

```typescript
interface FormProviderProps {
  model: string;
  id?: string | null;
  onSuccess?: (record) => void;
  onError?: (errors, message) => void;
  onFieldSave?: (field: string, value: unknown) => void;
  children: ReactNode;
}
```

Changes:

- `mode` prop removed. Derived from `id` presence.
- `onFieldSave` callback added for per-field save notifications.
- Internal mode is `'create' | 'record'`.

### FormContext changes

```typescript
interface FormContextValue {
  mode: 'create' | 'record';
  // ... existing fields (values, errors, touched, dirty, submitting)
  saveField: (field: string, value: unknown) => Promise<void>; // new
}
```

The `saveField` method handles the PATCH call, optimistic update, and error handling for a single field. Input widgets call this on blur instead of the batch `submit`.

---

## 6. CRUD page generator changes

### List page

No change. Already generates `widget.table` + `widget.drawer` with peek fields.

The drawer changes from using `widget.data` (view only) to `widget.form` (record mode, per-field editable):

```typescript
// Before
widget.data(model.qualifiedName, { id: '$state.selectedId' }, [...peekFields]);

// After
widget.form(model.qualifiedName, { id: '$state.selectedId' }, [...peekFields]);
```

### Create page

No change. Form with no ID renders in create mode as before.

### Edit page (becomes record page)

Simplifies significantly. Drops the edit/cancel/save buttons from page actions. Drops the `mode: '$state.editing'` prop.

```typescript
// Before
actions: [
  { label: 'Edit', visible: { field: '$state.editing', operator: 'neq', value: true }, action: action.setValue('$state.editing', true) },
  { label: 'Cancel', visible: { field: '$state.editing', operator: 'eq', value: true }, action: action.sequence([action.reset(), action.setValue('$state.editing', false)]) },
  { label: 'Save', visible: { field: '$state.editing', operator: 'eq', value: true }, action: action.submit() },
],
widgets: [widget.form(model, { id: '$route.id', mode: '$state.editing' }, sections)]

// After
actions: [
  { label: 'Back', icon: 'arrow-left', variant: 'ghost', action: action.navigate(basePath) },
],
widgets: [widget.form(model, { id: '$route.id' }, sections)]
```

---

## 7. Layout in record mode

Record mode fields render in a 2-column grid by default. Each row is one field with label on the left and value on the right.

```
┌─────────────────────────────────────────────────────┐
│ Customer Name      Acme Corp                        │
├─────────────────────────────────────────────────────┤
│ Status             Active                           │
├─────────────────────────────────────────────────────┤
│ Total              $12,500.00                       │
├─────────────────────────────────────────────────────┤
│ Due Date           Jun 30, 2026                     │
└─────────────────────────────────────────────────────┘
```

The label column takes fixed width (~40%). The value column fills remaining space. Rows have subtle bottom borders for visual separation.

This layout is determined by the Field component, not the grid widget. A `widget.grid({ columns: 2 })` wrapper in create mode gives a 2-column form. In record mode, each field internally renders as a `label | value` row regardless of grid configuration.

---

## 8. Sections in record mode

Section widgets render with a collapsible header. Fields inside render as per-field editable rows. The section title acts as a group label (like Twenty's General, Business, Contact groups).

```
┌─────────────────────────────────────────────────────┐
│ ▼ Overview                                          │
├─────────────────────────────────────────────────────┤
│ Customer Name      Acme Corp                        │
│ Status             Active                           │
│ Total              $12,500.00                       │
├─────────────────────────────────────────────────────┤
│ ▶ System (collapsed)                                │
└─────────────────────────────────────────────────────┘
```

---

## 9. Permissions integration

Field-level permissions control editability in record mode:

| Permission   | Behavior                                            |
| ------------ | --------------------------------------------------- |
| Read + Write | Normal click-to-edit                                |
| Read only    | Display value, no hover highlight, no click-to-edit |
| No read      | Field hidden entirely                               |

Model-level permissions:

| Permission          | Behavior                                                    |
| ------------------- | ----------------------------------------------------------- |
| Can update model    | Record mode with click-to-edit                              |
| Cannot update model | All fields render read-only (no click-to-edit on any field) |

---

## 10. Backward compatibility

### Breaking changes

- `mode` prop on `widget.form` is removed. Forms with `mode: 'view'` or `mode: '$state.editing'` need migration.
- The auto-generated edit page no longer has edit/cancel/save buttons.

### Migration path

- `widget.form(model, { id, mode: 'view' })` becomes `widget.form(model, { id })` (record mode is default for existing records).
- `widget.form(model, { id, mode: 'edit' })` becomes `widget.form(model, { id })` (same result, fields are always per-field editable).
- Custom pages with `$state.editing` toggle: remove the toggle and related actions. Record mode handles it.
- Forms that intentionally need batch submit for existing records (rare): add `batch: true` prop to opt out of per-field save.

### Opt-out for batch submit

Some forms need all-or-nothing saves (e.g., forms with cross-field validation where fields depend on each other). Add a `batch: true` prop:

```typescript
widget.form('sales.order', { id: '$route.id', batch: true }, [
  // Renders traditional form with all fields editable + Save button
]);
```

This renders like the old edit mode: all fields as inputs, requires explicit submit.

---

## 11. Implementation phases

### Phase 1: Record mode foundation

- Add `saveField` to FormProvider
- Add `mode: 'record'` derivation logic
- Add display render path to `InputWidget` and `SelectWidget`
- Wire click-to-edit state machine

### Phase 2: All input widgets

- Add display render path to remaining widgets (datepicker, datetime, money, link, textarea, checkbox, json, code, attachment)
- Add value formatting utilities per field type

### Phase 3: CRUD generator

- Update `generateEditPage` to drop mode toggle
- Update `generateListPage` drawer to use `widget.form` instead of `widget.data`
- Update tests

### Phase 4: Polish

- Add hover affordance on editable fields
- Add saving indicator (subtle spinner or checkmark)
- Add keyboard navigation (Tab between fields)
- Handle concurrent saves gracefully
