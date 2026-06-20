# Form widget spec

The form widget owns all mutation state for a record. It wraps children in a `FormProvider` and exposes a `FormContext` that `useBind` consumes transparently. Input widgets do not change. The form handles mode derivation, dirty tracking, validation, and submission.

## Principles

- The form is the single source of truth for field values. Child input widgets hold no local state.
- Mode is derived from binding. If `bind.id` is present the form loads a record (edit). If absent the form starts empty (create). If the user lacks write permission it renders as view (readonly).
- Dirty tracking diffs current values against the original snapshot. Only changed fields are sent on submit.
- Validation rules come from model metadata. No manual validation config in the page definition.
- The form renders no visible chrome. Layout, labels, and action buttons are explicit children.

---

## 1. Public API

### Create mode

```typescript
{
  type: 'form',
  bind: { model: { name: 'sales.order' } },
  on: {
    success: { type: 'navigate', path: '/sales/orders/{{record.id}}' },
  },
  children: [
    { type: 'input', bind: { field: 'customer_name' }, props: { label: 'Customer' } },
    { type: 'datepicker', bind: { field: 'order_date' }, props: { label: 'Order date' } },
    {
      type: 'group',
      props: { direction: 'row', align: 'end', gap: 'sm' },
      children: [
        { type: 'button', props: { label: 'Save', variant: 'primary' }, on: { click: { type: 'form.submit' } } },
      ],
    },
  ],
}
```

### Edit mode

```typescript
{
  type: 'form',
  bind: { model: { name: 'sales.order' }, id: '{{$route.id}}' },
  on: {
    success: { type: 'navigate', path: '/sales/orders/{{record.id}}' },
  },
  children: [
    {
      type: 'grid',
      props: { columns: 2 },
      children: [
        { type: 'input', bind: { field: 'customer_name' }, props: { label: 'Customer' } },
        { type: 'datepicker', bind: { field: 'order_date' }, props: { label: 'Date' } },
        { type: 'select', bind: { field: 'status' }, props: { label: 'Status' } },
      ],
    },
    {
      type: 'group',
      props: { direction: 'row', align: 'end', gap: 'sm' },
      children: [
        { type: 'button', props: { label: 'Reset' }, on: { click: { type: 'form.reset' } } },
        { type: 'button', props: { label: 'Save', variant: 'primary' }, on: { click: { type: 'form.submit' } } },
      ],
    },
  ],
}
```

### Binding

| Field   | Type   | Required | Description                                                        |
| ------- | ------ | -------- | ------------------------------------------------------------------ |
| `model` | object | yes      | `{ name: string }` — qualified model name (`module.model`)         |
| `id`    | string | no       | Record ID to load. Supports expressions. Absent means create mode. |

---

## 2. Mode derivation

| Condition                              | Mode     | Behavior                           |
| -------------------------------------- | -------- | ---------------------------------- |
| `bind.id` absent                       | `create` | Empty form. All fields editable.   |
| `bind.id` present                      | `edit`   | Fetch record. Track dirty state.   |
| `bind.id` present, no write permission | `view`   | Fetch record. All fields readonly. |

The form does not accept a `mode` prop. Mode is always derived.

---

## 3. FormContext

The form provides this context in the React tree. It is consumed by `useBind` internally. Widgets never interact with it directly.

```typescript
interface FormContext {
  mode: 'create' | 'edit' | 'view';
  values: Record<string, unknown>;
  errors: Record<string, string>;
  dirty: Set<string>;
  touched: Set<string>;
  submitting: boolean;

  // Field API (consumed by useBind)
  getValue(field: string): unknown;
  setValue(field: string, value: unknown): void;
  getError(field: string): string | undefined;
  getFieldMeta(field: string): FieldMeta | undefined;
  setTouched(field: string): void;

  // Form-level API (consumed by action dispatcher)
  submit(): Promise<void>;
  reset(): void;
  isDirty(): boolean;
}
```

### Design choices

- `values` is a flat record. Each key maps to a model column. No nested paths.
- `errors` is keyed by field name. One error string per field.
- `dirty` is derived by comparing `values[field]` against `original[field]`.
- `touched` tracks which fields the user has interacted with. Errors only display for touched fields.
- No explicit field registration. The form knows all fields from model metadata.
- Input widgets stay unchanged. `useBind` handles the FormContext integration transparently.

### Re-render strategy

A naive context approach re-renders all bound widgets on any field change. To avoid this, `useFormContext` does not return the full context object. Instead, `useBind` subscribes to only the relevant field's value and error via a selector pattern:

```typescript
const fieldValue = useFormField(bind.field); // subscribes to one field only
```

The implementation uses either `useSyncExternalStore` with per-field subscriptions, or splits the context into a stable-reference API object (methods) plus a store that fields subscribe to selectively. The exact mechanism is an implementation detail. The requirement is: changing field A does not re-render field B.

---

## 4. useBind integration

`useBind` is the single integration point between FormContext and widgets.

```typescript
export function useBind(
  bind: WidgetBinding | undefined,
  fieldMeta?: Record<string, FieldMeta>,
  setValue?: (field: string, val: unknown) => void,
): BindingResult | null {
  const ctx = useWidgetContext();
  const state = usePageState();
  const stateVersion = useStateVersion();
  const form = useFormContext(); // null if not inside a form

  return useMemo(() => {
    const result = resolveBinding(bind, ctx, fieldMeta, setValue, state);
    if (!result || !bind?.field || !form) return result;

    return {
      value: form.getValue(bind.field),
      setValue: (val: unknown) => form.setValue(bind.field!, val),
      meta: result.meta ?? form.getFieldMeta(bind.field),
      error: form.getError(bind.field),
    };
  }, [bind, ctx, fieldMeta, setValue, state, stateVersion, form]);
}
```

When inside a form and the binding type is `field`:

- `value` comes from the form's values record.
- `setValue` writes to the form (triggers dirty tracking and validation).
- `meta` enriched with form-provided field metadata.
- `error` populated from the form's error map.

Expression and model bindings pass through unchanged.

---

## 5. BindingResult extension

The `BindingResult` interface gains an optional `error` field:

```typescript
interface BindingResult {
  value: unknown;
  setValue?: (val: unknown) => void;
  meta?: FieldMeta;
  error?: string; // new — populated when inside a form
}
```

Input widgets read `bind.error` and render it below the field. This is the only additive change to existing widgets.

---

## 6. Dirty tracking

Dirty means the current value differs from the original loaded value.

In edit mode the form stores an `original` snapshot when the record loads. On each `setValue`:

```
setValue('customer_name', 'Acme Corp')
  → compare with original['customer_name']
  → values differ → dirty.add('customer_name')

setValue('customer_name', original['customer_name'])
  → values match → dirty.delete('customer_name')
```

In create mode every non-empty field is considered dirty. The `dirty` set is not used for create payloads.

`isDirty()` returns `dirty.size > 0`.

---

## 7. Validation

Validation rules are derived from model field metadata at runtime via `useModelMeta`.

| Model field property | Client validation                        |
| -------------------- | ---------------------------------------- |
| `required: true`     | Field must have a non-empty value        |
| `maxLength: N`       | String length must not exceed N          |
| `minLength: N`       | String length must be at least N         |
| `min: N`             | Numeric value must be at least N         |
| `max: N`             | Numeric value must not exceed N          |
| `type: 'enum'`       | Value must be one of the defined options |
| `type: 'email'`      | Value must match email format            |

### Validation timing

| Event        | What runs                                 |
| ------------ | ----------------------------------------- |
| `setValue`   | Validate that single field                |
| `setTouched` | Show error if field already invalid       |
| `submit`     | Validate all fields. Block if any errors. |

Errors only display for touched fields. On submit all fields become touched.

### Server-side errors

If the server rejects the mutation the response contains field-level errors. The form maps these back to the `errors` record.

```typescript
// Server responds with:
{ errors: { customer_name: 'Customer not found', total: 'Must be positive' } }

// Form sets:
errors['customer_name'] = 'Customer not found';
errors['total'] = 'Must be positive';
```

---

## 8. Form actions

The form registers two actions in the action dispatcher: `form.submit` and `form.reset`.

Button widgets inside a form trigger these via the `on.click` handler:

```typescript
{ type: 'button', on: { click: { type: 'form.submit' } } }
{ type: 'button', on: { click: { type: 'form.reset' } } }
```

The action dispatcher finds the nearest FormContext and calls `submit()` or `reset()`.

### form.submit

1. Validate all fields. Mark all as touched.
2. If errors exist, abort. Scroll to first error field.
3. Build payload:
   - Create mode: all non-empty fields.
   - Edit mode: only fields in the `dirty` set.
4. Send request (`POST` for create, `PATCH` for edit).
5. If server rejects, map errors back to form.
6. If success, reset dirty state, update original snapshot, fire `success` trigger.

### form.reset

1. In edit mode: restore `values` to `original` snapshot.
2. In create mode: clear all values to empty.
3. Clear `errors`, `dirty`, and `touched`.

---

## 9. Submit details

### API endpoints

| Mode   | Method | Endpoint                     |
| ------ | ------ | ---------------------------- |
| create | POST   | `/api/{module}/{model}`      |
| edit   | PATCH  | `/api/{module}/{model}/{id}` |

### Payload structure

```typescript
// Create mode — all non-empty fields
{ customer_name: 'Acme', order_date: '2025-01-15', status: 'draft' }

// Edit mode — only dirty fields
{ customer_name: 'Acme Corp' }
```

---

## 10. Triggers

| Trigger   | Fires when         | Payload               |
| --------- | ------------------ | --------------------- |
| `success` | Mutation succeeded | `{ record, mode }`    |
| `error`   | Mutation failed    | `{ errors, message }` |

```typescript
{
  type: 'form',
  bind: { model: { name: 'sales.order' }, id: '{{$route.id}}' },
  on: {
    success: { type: 'navigate', path: '/sales/orders/{{record.id}}' },
    error: { type: 'toast', message: '{{error.message}}', variant: 'destructive' },
  },
}
```

---

## 11. Unsaved changes guard

If `isDirty()` returns true and the user navigates away, the form intercepts navigation and shows a confirmation dialog. This uses the router's `beforeLeave` guard.

The guard does not fire when navigation happens as part of `on.success` (the form initiated it).

---

## 12. Data fetching

FormWidget uses the shared widget data hooks (see `docs/spec/widget-data-hooks.md`).

- Edit mode: `useModelRecord(model, id)` fetches the record on mount. The result populates `values` and `original`.
- Create mode: no fetch. Values start empty.
- After successful submit: invalidates `['model', model]` queries so sibling DataWidget/TableWidget instances refetch.

---

## 13. FormWidget implementation outline

```
packages/client/src/widgets/form/
  FormContext.ts        — React context definition + useFormContext hook
  FormProvider.tsx      — Provider component, orchestrates state
  useFormState.ts       — Core state: values, original, dirty, touched
  useFormSubmit.ts      — Payload building, API call, error mapping
  useFormValidation.ts  — Derives validation rules from model metadata
  FormWidget.tsx        — Widget component, renders FormProvider + children
```

### FormWidget renders

```typescript
function FormWidget({ bind, on, children }: WidgetProps) {
  const ctx = useWidgetContext();
  const modelName = ctx.model;  // set by buildContext from bind.model.name
  const id = bind.id;           // resolved expression from bind.id

  return (
    <FormProvider model={modelName} id={id} onSuccess={on.success} onError={on.error}>
      {children}
    </FormProvider>
  );
}
```

The form renders no visible elements. It is a pure data boundary.

### Widget meta

```typescript
FormWidget.widgetMeta = {
  name: 'form',
  label: 'Form',
  category: 'data',
  schema: {},
  binding: 'model',
  triggers: ['success', 'error'],
  container: true,
};
```

---

## 13. Relationship with DataWidget

The DataWidget is the read-only counterpart to FormWidget. Both are invisible data containers that fetch records and provide context to children. FormWidget extends the pattern with mutation state (dirty, validation, submit).

- `data` widget fetches and provides records (single or list). Children bind to fields read-only.
- `form` widget fetches (in edit mode) and provides a mutable record. Children bind to fields read-write via FormContext.
- A page that needs read-only display uses DataWidget. A page that needs mutation uses FormWidget.
- Service-bound forms (calling a custom endpoint instead of a model) are handled by binding the form to a service. The form collects inputs and POSTs to the endpoint. No dirty tracking, no record fetch.

DataWidget is specified separately. See `docs/spec/data-widget.md`.

---

## 14. What is NOT in scope (future iteration)

- Children records (editable table inside form, atomic parent+children submit)
- Computed fields (derived values that auto-calculate)
- Multi-step forms (wizard)
- Conditional field visibility based on form values
- Custom validation functions in page definition
- Service-bound forms (`bind: { service: '/api/...' }`)
