# Record mode spec

> **Planned** — not yet implemented.

Forms with an existing record render fields as inline click-to-edit rows that save independently on blur. A new `widget.field()` widget type handles this rendering. Traditional form widgets (`widget.input()`, `widget.select()`, etc.) remain unchanged and are used for create forms with batch submit.

## Problem

The current edit page uses a global `$state.editing` toggle that switches all fields between view and edit simultaneously. This creates two problems:

1. Layout shift. View mode shows compact `label | value` rows. Edit mode shows full-width inputs with labels above. Switching between them is visually jarring.
2. Unnecessary friction. To change one field the user must enter edit mode for the entire form, make the change, then save all fields.

Business app users spend most of their time reviewing records and making small corrections. The interface should optimize for that.

## Solution

Introduce `widget.field()` as a new widget type for inline per-field editing. It is schema-driven, infers everything from the model definition, and only works inside a `widget.form()` that has an `id` binding.

App developers choose the rendering style by choosing the widget:

| Widget                                    | Use case     | Rendering                                  | Save behavior           |
| ----------------------------------------- | ------------ | ------------------------------------------ | ----------------------- |
| `widget.input()`, `widget.select()`, etc. | Create forms | Traditional form (label above input)       | Batch submit            |
| `widget.field()`                          | Record pages | Compact row (label + value), click to edit | Per-field PATCH on blur |

---

## 1. Widget API

### `widget.field(fieldName, options?)`

```typescript
widget.field('name');
widget.field('name', { label: 'Full Name' });
```

**Parameters:**

| Parameter       | Type     | Description                                                                      |
| --------------- | -------- | -------------------------------------------------------------------------------- |
| `fieldName`     | `string` | Field name on the bound model. Used to resolve type, label, options from schema. |
| `options.label` | `string` | Override the label from model schema.                                            |

**Returns:** `WidgetNode` with `type: 'field'` and `bind: { field: fieldName }`.

**Constraints:**

- Only valid inside `widget.form('model', { id: ... }, [...])`. Boot validation emits an error otherwise.
- Infers field type, label, and options from the model schema at runtime.
- Layout is managed by parent containers (`widget.grid()`, `widget.section()`).

### Record page example

```typescript
definePage({
  key: 'crm.contact.detail',
  widgets: [
    widget.form('crm.contact', { id: '$route.id' }, [
      widget.grid(2, [
        widget.field('name'),
        widget.field('email'),
        widget.field('phone'),
        widget.field('status'),
      ]),
      widget.section('Address', [
        widget.field('street'),
        widget.field('city'),
        widget.field('country'),
      ]),
    ]),
  ],
});
```

### Create page example (unchanged)

```typescript
definePage({
  key: 'crm.contact.new',
  widgets: [
    widget.form('crm.contact', [
      widget.input('name'),
      widget.input('email'),
      widget.select('status'),
      widget.button('Create', { action: action.submit() }),
    ]),
  ],
});
```

### Drawer peek example

```typescript
widget.drawer(
  {
    title: 'Contact',
    width: 'md',
    visible: { field: '$state.selectedId', operator: 'neq', value: null },
    on: { close: action.setValue('$state.selectedId', null) },
  },
  [
    widget.form('crm.contact', { id: '$state.selectedId' }, [
      widget.field('name'),
      widget.field('email'),
      widget.field('status'),
      widget.group({ direction: 'row', gap: 'sm', justify: 'end' }, [
        widget.button('Open', {
          variant: 'ghost',
          icon: 'external-link',
          on: { click: action.navigate('/crm/contacts/{{id}}') },
        }),
      ]),
    ]),
  ],
);
```

---

## 2. Boot validation

At boot time, page validation rejects `widget.field()` inside a form without an `id` binding.

**Error message:**

```
Page "crm.contact.new": widget.field('name') requires a form with an id binding.
Use widget.input('name') for create forms.
```

**Validation rule:** Walk the widget tree. For each node with `type: 'field'`, find the nearest ancestor with `type: 'form'`. Emit a boot error if:

- No `form` ancestor exists (field used outside any form)
- The `form` ancestor has no `id` in its binding (form is for creating, not editing)

---

## 3. Mode derivation (internal)

FormProvider derives mode from the `id` binding:

```typescript
function deriveMode(modeProp: string | undefined, id: unknown): 'create' | 'record' {
  if (!id) return 'create';
  if (modeProp === 'create') return 'create';
  return 'record';
}
```

Mode is internal to FormProvider. Widgets do not branch on it. It controls:

- Whether FormProvider fetches the record on mount
- Whether `saveField` is available on FormContext
- HTTP method for saves (POST for create, PUT for record)

For backward compatibility, `mode: 'edit'` and `mode: 'view'` props both map to `'record'`.

---

## 4. FieldWidget component

A single component in the UI layer that resolves the correct inline editor based on field type from `bind.meta`. Delegates rendering to focused editor sub-components.

### File structure

```
packages/ui/src/widgets/field/
├── field-widget.tsx          — main component, dispatches by field type
├── text-editor.tsx           — string, int, decimal, money (inline input)
├── select-editor.tsx         — enum (Listbox popover)
├── date-editor.tsx           — date (DatePicker popover)
├── datetime-editor.tsx       — datetime (DatePicker + time popover)
├── checkbox-editor.tsx       — boolean (direct toggle, no edit state)
├── link-editor.tsx           — link/relation (Listbox with search)
└── index.ts                  — exports FieldWidget

packages/ui/src/primitives/inline-field.tsx — shared display row (icon + label + value + pencil)
```

Each editor is a focused component that handles its own editing state, save trigger, and error display. The main `FieldWidget` resolves the field type and renders the appropriate editor.

### Component signature

Follows the standard widget component pattern:

```typescript
export function FieldWidget({ props, bind, on, context }: WidgetComponentProps) {
  // Resolve editor by bind.meta.type
}

FieldWidget.displayName = 'FieldWidget';
```

Registered in `packages/ui/src/widgets/index.ts`:

```typescript
import { FieldWidget } from './field';

export const widgetComponents: WidgetRegistry = {
  // ...existing
  field: FieldWidget,
};
```

### Reused base components

Editors reuse existing primitives and form components. No new UI primitives needed.

| Component         | Used by                                                 | Import from                   |
| ----------------- | ------------------------------------------------------- | ----------------------------- |
| `Input`           | text-editor (inline input)                              | `../../primitives/input`      |
| `Badge`           | inline-field (enum value)                               | `../../primitives/badge`      |
| `Icon`            | inline-field (field type icon, pencil)                  | `../../primitives/icon`       |
| `Listbox`         | select-editor, link-editor (popover dropdown)           | `../../form/listbox`          |
| `DatePicker`      | date-editor, datetime-editor (calendar popover)         | `../../form/date-picker`      |
| `useClickOutside` | select-editor, link-editor, date-editor (close popover) | `../../lib/use-click-outside` |
| `cn`              | all (class merging)                                     | `../../lib/cn`                |

### Rendering

Each field renders as a fixed-height row (36px):

```
┌──────────────────────────────────────────┐
│ [icon] Label          Formatted Value    │
└──────────────────────────────────────────┘
```

- Label area: fixed 140px, field type icon + label text
- Value area: flex-1, formatted value
- Hover: subtle background + pencil icon on right
- Click: opens the editor for that field type

Row container styling follows established conventions:

```typescript
cn(
  'group relative flex items-center gap-3 px-3 rounded-md transition-all h-[36px]',
  !readOnly && !editing && 'hover:bg-accent/50 cursor-pointer',
  editing && 'bg-accent ring-1 ring-border',
);
```

All text uses the `text-2xs` token (13px). Number values use `tabular-nums` for alignment.

### Editor resolution by field type

| Field type        | Editor component            | Placement              | Save trigger                         |
| ----------------- | --------------------------- | ---------------------- | ------------------------------------ |
| `string`          | text-editor                 | In-row                 | Blur or Enter                        |
| `int` / `decimal` | text-editor                 | In-row                 | Blur or Enter                        |
| `money`           | text-editor (with $ prefix) | In-row                 | Blur or Enter                        |
| `enum`            | select-editor               | Popover below row      | Option selection or click-outside    |
| `date`            | date-editor                 | Popover below row      | Date selection or click-outside      |
| `datetime`        | datetime-editor             | Popover below row      | Date+time selection or click-outside |
| `boolean`         | checkbox-editor             | In-row (no edit state) | Direct click                         |
| `link`            | link-editor                 | Popover below row      | Option selection or click-outside    |
| `text` (textarea) | text-editor                 | In-row                 | Blur or Enter                        |

Inline editors render inside the 36px row without changing height. Popover editors float absolutely below the row using `useClickOutside` to handle dismissal.

### Display formatting

| Field type | Format                           | Empty state             |
| ---------- | -------------------------------- | ----------------------- |
| `string`   | Plain text                       | "Empty" (italic, muted) |
| `int`      | Locale integer separators        | "Empty"                 |
| `decimal`  | 2 decimal places                 | "Empty"                 |
| `money`    | Currency formatted (`$1,234.56`) | "Empty"                 |
| `enum`     | Badge with option label          | "Empty"                 |
| `date`     | `Jun 30, 2026`                   | "Empty"                 |
| `datetime` | `Jun 30, 2026 3:45 PM`           | "Empty"                 |
| `boolean`  | Checkbox (always interactive)    | Unchecked               |
| `link`     | Record display name              | "Empty"                 |
| `text`     | Single-line truncated            | "Empty"                 |

### Read-only fields

Fields where `bind.meta.readOnly === true` render in display mode without click-to-edit. No hover highlight, no cursor change, no pencil icon.

---

## 5. Per-field save lifecycle

### State machine

```
DISPLAY → (click) → EDITING → (blur/Enter) → SAVING → (success) → DISPLAY
                            → (Escape)     → DISPLAY (revert)
                                           → (error)  → EDITING (show error)
```

### Behavior

1. **Click**: Transitions to editing. Current value populates editor. Focus moves to input.
2. **Save trigger**: Depends on editor type (see below). Shows saving indicator (opacity fade, 600ms).
3. **Escape**: Reverts to original value. Returns to display.
4. **Error**: Stays in editing mode. Shows validation error below the row.
5. **No change**: If value is unchanged on save trigger, exits editing without saving.
6. **Concurrent**: Multiple fields can edit simultaneously. Each saves independently.

### Save triggers by editor type

| Editor type                            | Save triggers                                             |
| -------------------------------------- | --------------------------------------------------------- |
| Inline (text, number, money, textarea) | Blur or Enter                                             |
| Popover (select, date, datetime, link) | Option selection or click-outside (via `useClickOutside`) |
| Toggle (checkbox)                      | Direct click (no editing state, saves immediately)        |

Popover editors use `useClickOutside` on the popover container. Clicking outside dismisses the popover and saves if the value changed. Selecting an option saves immediately and closes the popover.

### API call

```
PUT /api/{module}/{model}/{id}
Body: { "field_name": "new_value" }
```

Only the changed field is sent. Server runs hooks (validate, beforeSave, afterSave) for the single-field update.

### Optimistic update

Display value updates immediately on blur. If the server rejects, the field reverts and shows the error.

---

## 6. FormProvider changes

FormContext gains a `saveField` method (internal, not public API for app developers):

```typescript
interface FormContextValue {
  mode: 'create' | 'record';
  saveField: (field: string, value: unknown) => Promise<void>;
  // ... existing fields unchanged
}
```

The `saveField` method:

- Updates local form values optimistically
- Sends `PUT /api/{module}/{model}/{id}` with the single field
- On success: invalidates the model query
- On error: reverts value, sets field-level error

WidgetRenderer injects `on.saveField` for field widgets when inside a FormContext with mode `'record'`.

---

## 7. CRUD page generator changes

### List page

The drawer changes from `widget.data` to `widget.form` with `widget.field()` children:

```typescript
// Before
widget.data(model.qualifiedName, { id: '$state.selectedId' }, [...displayFields]);

// After
widget.form(model.qualifiedName, { id: '$state.selectedId' }, [
  ...fields.map((f) => widget.field(f.name)),
]);
```

### Create page

No change. Uses `widget.input()` fields with batch submit.

### Edit page (becomes record page)

Drops edit/cancel/save buttons. Uses `widget.field()` instead of `widget.input()`:

```typescript
// Before
actions: [
  { label: 'Edit', action: action.setValue('$state.editing', true) },
  { label: 'Cancel', action: action.sequence([action.reset(), action.setValue('$state.editing', false)]) },
  { label: 'Save', action: action.submit() },
],
widgets: [widget.form(model, { id: '$route.id', mode: '$state.editing' }, [
  widget.input('name'),
  widget.input('email'),
])]

// After
actions: [
  { label: 'Back', icon: 'arrow-left', variant: 'ghost', action: action.navigate(basePath) },
],
widgets: [widget.form(model, { id: '$route.id' }, [
  widget.grid(2, fields.map(f => widget.field(f.name))),
])]
```

### Record page header

Generated record pages include a header with:

- **Title**: the model's naming field value (e.g., "Acme Corp")
- **Subtitle**: sequence field value if the model has one (e.g., "ORD-00142")

---

## 8. Permissions integration

Field-level permissions:

| Permission   | Behavior                                  |
| ------------ | ----------------------------------------- |
| Read + Write | Normal click-to-edit                      |
| Read only    | Display value, no hover, no click-to-edit |
| No read      | Field hidden entirely                     |

Model-level permissions:

| Permission          | Behavior                    |
| ------------------- | --------------------------- |
| Can update model    | Fields are click-to-edit    |
| Cannot update model | All fields render read-only |

---

## 9. Comparison with `widget.column()`

`widget.field()` follows the same pattern as `widget.column()` for tables:

| Aspect           | `widget.column()`                 | `widget.field()`               |
| ---------------- | --------------------------------- | ------------------------------ |
| Context          | Inside `widget.table()`           | Inside `widget.form({ id })`   |
| Schema inference | Type, label, formatter from model | Type, label, editor from model |
| Override         | `{ label, width, sortable }`      | `{ label }`                    |
| Rendering        | Table cell with formatted value   | 36px row with formatted value  |
| Editing          | Datagrid cell edit (if enabled)   | Click-to-edit inline           |

---

## 10. What input widgets do NOT change

`widget.input()`, `widget.select()`, `widget.datepicker()`, `widget.money()`, `widget.checkbox()`, `widget.textarea()`, and `widget.link()` always render as traditional form inputs. They do not branch on `context.mode`. They are for create forms with batch submit.

If a form has `widget.input()` fields and an `id` binding, those fields still render as normal inputs and require explicit submit. This supports complex forms (invoices, orders with line items) that need cross-field validation and batch save.

---

## 11. Implementation scope

### packages/shared

- Add `widget.field()` helper to `packages/shared/src/widget.ts`
- Add `fieldPropsSchema` to `packages/shared/src/validation/schemas/widget-props/input-widgets.ts`
- Register `'field'` in `BuiltinWidgetType` via the props schema map in `widget-props/index.ts`

### packages/core

- Add boot validation in page validator: reject `widget.field()` inside form without `id`
- Update CRUD page generator to use `widget.field()` for record/drawer pages

### packages/client

- FormProvider: mode derivation (internal, `'create' | 'record'`)
- FormProvider: `saveField` method on FormContext
- WidgetRenderer: inject `on.saveField` for field widgets when in record mode

### packages/ui

New directory `packages/ui/src/widgets/field/` with structure:

```
field/
├── field-widget.tsx        — main component, type dispatch
├── text-editor.tsx         — string, int, decimal, money
├── select-editor.tsx       — enum (uses Listbox)
├── date-editor.tsx         — date (uses DatePicker)
├── datetime-editor.tsx     — datetime
├── checkbox-editor.tsx     — boolean
├── link-editor.tsx         — link/relation (uses Listbox with search)
└── index.ts                — exports FieldWidget

primitives/inline-field.tsx — shared display row (extracted primitive)
```

Register in `packages/ui/src/widgets/index.ts`:

```typescript
import { FieldWidget } from './field';

export const widgetComponents: WidgetRegistry = {
  // ...existing
  field: FieldWidget,
};
```

No changes to existing input widget components in this phase. Existing record mode code is removed in Phase 4.

---

## 12. Implementation phases

### Phase 1: Foundation

- Add `widget.field()` to shared widget DSL
- Add `fieldPropsSchema` and register in widget type union
- Add boot validation (reject field without form id)
- FormProvider mode derivation and `saveField` method
- WidgetRenderer: inject `on.saveField` for field nodes

### Phase 2: FieldWidget component

- FieldWidget component in packages/ui
- Editor resolution by field type (string, int, decimal, money, enum, date, datetime, boolean, link, text)
- Display formatting for each type
- Click-to-edit state machine (display, editing, saving)
- Keyboard handling (Enter to save, Escape to cancel)
- Read-only field rendering
- Saving indicator (opacity fade)
- Error display below row

### Phase 3: CRUD generator

- Update `generateEditPage` to use `widget.field()`, drop mode toggle and action buttons
- Update `generateListPage` drawer to use `widget.form` with `widget.field()`
- Add record header (title from naming field, subtitle from sequence)
- Update generator tests

### Phase 4: Cleanup

- Remove `if (context.mode === 'record')` branches from all input widgets
- Remove `RecordFieldInput`, `RecordFieldSelect`, etc. internal components
- Remove storybook prototype (`packages/ui/stories/data/record-mode.stories.tsx`)
- Remove backward compat mode mapping in FormController (no longer needed)
- Build passes, tests pass

### Phase 5: Detail page layout

The record detail page uses a two-column grid layout. Left column contains inline fields grouped in card sections. Right column contains a tabbed card with activity, related records, and attachments.

```
┌────────────────────────────┬──────────────────────────────────┐
│ Record header              │ [Activity] [Related] [Attach]    │
│ ┌─ Basic Info ──────────┐  │                                  │
│ │ widget.field() rows   │  │  (tab content here)              │
│ └───────────────────────┘  │                                  │
│ ┌─ Details ─────────────┐  │                                  │
│ │ widget.field() rows   │  │                                  │
│ └───────────────────────┘  │                                  │
└────────────────────────────┴──────────────────────────────────┘
```

Implemented:

- `widget.tabs()` helper (maps children to tab panels by index)
- `TabsWidget` in UI package (chip-style active state)
- `ActivityFeed` primitive (change tracking, events, comments, system events, CommentInput)

Remaining:

- FormController providing widget context with fetched record (for `{{id}}` resolution in child widgets)
- Server-side activity/audit API endpoint
