# Widget System Spec — ✅ Implemented

A declarative, JSON-serializable UI composition system for building complex screens from widgets placed inside view slots. Supports data binding, reactive expressions, context-aware actions, and conditional rendering.

## Overview

The widget system introduces three layers:

1. `defineWidget()` registers reusable UI atoms (button, input, table, etc.)
2. `defineView()` declares named slots that accept widgets
3. `definePage()` assembles views into panels and fills their slots with widget trees

Developers compose screens by placing widgets in view slots. Built-in views are opinionated and functional out of the box. Custom views provide a blank canvas for full page builder composition.

```
definePage()
  └── panels
        └── view (defineView)
              └── slots
                    └── WidgetNode tree (defineWidget instances)
```

## Principles

- All widget definitions serialize to JSON. No functions, no class instances in the data layer.
- The visual editor and code-first authoring produce the same JSON structure.
- Built-in widgets use the same `defineWidget()` API as custom widgets (dogfooding).
- Views don't restrict what widgets go in their slots. Only container widgets optionally restrict children.
- Two state sources: record state (model data, persisted) and `$state` (UI-only, ephemeral).
- Any string containing `{{}}` is an expression, everywhere in the JSON. One mental model.
- No event system. Widgets communicate via `$state` and actions.
- Table widget is read-only. Form view handles all editing (including child tables).

---

## 1. defineWidget()

Registers a widget component with its metadata, accepted props, binding mode, and triggers.

### Schema

```typescript
interface WidgetDefinition {
  name: string;
  label: string;
  category: 'input' | 'display' | 'layout' | 'action';

  schema: Record<string, FieldConfig>;
  binding: 'none' | 'field' | 'expression' | 'record' | 'model';
  triggers: string[];

  container: boolean;
  accepts?: string[];

  component: (props: WidgetProps) => ReactNode;
}
```

### Fields

| Field       | Type     | Required | Description                                                                       |
| ----------- | -------- | -------- | --------------------------------------------------------------------------------- |
| `name`      | string   | yes      | Unique identifier. Used in `WidgetNode.type`.                                     |
| `label`     | string   | yes      | Display name for visual editor.                                                   |
| `category`  | enum     | yes      | Grouping for visual editor palette.                                               |
| `schema`    | object   | yes      | Props the widget accepts. Validated at boot. Drives visual editor property panel. |
| `binding`   | enum     | yes      | What data binding modes this widget supports.                                     |
| `triggers`  | string[] | yes      | Events this widget can emit. Empty array if none.                                 |
| `container` | boolean  | yes      | Whether this widget can hold children.                                            |
| `accepts`   | string[] | no       | If container, restricts allowed child widget types. Omit for unrestricted.        |
| `component` | function | yes      | React component. Not serialized. Registered separately for client runtime.        |

### Binding modes

| Mode         | Meaning                                                              |
| ------------ | -------------------------------------------------------------------- |
| `none`       | No data connection. Renders from props only.                         |
| `field`      | Binds to a single model field. Gets value, setValue, field metadata. |
| `expression` | Binds to a computed expression. Read-only.                           |
| `record`     | Binds to the full record in scope.                                   |
| `model`      | Fetches its own data from a model. Creates a new context scope.      |

### WidgetProps (what the component receives at runtime)

```typescript
interface WidgetProps {
  props: Record<string, any>;
  bind: {
    value: any;
    setValue?: (val: any) => void;
    meta?: {
      type: string;
      label: string;
      required: boolean;
      options?: any[];
      readOnly: boolean;
    };
  };
  on: Record<string, (...args: any[]) => void>;
  context: {
    record: Record<string, any>;
    model: string;
    mode: 'view' | 'edit';
    index?: number;
  };
  children?: ReactNode;
}
```

### Resolution order

Module custom widgets > framework built-in widgets > error at boot.

### Example

```typescript
defineWidget({
  name: 'button',
  label: 'Button',
  category: 'action',
  schema: {
    label: { type: 'string', required: true },
    variant: { type: 'enum', options: ['primary', 'secondary', 'ghost', 'danger'], default: 'secondary' },
    icon: { type: 'string' },
    size: { type: 'enum', options: ['sm', 'md', 'lg'], default: 'md' },
    disabled: { type: 'boolean', default: false },
  },
  binding: 'none',
  triggers: ['click'],
  container: false,
  component: ({ props, on }) => (
    <button onClick={on.click} className={variants[props.variant]}>
      {props.icon && <Icon name={props.icon} />}
      {props.label}
    </button>
  ),
})
```

---

## 2. defineView() — Slot declarations

Views declare named slots where widgets can be placed. Slots are positional. The view component decides where in its layout each slot renders.

### Schema

```typescript
interface ViewDefinition {
  name: string;
  label: string;
  schema: Record<string, FieldConfig>;
  slots: Record<string, SlotDefinition>;
  component: (props: ViewProps) => ReactNode;
}

interface SlotDefinition {
  label: string;
  multiple: boolean;
}
```

### Fields

| Field       | Type     | Required | Description                                                   |
| ----------- | -------- | -------- | ------------------------------------------------------------- |
| `name`      | string   | yes      | Unique identifier. Referenced by `panel.view`.                |
| `label`     | string   | yes      | Display name.                                                 |
| `schema`    | object   | yes      | View-level configuration. Validated against panel's `config`. |
| `slots`     | object   | yes      | Named slots this view exposes.                                |
| `component` | function | yes      | React component.                                              |

### Slot rules

- No required slots. Views render gracefully when slots are empty.
- Views don't restrict what widget types go in their slots.
- `multiple: true` means the slot accepts an array of widgets. `multiple: false` means one widget only.

### Built-in views vs custom view

Built-in views (list, form, kanban, etc.) are opinionated. They auto-render from model metadata and expose slots for customization.

Custom view is a blank canvas:

```typescript
defineView({
  name: 'custom',
  label: 'Custom',
  schema: {},
  slots: {
    body: { label: 'Body', multiple: true },
  },
  component: ({ slots }) => <div>{slots.body}</div>,
})
```

### Resolution order

Module custom views > framework built-in views > error at boot.

---

## 3. definePage() — Assembly

Pages assemble views into panels and fill view slots with widget trees. No changes to the page structure itself. The new addition is the `slots` field on panels.

### Panel with slots

```typescript
interface PanelDefinition {
  view: string;
  source?: { model?: string; endpoint?: string; service?: object };
  config?: Record<string, any>;
  slots?: Record<string, WidgetNode[]>;
}
```

### Example

```json
{
  "key": "order-form",
  "label": "Order Form",
  "type": "record",
  "layout": "full",
  "panels": {
    "main": {
      "view": "form",
      "source": { "model": "sales.order" },
      "slots": {
        "body": [ ... ],
        "toolbar": [ ... ]
      }
    }
  }
}
```

---

## 4. WidgetNode — The JSON shape

Every widget instance in a slot is a `WidgetNode`. This is the canonical format that both code-first authoring and the visual editor produce.

### Schema

```typescript
interface WidgetNode {
  id?: string;
  type: string;
  props?: Record<string, any>;
  bind?: WidgetBinding;
  visible?: Condition | Condition[];
  on?: Record<string, WidgetAction | WidgetAction[]>;
  children?: WidgetNode[];
}

interface WidgetBinding {
  field?: string;
  expression?: string;
  model?: { name: string; filters?: Record<string, any>; limit?: number };
}

interface Condition {
  field: string;
  operator: 'eq' | 'neq' | 'in' | 'notIn' | 'empty' | 'notEmpty' | 'gt' | 'lt' | 'gte' | 'lte';
  value?: any;
}
```

### Fields

| Field      | Type                     | Required | Description                                                                                            |
| ---------- | ------------------------ | -------- | ------------------------------------------------------------------------------------------------------ |
| `id`       | string                   | no       | Stable identifier for visual editor tracking. Runtime ignores it. Auto-generated by editor if missing. |
| `type`     | string                   | yes      | References a registered widget name.                                                                   |
| `props`    | object                   | no       | Static props or expression strings. Validated against widget's schema at boot.                         |
| `bind`     | object                   | no       | Data binding declaration.                                                                              |
| `visible`  | Condition or Condition[] | no       | Conditional rendering. Multiple conditions AND together.                                               |
| `on`       | object                   | no       | Trigger-to-action wiring. Keys are trigger names, values are actions.                                  |
| `children` | WidgetNode[]             | no       | Child widgets. Only valid if the widget is a container.                                                |

### Validation at boot

- `type` must reference a registered widget.
- `props` validated against widget's `schema`.
- `children` only allowed if widget has `container: true`.
- If widget has `accepts`, children types are checked against the list.
- `on` keys must match widget's declared `triggers`.
- `bind` mode must match widget's declared `binding` mode.

---

## 5. Data Binding

Binding connects a widget to data. The `bind` field on a WidgetNode declares the connection.

### Binding types

#### Field binding

Binds to a model field on the current record in scope. The widget receives the value, a setter, and field metadata.

```json
{ "bind": { "field": "customer_id" } }
```

Runtime provides:

- `value`: current field value
- `setValue(val)`: write back (input widgets)
- `meta`: field type, label, required, options, readOnly (from model definition)

Input widgets auto-render the correct control based on field metadata. No need to specify `props.type` or `props.label` unless overriding.

#### Expression binding

Computed read-only value. Cannot write back.

```json
{ "bind": { "expression": "{{qty * rate}}" } }
```

#### Model binding

Widget fetches its own data from a model. Creates a new context scope. Used by the `table` widget.

```json
{ "bind": { "model": { "name": "sales.order", "filters": { "status": "draft" }, "limit": 10 } } }
```

#### No binding

Widget renders from props only. Omit the `bind` field entirely.

### Props override binding metadata

When a widget is field-bound, it inherits label, placeholder, and options from the model. Props override these:

```json
{
  "type": "input",
  "bind": { "field": "customer_id" },
  "props": { "label": "Buyer", "placeholder": "Search customers..." }
}
```

---

## 6. Context Tree

The runtime maintains a context tree mirroring the widget tree. Context determines what data a widget (and its actions/expressions) can access.

### Context creation rules

- Layout widgets (`group`, `section`, `divider`, `spacer`) do NOT create context. They pass through.
- Data-bound widgets (`table` with `bind.model`, form child-table) create a new context scope.
- Each row in a table/child-table creates a row-level context.

### Context shape

```typescript
interface WidgetContext {
  record: Record<string, any>;
  records?: Record<string, any>[];
  model: string;
  mode: 'view' | 'edit';
  index?: number;
  parent?: WidgetContext;
}
```

### Scope resolution

Nearest scope wins. Actions and expressions resolve from their immediate parent scope.

### Scope references

| Reference             | Resolves to                                           |
| --------------------- | ----------------------------------------------------- |
| `fieldName`           | field on nearest record in scope                      |
| `$parent.fieldName`   | one context level up                                  |
| `$root.fieldName`     | page-level record                                     |
| `$selected.fieldName` | data from trigger event (e.g. selected link option)   |
| `$filter.fieldName`   | view filter state (collection pages)                  |
| `$row.fieldName`      | explicit row reference (same as default inside table) |
| `$state.keyName`      | page-level UI state (see section 6b)                  |
| `$response.fieldName` | service response data (inside onSuccess/onError)      |

### Context by page type

| Page type  | Top-level context                                                      |
| ---------- | ---------------------------------------------------------------------- |
| record     | single document (the record being viewed/edited)                       |
| collection | no single record; toolbar has filter context, row slot has row context |
| dashboard  | no single record; each panel is independent                            |

---

## 6b. Page State ($state)

A flat key-value store for ephemeral UI state. Shared across all panels, the drawer, and topbar actions on the same page. Never persisted to backend.

### Characteristics

- Flat. Keys are strings, values are any scalar (string, number, boolean, null). No nested objects.
- Page-scoped. All panels, drawer, and topbar share the same `$state`.
- Undeclared. No schema or upfront definition. Write any key at any time.
- Reactive. Widgets referencing a `$state` key re-render when that key changes.

### Writing to state

```json
{ "type": "setValue", "field": "$state.step", "value": 2 }
{ "type": "setValue", "field": "$state.selectedCustomer", "value": "{{id}}" }
{ "type": "setValues", "values": { "$state.loading": true, "$state.error": null } }
```

### Reading from state

In expressions:

```
{{$state.step}}
{{if($state.loading, 'Loading...', 'Ready')}}
```

In conditions:

```json
{ "visible": { "field": "$state.step", "operator": "eq", "value": 2 } }
```

In props (expressions work anywhere):

```json
{
  "props": {
    "disabled": "{{$state.loading}}",
    "label": "{{if($state.step == 3, 'Submit', 'Next')}}"
  }
}
```

### Reactivity implementation

Static key extraction at boot. The runtime parses all expressions, conditions, and props in the widget tree. It builds a dependency map: which widgets depend on which `$state` keys. When a key changes, only widgets in its dependency set re-evaluate.

No proxy. No deep comparison. A write to `$state.step` only affects widgets that reference `$state.step`.

### Use cases

| Use case                  | How                                                        |
| ------------------------- | ---------------------------------------------------------- |
| Wizard steps              | `$state.step` + visible conditions per section             |
| Cross-panel communication | Panel A writes `$state.selectedId`, Panel B filters by it  |
| Bulk selection            | Table writes `$state.selectedIds`, toolbar button reads it |
| Loading/error UI          | Service sets `$state.loading` before call, clears after    |
| Tab switching             | `$state.activeTab` + visible conditions                    |

### What `$state` replaces

The original event system (`rangka:select`, `rangka:navigate`, `drawer:open`, etc.) is removed. All inter-widget and inter-panel communication uses `$state` + actions instead.

---

## 7. Triggers

Triggers are events a widget can emit. Each widget type declares its triggers in `defineWidget()`. Triggers are decoupled from actions. Any trigger can fire any action.

### Built-in triggers by category

**Input widgets:**

- `change` — value changed
- `focus` — field focused
- `blur` — field lost focus

**Action widgets:**

- `click` — pressed

**Table widget:**

- `rowClick` — row clicked
- `select` — row(s) selected
- `pageChange` — pagination changed

**Any widget:**

- `mount` — widget rendered for the first time

### Trigger execution order

For input widgets with field binding:

1. User changes value
2. Binding writes new value to the record draft (automatic)
3. `on.change` action fires (sees the updated value)

---

## 8. Actions

Actions define what happens in response to a trigger. They are a universal palette. Any action can be attached to any trigger on any widget.

### Schema

```typescript
type WidgetAction =
  | SetValueAction
  | ClearValueAction
  | SetValuesAction
  | FetchOptionsAction
  | RefreshSourceAction
  | RefreshPanelAction
  | ServiceAction
  | ValidateAction
  | ModelCreateAction
  | ModelUpdateAction
  | ModelDeleteAction
  | ModelFetchAction
  | ModelListAction
  | NavigateAction
  | OpenDrawerAction
  | CloseDrawerAction
  | FocusAction
  | AddRowAction
  | RemoveRowAction
  | DuplicateRowAction
  | SequenceAction
  | ConditionalAction;
```

### Action definitions

#### Data actions

```typescript
interface SetValueAction {
  type: 'setValue';
  field: string; // target field (supports $parent.field, $root.field)
  value: any; // literal, or expression string "{{...}}"
}

interface ClearValueAction {
  type: 'clearValue';
  field: string;
}

interface SetValuesAction {
  type: 'setValues';
  values: Record<string, any>; // field → value pairs
}
```

#### Fetch actions

```typescript
interface FetchOptionsAction {
  type: 'fetchOptions';
  field: string; // which select/link field to reload options for
  depends: string[]; // fields that determine the options query
}

interface RefreshSourceAction {
  type: 'refreshSource'; // re-fetch current view's data
}

interface RefreshPanelAction {
  type: 'refreshPanel';
  panel: string; // panel name to refresh
}
```

#### Backend actions

```typescript
interface ServiceAction {
  type: 'service';
  name: string; // qualified service name (e.g. "sales.submitOrder")
  params?: Record<string, any>; // extra params merged with context record
  context?: string; // override context: "$parent", "$root"
  onSuccess?: WidgetAction; // action to run on success ($response available)
  onError?: WidgetAction; // action to run on error ($response available)
}

interface ValidateAction {
  type: 'validate';
  fields?: string[]; // specific fields, or omit for entire form
}
```

The `onSuccess` and `onError` handlers run after the service completes. Inside these handlers, `$response` is available as a scope reference containing the service response data.

```json
{
  "type": "service",
  "name": "sales.getProductPrice",
  "params": { "product_id": "{{product_id}}" },
  "onSuccess": {
    "type": "setValues",
    "values": {
      "rate": "{{$response.price}}",
      "uom": "{{$response.unit}}",
      "$state.priceLoaded": true
    }
  },
  "onError": {
    "type": "setValue",
    "field": "$state.error",
    "value": "{{$response.message}}"
  }
}
```

If `onSuccess` is omitted, the default behavior is: show success toast + refresh source. If `onSuccess` is provided, only the declared action runs (no implicit toast/refresh).

````

#### Model actions

```typescript
interface ModelCreateAction {
  type: 'model.create'
  model: string
  data: Record<string, any>     // field values, supports "{{...}}" expressions
}

interface ModelUpdateAction {
  type: 'model.update'
  model?: string                // inferred from context if omitted
  id?: string                   // inferred from context if omitted
  data: Record<string, any>
}

interface ModelDeleteAction {
  type: 'model.delete'
  model?: string                // inferred from context if omitted
  id?: string                   // inferred from context if omitted
}

interface ModelFetchAction {
  type: 'model.fetch'
  model: string
  id: string
  into: string                  // where to store result (e.g. "$record")
}

interface ModelListAction {
  type: 'model.list'
  model: string
  filters?: Record<string, any>
  into: string                  // where to store results
}
````

#### Navigation actions

```typescript
interface NavigateAction {
  type: 'navigate';
  path: string; // supports "{{...}}" for dynamic segments
}

interface OpenDrawerAction {
  type: 'openDrawer';
  view: string;
  source?: { model?: string; endpoint?: string };
  config?: Record<string, any>;
}

interface CloseDrawerAction {
  type: 'closeDrawer';
}
```

#### Child table actions

```typescript
interface AddRowAction {
  type: 'addRow';
  field: string; // child table field name
}

interface RemoveRowAction {
  type: 'removeRow';
  field: string;
}

interface DuplicateRowAction {
  type: 'duplicateRow';
  field: string;
}
```

#### UI actions

```typescript
interface FocusAction {
  type: 'focus';
  field: string;
}
```

#### Flow control actions

```typescript
interface SequenceAction {
  type: 'sequence';
  actions: WidgetAction[]; // run in order, stop on error
}

interface ConditionalAction {
  type: 'conditional';
  condition: Condition;
  then: WidgetAction;
  else?: WidgetAction;
}
```

### Context awareness

Actions inherit the nearest scope. They don't need to specify model or id when operating on the current record in context:

```json
// Inside a table row bound to sales.order
// model.delete knows it's deleting the current row's record
{ "type": "model.delete" }

// Explicit override when breaking out of scope
{ "type": "model.delete", "model": "sales.order", "id": "{{id}}" }
```

### Post-action behavior

- `service` / `model.*`: on success, shows toast + refreshes source. On error, shows error toast.
- `navigate`: performs route change.
- `setValue` / `setValues`: mutates draft, triggers re-render of bound widgets.

---

## 9. Expression Language

A small, sandboxed expression language for computing values. Evaluated client-side at runtime.

### Syntax

Expressions are wrapped in `{{` and `}}`:

```
{{qty * rate}}
{{format_currency(sum(items.amount), $parent.currency)}}
{{if(status == 'draft', 'Pending', upper(status))}}
```

### Grammar

```
expression   := literal | field_ref | unary | binary | call | ternary
literal      := string | number | boolean | null
field_ref    := identifier ("." identifier)*
unary        := ("!" | "-") expression
binary       := expression operator expression
call         := identifier "(" (expression ("," expression)*)? ")"
ternary      := expression (used only inside if() function)

operator     := "+" | "-" | "*" | "/" | "%" | "==" | "!=" | ">" | "<" | ">=" | "<=" | "&&" | "||"
identifier   := [a-zA-Z_$][a-zA-Z0-9_]*
```

### Field references

```
customer_name          → current scope
$parent.currency       → parent scope
$root.company          → page root scope
$selected.price        → trigger event data
$row.qty               → explicit row (inside table)
items.amount           → nested field (child table column)
```

### Literals

| Type    | Examples             |
| ------- | -------------------- |
| string  | `"hello"`, `'world'` |
| number  | `42`, `3.14`, `-1`   |
| boolean | `true`, `false`      |
| null    | `null`               |

### Operators

| Category   | Operators                        | Notes                          |
| ---------- | -------------------------------- | ------------------------------ |
| Arithmetic | `+`, `-`, `*`, `/`, `%`          | `+` also concatenates strings  |
| Comparison | `==`, `!=`, `>`, `<`, `>=`, `<=` | Loose equality (coerces types) |
| Logical    | `&&`, `\|\|`, `!`                | Short-circuit evaluation       |

### Built-in functions

#### Aggregate (operate on arrays)

| Function | Signature      | Description                      |
| -------- | -------------- | -------------------------------- |
| `sum`    | `sum(field)`   | Sum values in child table column |
| `count`  | `count(field)` | Count rows in child table        |
| `avg`    | `avg(field)`   | Average of child table column    |
| `min`    | `min(field)`   | Minimum value                    |
| `max`    | `max(field)`   | Maximum value                    |

#### Math

| Function | Signature                 | Description               |
| -------- | ------------------------- | ------------------------- |
| `round`  | `round(value, decimals?)` | Round to N decimal places |
| `abs`    | `abs(value)`              | Absolute value            |
| `ceil`   | `ceil(value)`             | Round up                  |
| `floor`  | `floor(value)`            | Round down                |

#### String

| Function | Signature           | Description       |
| -------- | ------------------- | ----------------- |
| `upper`  | `upper(value)`      | Uppercase         |
| `lower`  | `lower(value)`      | Lowercase         |
| `concat` | `concat(a, b, ...)` | Join strings      |
| `trim`   | `trim(value)`       | Remove whitespace |

#### Date

| Function      | Signature                    | Description            |
| ------------- | ---------------------------- | ---------------------- |
| `today`       | `today()`                    | Current date (no time) |
| `now`         | `now()`                      | Current datetime       |
| `add_days`    | `add_days(date, n)`          | Add N days to date     |
| `diff_days`   | `diff_days(a, b)`            | Days between two dates |
| `format_date` | `format_date(date, pattern)` | Format date as string  |

#### Format

| Function          | Signature                          | Description                     |
| ----------------- | ---------------------------------- | ------------------------------- |
| `format_currency` | `format_currency(value, currency)` | Format as currency string       |
| `format_number`   | `format_number(value, decimals?)`  | Format with thousand separators |

#### Logic

| Function   | Signature                   | Description          |
| ---------- | --------------------------- | -------------------- |
| `if`       | `if(condition, then, else)` | Conditional value    |
| `coalesce` | `coalesce(a, b, ...)`       | First non-null value |

### Constraints

- No loops or iteration
- No variable assignment
- No function definitions
- No object or array construction
- No side effects
- Evaluates to a single value

### Where expressions appear

Any string value containing `{{}}` is an expression, regardless of where it appears in the JSON. This is a universal rule with no exceptions.

| Location              | Example                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `bind.expression`     | `{ "expression": "{{qty * rate}}" }`                                                     |
| `setValue` value      | `{ "type": "setValue", "value": "{{qty * rate}}" }`                                      |
| `navigate` path       | `{ "type": "navigate", "path": "/orders/{{id}}" }`                                       |
| `model.*` data values | `{ "data": { "total": "{{sum(items.amount)}}" } }`                                       |
| `props` values        | `{ "props": { "readOnly": "{{status == 'submitted'}}" } }`                               |
| `visible` value       | `{ "visible": { "field": "total", "operator": "gt", "value": "{{$state.threshold}}" } }` |
| `onSuccess` values    | `{ "values": { "$state.price": "{{$response.price}}" } }`                                |
| `service` params      | `{ "params": { "id": "{{id}}" } }`                                                       |

Non-expression string values (those without `{{}}`) are treated as static literals.

### Value resolution in setValue

| Value                    | Resolves to                    |
| ------------------------ | ------------------------------ |
| `"draft"`                | static literal                 |
| `true`, `0`, `null`      | static literal                 |
| `"{{field}}"`            | field value from current scope |
| `"{{expression}}"`       | computed value                 |
| `"{{$selected.price}}"`  | data from trigger event        |
| `"{{$parent.currency}}"` | parent scope field             |

---

## 10. Conditional Rendering

The `visible` field on a WidgetNode controls whether the widget renders. Conditions evaluate reactively. When a referenced field changes, visibility re-evaluates.

### Schema

```typescript
interface Condition {
  field: string;
  operator: 'eq' | 'neq' | 'in' | 'notIn' | 'empty' | 'notEmpty' | 'gt' | 'lt' | 'gte' | 'lte';
  value?: any;
}
```

### Operators

| Operator   | Description            | Requires value |
| ---------- | ---------------------- | -------------- |
| `eq`       | equals                 | yes            |
| `neq`      | not equals             | yes            |
| `in`       | in array               | yes (array)    |
| `notIn`    | not in array           | yes (array)    |
| `empty`    | null, undefined, or "" | no             |
| `notEmpty` | has a value            | no             |
| `gt`       | greater than           | yes            |
| `lt`       | less than              | yes            |
| `gte`      | greater than or equal  | yes            |
| `lte`      | less than or equal     | yes            |

### Multiple conditions

When `visible` is an array, all conditions must pass (AND logic):

```json
{
  "visible": [
    { "field": "status", "operator": "eq", "value": "draft" },
    { "field": "total", "operator": "gt", "value": 0 }
  ]
}
```

### Scope

Condition `field` resolves from the same context scope as binding. Supports `$parent.field`, `$root.field`.

---

## 11. Reactivity Model

Two state sources drive reactivity: record state and `$state`.

### State sources

| Source       | Scope                      | Persisted      | Write via                          |
| ------------ | -------------------------- | -------------- | ---------------------------------- |
| Record draft | per-view (form's document) | yes (on save)  | `bind.setValue`, `setValue` action |
| `$state`     | page-level                 | no (ephemeral) | `setValue` with `$state.*` field   |

### How it works

1. Form view holds a draft record in memory.
2. Input widgets write to the draft via `bind.setValue()`.
3. All widgets bound to affected fields re-render.
4. `visible` conditions re-evaluate when their referenced fields change.
5. Expressions recompute when their dependency fields change.
6. `$state` writes trigger re-render of all widgets that depend on the changed key.

### Change propagation

```
User types in input (qty = 5)
  → binding writes qty=5 to draft
    → widget bound to "qty" re-renders (shows 5)
    → expression "{{qty * rate}}" recomputes
    → visible condition checking "qty" re-evaluates
    → on.change action fires (setValue, fetchOptions, etc.)

Action writes $state.step = 2
  → all widgets with $state.step dependency re-evaluate
    → visible conditions referencing $state.step re-evaluate
    → props expressions referencing $state.step recompute
```

### Dependency tracking

Static analysis at boot. The runtime scans the entire widget tree and extracts dependencies from:

- `bind.field` or `bind.expression` → record field dependencies
- `visible` conditions → field or `$state` dependencies
- `props` values containing `{{}}` → field or `$state` dependencies

This produces a dependency map: `{ key → Set<widgetId> }`. When a key changes, only widgets in its set re-evaluate. No proxy, no deep comparison, no runtime tracking.

### No manual subscription

Widgets don't subscribe to specific fields. The dependency map handles it automatically.

---

## 12. Built-in Widgets (v1)

### Input

| Widget  | Category | Container | Binding | Triggers            |
| ------- | -------- | --------- | ------- | ------------------- |
| `input` | input    | no        | field   | change, focus, blur |

Auto-renders the correct control based on field type (text input, select, date picker, number, checkbox, etc.)

### Display

| Widget  | Category | Container | Binding          | Triggers |
| ------- | -------- | --------- | ---------------- | -------- |
| `text`  | display  | no        | field/expression | —        |
| `badge` | display  | no        | field            | —        |
| `icon`  | display  | no        | none             | click    |
| `image` | display  | no        | field/expression | —        |

### Layout

| Widget    | Category | Container | Binding | Triggers |
| --------- | -------- | --------- | ------- | -------- |
| `group`   | layout   | yes       | none    | —        |
| `section` | layout   | yes       | none    | —        |
| `divider` | layout   | no        | none    | —        |
| `spacer`  | layout   | no        | none    | —        |

### Action

| Widget   | Category | Container | Binding | Triggers |
| -------- | -------- | --------- | ------- | -------- |
| `button` | action   | no        | none    | click    |

### Data

| Widget   | Category | Container | Binding | Triggers                     |
| -------- | -------- | --------- | ------- | ---------------------------- |
| `table`  | layout   | yes       | model   | rowClick, select, pageChange |
| `column` | layout   | yes       | none    | —                            |

### Widget details

#### input

Renders the appropriate control based on bound field type. Inherits label, placeholder, required, and options from model metadata.

Props (all optional, override metadata):

- `label`: string
- `placeholder`: string
- `readOnly`: boolean
- `disabled`: boolean

#### text

Displays a text value. Supports field binding or expression binding.

Props:

- `style`: 'heading' | 'body' | 'caption' | 'bold'

#### badge

Displays a colored badge from an enum or status field.

Props:

- `colorMap`: Record<string, string> (value → color)

#### button

Triggers an action on click.

Props:

- `label`: string (required)
- `variant`: 'primary' | 'secondary' | 'ghost' | 'danger'
- `icon`: string (lucide icon name)
- `size`: 'sm' | 'md' | 'lg'
- `disabled`: boolean

#### group

Layout container. Arranges children in a row or column.

Props:

- `direction`: 'row' | 'column' (default: 'column')
- `align`: 'start' | 'center' | 'end' | 'stretch'
- `gap`: 'sm' | 'md' | 'lg'

#### section

Labeled container with a header. Used to visually group form fields or content.

Props:

- `label`: string (required)
- `collapsible`: boolean (default: false)
- `defaultCollapsed`: boolean (default: false)

#### table

Displays tabular data from a model. Creates a new context scope. Children must be `column` widgets.

Binding: `{ model: { name, filters?, limit? } }`

Props:

- `selectable`: boolean
- `bordered`: boolean
- `striped`: boolean
- `pageSize`: number

#### column

Defines a table column. Children render per-row with row-scoped context.

Props:

- `label`: string (required)
- `width`: string (e.g. "120px", "1fr")
- `align`: 'left' | 'center' | 'right'
- `sortable`: boolean

---

## 13. Builder Helpers (DX)

Optional factory functions that produce WidgetNode JSON. Not a separate system. The framework resolves builders to plain JSON at boot.

### Widget factories

```typescript
function input(field: string, opts?: Partial<WidgetNode>): WidgetNode;
function text(content: string, opts?: Partial<WidgetNode>): WidgetNode;
function button(label: string, opts?: Partial<WidgetNode>): WidgetNode;
function badge(field: string, opts?: Partial<WidgetNode>): WidgetNode;
function icon(name: string, opts?: Partial<WidgetNode>): WidgetNode;
function group(direction: string, children: WidgetNode[]): WidgetNode;
function section(label: string, children: WidgetNode[]): WidgetNode;
function table(model: string, columns: WidgetNode[]): WidgetNode;
function column(label: string, children: WidgetNode[]): WidgetNode;
function divider(): WidgetNode;
function spacer(): WidgetNode;
```

### Action factories

```typescript
function setValue(field: string, value: any): SetValueAction;
function clearValue(field: string): ClearValueAction;
function setValues(values: Record<string, any>): SetValuesAction;
function service(name: string, params?: object): ServiceAction;
function navigate(path: string): NavigateAction;
function fetchOptions(field: string, depends: string[]): FetchOptionsAction;
function refreshSource(): RefreshSourceAction;
function validate(fields?: string[]): ValidateAction;
function addRow(field: string): AddRowAction;
function removeRow(field: string): RemoveRowAction;
```

### Zod-style builder (alternative DX)

Chainable builders that serialize to the same JSON:

```typescript
input('customer_id')
  .on('change', fetchOptions('contact_id', ['customer_id']))
  .toJSON();
// → { type: 'input', bind: { field: 'customer_id' }, on: { change: { ... } } }

button('Submit')
  .props({ variant: 'primary' })
  .visible({ field: 'status', operator: 'eq', value: 'draft' })
  .on('click', service('sales.submitOrder'))
  .toJSON();
```

Both styles produce identical WidgetNode JSON. Builders are resolved at boot via `.toJSON()`.

---

## 14. Client Architecture

The client separates logic (pure, testable) from rendering (thin React layer).

### Logic layer (pure functions, no React)

```
packages/client/src/
  widgets/
    registry.ts             — widget registration and lookup
  expression/
    parser.ts               — string → AST
    evaluator.ts            — AST + context → value
    functions.ts            — built-in function implementations
    types.ts                — AST node types
  context/
    builder.ts              — widget tree → context tree
    types.ts                — WidgetContext shape
  binding/
    resolver.ts             — bind + context → { value, setValue, meta }
  condition/
    evaluator.ts            — condition + context → boolean
  action/
    dispatcher.ts           — routes action to handler
    handlers/
      set-value.ts
      service.ts
      navigate.ts
      model.ts
      fetch-options.ts
      refresh.ts
      child-table.ts
      flow.ts
    types.ts
```

### React layer (thin wrappers)

```
packages/client/src/
  widgets/
    renderer.tsx            — walks widget tree, renders components
  context/
    provider.tsx            — React context for WidgetContext
  binding/
    hook.ts                 — useBind() hook
  hooks/
    useExpression.ts        — reactive expression evaluation
    useCondition.ts         — reactive visibility check
    useAction.ts            — binds triggers to dispatcher
  views/
    slot-renderer.tsx       — renders WidgetNode[] in a view slot
```

### Testing strategy

Logic layer is 100% unit testable with plain objects:

```typescript
// expression/parser.test.ts
test('parses field reference', () => {
  expect(parse('{{qty}}')).toEqual({ type: 'field', name: 'qty' })
})

// expression/evaluator.test.ts
test('evaluates multiplication', () => {
  const ast = parse('{{qty * rate}}')
  expect(evaluate(ast, { qty: 5, rate: 100 })).toBe(500)
})

// condition/evaluator.test.ts
test('notEmpty passes for non-null', () => {
  expect(evaluateCondition({ field: 'name', operator: 'notEmpty' }, { name: 'test' })).toBe(true)
})

// context/builder.test.ts
test('table creates child scope', () => {
  const tree = { type: 'table', bind: { model: { name: 'sales.order' } }, children: [...] }
  const ctx = buildContext(tree, rootContext)
  expect(ctx.model).toBe('sales.order')
})

// action/handlers/set-value.test.ts
test('resolves expression in value', () => {
  const result = resolveSetValue({ type: 'setValue', field: 'amount', value: '{{qty * rate}}' }, { qty: 5, rate: 100 })
  expect(result).toEqual({ field: 'amount', value: 500 })
})
```

---

## 15. Custom View SDK

Custom views built with `defineView()` use React directly. They need programmatic access to `$state`, record context, and actions to participate in the same reactive system as widget-based views.

### Hooks

```typescript
// Page state — read/write $state
const state = usePageState()
state.get('selectedCustomer')         // read a key
state.set('selectedCustomer', 'CUST-001')  // write a key (triggers reactivity)
state.subscribe('selectedCustomer', (val) => { ... })  // react to changes

// Current record — access the record in scope
const record = useRecord()
record.data                           // current record values
record.setValue('status', 'submitted')  // mutate draft
record.save()                         // persist to backend

// Actions — fire actions programmatically
const action = useAction()
action.service('sales.submitOrder', { notify: true })
action.navigate('/sales/orders')
action.refreshSource()
action.refreshPanel('sidebar')
action.openDrawer({ view: 'form', source: { model: 'sales.order' } })
action.closeDrawer()
action.setValue('$state.step', 2)

// Shell — existing shell utilities
const shell = useShell()
shell.toast('Order submitted')
shell.confirm('Delete this record?')
```

### How it integrates

Custom views are first-class citizens. They can:

- Read and write `$state` (triggers reactivity for widgets in other panels)
- Access the same record context as widget-based views
- Fire the same actions as declarative widgets
- Declare slots and host widgets inside their React component

A page can mix widget-based panels and custom view panels. They communicate through `$state`.

### When to use custom views

- Complex interactions that exceed what declarative widgets can express
- Third-party library integrations (maps, rich editors, chart interactions)
- Highly dynamic UIs where the shape changes at runtime
- Anything requiring loops over unknown-length data to build UI structure

---

## 16. Core Package Additions

### New registries

| Registry         | Purpose                                                         |
| ---------------- | --------------------------------------------------------------- |
| `WidgetRegistry` | Stores widget definitions. Lookup by name.                      |
| `ViewRegistry`   | Stores view definitions with slot declarations. Lookup by name. |

### Boot additions

1. Scan modules for `defineWidget()` and `defineView()` definitions.
2. Register in respective registries.
3. Validate all page slot contents against widget registry.
4. Include widget and view metadata in `/api/meta/boot` response.

### Shared types (packages/shared)

New type exports:

- `WidgetNode`
- `WidgetBinding`
- `WidgetAction` (union of all action types)
- `Condition`
- `WidgetDefinition` (without component)
- `ViewDefinition` (without component)
- `SlotDefinition`

---

## 17. Test Strategy

The system separates pure logic from rendering. The logic layer is tested exhaustively with plain objects. The React layer is tested with `@testing-library/react`. Widget components use shadcn styled components from day one. The test suite is "headless" (no style dependencies), not the widgets themselves.

### Layer 1: Expression engine

```
expression/
  parser.test.ts          — string → AST for every grammar rule
  evaluator.test.ts       — AST + context → value for every operator
  functions.test.ts       — each built-in function individually
```

Covers: every operator, every function, edge cases (null, undefined, division by zero, type coercion, nested field access, `$state.*`, `$parent.*`, `$response.*`).

### Layer 2: Condition evaluator

```
condition/
  evaluator.test.ts       — every operator (eq, neq, in, notIn, empty, notEmpty, gt, lt, gte, lte)
                          — multiple conditions (AND logic)
                          — scope references ($state.*, $parent.*)
                          — edge cases (null comparisons, type coercion)
```

### Layer 3: State store

```
state/
  store.test.ts           — get/set flat keys
                          — dependency registration
                          — notify only affected subscribers on write
                          — no notification when value unchanged
                          — $state isolation (write one key, others unaffected)
```

A standalone reactive store. No React. `Map<string, any>` with subscriber system.

### Layer 4: Context builder

```
context/
  builder.test.ts         — flat widget tree → flat context
                          — table widget creates child scope
                          — row iteration creates row contexts with index
                          — layout widgets pass through (no new scope)
                          — $parent chain resolves correctly
                          — $root always points to page-level
```

### Layer 5: Binding resolver

```
binding/
  resolver.test.ts        — field binding → value + meta from context
                          — expression binding → evaluated result
                          — model binding → returns query config
                          — no binding → null
                          — props override metadata (label, placeholder)
```

### Layer 6: Action resolver and dispatcher

```
action/
  resolver.test.ts        — resolves expressions in action params
                          — resolves $state.* targets
                          — resolves $parent.*, $root.* context overrides

  dispatcher.test.ts      — routes to correct handler by type
                          — sequence runs in order, stops on error
                          — conditional evaluates condition, branches

  handlers/
    set-value.test.ts     — sets field on record draft
                          — sets $state key
                          — resolves expression in value
                          — $parent.field targeting

    set-values.test.ts    — multiple fields at once
                          — mix of record and $state targets

    service.test.ts       — builds request from context + params
                          — onSuccess fires with $response
                          — onError fires with $response
                          — default behavior when no onSuccess

    model.test.ts         — model.create builds correct payload
                          — model.update infers model/id from context
                          — model.delete infers model/id from context
                          — explicit model/id overrides context

    navigate.test.ts      — resolves expressions in path
    fetch-options.test.ts — builds dependency query
    refresh.test.ts       — refreshSource, refreshPanel
    child-table.test.ts   — addRow, removeRow, duplicateRow
    flow.test.ts          — sequence execution, conditional branching
```

### Layer 7: Dependency tracker

```
reactivity/
  tracker.test.ts         — extracts field deps from expression strings
                          — extracts $state deps from conditions
                          — extracts deps from props expressions
                          — builds full widget → dependency map from tree
                          — returns correct widget set for a given key change
```

### Layer 8: Widget tree validator

```
validation/
  validator.test.ts       — rejects unknown widget type
                          — rejects children on non-container
                          — rejects disallowed child types (accepts list)
                          — validates props against widget schema
                          — validates trigger names against widget triggers
                          — validates binding mode matches widget declaration
                          — reports errors with path (e.g. "panels.main.slots.body[2].children[0]")
```

### Layer 9: Integration (logic layers combined, no React)

```
integration/
  form-scenario.test.ts   — set field → expression recomputes → condition re-evaluates → action fires
  table-scenario.test.ts  — model binding → row context → action in row → correct record sent
  state-scenario.test.ts  — action writes $state → dependent widgets flagged for re-render
  wizard-scenario.test.ts — $state.step changes → visibility toggles → props update
```

### Layer 10: React runtime

```
react/
  widget-renderer.test.tsx   — renders correct component by type
                             — passes resolved props/bind/on
                             — skips rendering when visible = false
                             — re-renders only when deps change

  context-provider.test.tsx  — provides context to children
                             — nested providers scope correctly

  slot-renderer.test.tsx     — renders widget array in order
                             — handles empty slots

  hooks/
    use-bind.test.tsx        — returns value from context, setValue triggers update
    use-expression.test.tsx  — recomputes when deps change
    use-condition.test.tsx   — returns boolean, updates reactively
    use-action.test.tsx      — fires dispatcher on trigger
    use-page-state.test.tsx  — get/set/subscribe in React lifecycle
```

---

## 18. Build Phases

### Phase 1: Pure logic engine

Deliverable: a fully tested logic core with no React dependency.

- Expression parser + evaluator + all built-in functions
- Condition evaluator
- State store (reactive flat key-value)
- Context builder
- Binding resolver
- Action resolver + dispatcher + all handlers
- Dependency tracker
- Widget tree validator
- Unit test suite (layers 1-8)
- Integration test scenarios (layer 9)

### Phase 2: React runtime

Deliverable: React hooks and renderers that wire the logic engine to the DOM.

- WidgetRenderer component
- ContextProvider component
- SlotRenderer component
- React hooks: useBind, useExpression, useCondition, useAction, usePageState
- React test suite (layer 10)
- Widget components using shadcn primitives (button, input, text, group, section, divider, spacer)

### Phase 3: Core registries and boot

Deliverable: server-side registration, validation, and boot payload.

- `defineWidget()` API + WidgetRegistry in core
- `defineView()` slot additions + ViewRegistry in core
- Boot scanning for widget/view definitions in modules
- Validation of page slot contents at boot
- Shared types package exports
- Widget/view metadata in `/api/meta/boot` response

### Phase 4: Shell integration

Deliverable: widgets working inside the existing app shell.

- Wire SlotRenderer into existing panel/layout system
- Wire ContextProvider with existing data layer (useSource, useRecord)
- Connect action dispatcher to existing shell API (navigation, drawer, toast)
- Connect service/model actions to existing API client
- End-to-end testing with dev app fixtures

### Phase 5: Power and polish

Deliverable: full feature set ready for production use.

- `table` + `column` widgets with model binding and row scoping
- `badge`, `icon`, `image` widgets
- Builder helpers (factory functions)
- Zod-style chainable builders
- Custom View SDK (`usePageState`, `useRecord`, `useAction`)
- Visual editor metadata (categories, labels, schemas for property panel)
