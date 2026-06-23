# Widget System v2 Spec — ✅ Implemented

Everything is a widget. Pages are flat widget trees. No panels, no views, no layout config.

## Overview

Two APIs define the entire UI layer:

- `defineWidget()` registers a reusable component (built-in or custom)
- `definePage()` composes widgets into a routable screen

The visual editor, code-first authoring, and builder API all produce the same JSON structure.

```
definePage()
  └── widgets: WidgetNode[]
        └── recursive tree of widgets
              ├── layout widgets (split, grid, group, section)
              ├── data widgets (data, table)
              ├── overlay widgets (drawer, modal)
              ├── input/display/action widgets
              └── opinionated widgets (registered separately)
```

## Principles

- All widget definitions serialize to JSON. No functions in the data layer.
- The page definition is the complete screen. No external layout, panel, or view config.
- Two state sources: record state (model data, persisted) and `$state` (UI-only, ephemeral).
- Reactive variables (`$state`, `$filter`, `$sort`, `$page`) control all dynamic behavior.
- One action (`setValue`) is the universal trigger for state changes.
- Overlay widgets (drawer, modal) are just container widgets with visibility conditions.
- Opinionated widgets are pre-composed widgets registered separately, not a separate abstraction.

---

## 1. definePage()

A page is a routable screen with a widget tree as its content.

### Schema

```typescript
interface PageDefinition {
  key: string;
  label: string;
  path?: string;
  actions?: Action[];
  widgets: WidgetNode[];
}
```

### Fields

| Field     | Type         | Required | Description                                  |
| --------- | ------------ | -------- | -------------------------------------------- |
| `key`     | string       | yes      | Unique identifier (`module.name`)            |
| `label`   | string       | yes      | Display name for nav, breadcrumbs, tab title |
| `path`    | string       | no       | Custom route path. Auto-generated if omitted |
| `actions` | Action[]     | no       | Topbar action buttons (shell-level)          |
| `widgets` | WidgetNode[] | yes      | The entire page content as a widget tree     |

### Example

```typescript
definePage({
  key: 'sales.orders',
  label: 'Sales Orders',
  widgets: [
    {
      type: 'split',
      props: { sizes: [60, 40] },
      children: [
        {
          type: 'table',
          bind: { model: { name: 'sales.order' } },
          on: { rowClick: { type: 'setValue', field: '$state.selectedId', value: '{{id}}' } },
          children: [
            { type: 'column', props: { label: 'Name' }, bind: { field: 'name' } },
            {
              type: 'column',
              props: { label: 'Status' },
              children: [{ type: 'badge', bind: { field: 'status' } }],
            },
          ],
        },
        {
          type: 'data',
          source: { model: 'sales.order', id: '$state.selectedId' },
          children: [
            { type: 'text', bind: { field: 'name' }, props: { style: 'heading' } },
            { type: 'badge', bind: { field: 'status' } },
          ],
        },
      ],
    },
  ],
});
```

---

## 2. defineWidget()

Registers a widget component with its metadata, accepted props, binding mode, and triggers.

### Schema

```typescript
interface WidgetDefinition {
  name: string;
  label: string;
  category: 'input' | 'display' | 'layout' | 'action' | 'data';
  schema: Record<string, FieldConfig>;
  binding: 'none' | 'field' | 'expression' | 'record' | 'model';
  triggers: string[];
  container: boolean;
  accepts?: string[];
  component: (props: WidgetProps) => ReactNode;
}
```

### Fields

| Field       | Type     | Required | Description                                             |
| ----------- | -------- | -------- | ------------------------------------------------------- |
| `name`      | string   | yes      | Unique identifier. Used in `WidgetNode.type`.           |
| `label`     | string   | yes      | Display name for visual editor.                         |
| `category`  | enum     | yes      | Grouping for visual editor palette.                     |
| `schema`    | object   | yes      | Props the widget accepts. Validated at boot.            |
| `binding`   | enum     | yes      | What data binding modes this widget supports.           |
| `triggers`  | string[] | yes      | Events this widget can emit. Empty array if none.       |
| `container` | boolean  | yes      | Whether this widget can hold children.                  |
| `accepts`   | string[] | no       | If container, restricts allowed child widget types.     |
| `component` | function | yes      | React component. Not serialized. Registered at runtime. |

### Binding modes

| Mode         | Meaning                                                         |
| ------------ | --------------------------------------------------------------- |
| `none`       | No data connection. Renders from props only.                    |
| `field`      | Binds to a single field on the nearest record in scope.         |
| `expression` | Binds to a computed expression. Read-only.                      |
| `record`     | Binds to the full record in scope.                              |
| `model`      | Fetches its own data from a model. Creates a new context scope. |

### WidgetProps (what the component receives)

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

---

## 3. WidgetNode — The JSON shape

Every widget instance in the tree is a `WidgetNode`. This is the canonical format that code-first authoring, the builder API, and the visual editor all produce.

### Schema

```typescript
interface WidgetNode {
  id?: string;
  type: string;
  props?: Record<string, any>;
  bind?: WidgetBinding;
  source?: WidgetSource;
  visible?: Condition | Condition[];
  on?: Record<string, WidgetAction | WidgetAction[]>;
  children?: WidgetNode[];
}

interface WidgetBinding {
  field?: string;
  expression?: string;
  model?: { name: string; filters?: Record<string, any>; limit?: number };
}

interface WidgetSource {
  model: string;
  id?: string;
}

interface Condition {
  field: string;
  operator: 'eq' | 'neq' | 'in' | 'notIn' | 'empty' | 'notEmpty' | 'gt' | 'lt' | 'gte' | 'lte';
  value?: any;
}
```

### Fields

| Field      | Type                     | Required | Description                                              |
| ---------- | ------------------------ | -------- | -------------------------------------------------------- |
| `id`       | string                   | no       | Stable identifier for visual editor. Runtime ignores it. |
| `type`     | string                   | yes      | References a registered widget name.                     |
| `props`    | object                   | no       | Static props or expression strings.                      |
| `bind`     | WidgetBinding            | no       | Data binding declaration.                                |
| `source`   | WidgetSource             | no       | Data source for `data` widget.                           |
| `visible`  | Condition or Condition[] | no       | Conditional rendering. Multiple conditions AND together. |
| `on`       | object                   | no       | Trigger-to-action wiring.                                |
| `children` | WidgetNode[]             | no       | Child widgets. Only valid if widget is a container.      |

---

## 4. The `data` Widget

The `data` widget is the data boundary. It fetches data and provides context to all children.

### Source config

```typescript
interface WidgetSource {
  model: string; // qualified model name (e.g. "sales.order")
  id?: string; // reactive variable path — if present, fetches single record
}
```

### Behavior

The rule is simple: `id` present = single record, `id` absent = collection.

| Source config                                       | Fetch behavior                                                    |
| --------------------------------------------------- | ----------------------------------------------------------------- |
| `{ model: 'sales.order', id: '$route.id' }`         | Fetches single record by route param                              |
| `{ model: 'sales.order', id: '$state.selectedId' }` | Fetches single record by the value of `$state.selectedId`         |
| `{ model: 'sales.order', id: 'customer_id' }`       | Fetches single record by `customer_id` from parent record context |
| `{ model: 'sales.order' }`                          | Fetches collection. Responds to `$filter`, `$sort`, `$page`.      |

**Record mode** (`id` present): When `id` resolves to null/undefined, renders nothing (or placeholder). When it resolves to a value, fetches that record and provides it as context to children.

**Collection mode** (no `id`): Fetches a list of records. Children that need iteration use a `repeat` or `table` widget. Non-repeating children (headers, filter bars, empty states) render once.

### Usage

```typescript
// record — explicit id from route
{ type: 'data', source: { model: 'sales.order', id: '$route.id' }, children: [
  { type: 'input', bind: { field: 'customer_id' } },
  { type: 'input', bind: { field: 'order_date' } },
] }

// master-detail — fetches by $state
{ type: 'data', source: { model: 'sales.order', id: '$state.selectedId' }, children: [
  { type: 'text', bind: { field: 'name' } },
] }

// collection — card grid with repeat
{ type: 'data', source: { model: 'sales.product' }, children: [
  { type: 'text', props: { style: 'heading', content: 'Products' } },
  { type: 'repeat', props: { layout: 'grid', columns: 3 }, children: [
    { type: 'image', bind: { field: 'thumbnail' } },
    { type: 'text', bind: { field: 'name' }, props: { style: 'bold' } },
    { type: 'text', bind: { field: 'price' }, props: { style: 'muted' } },
  ] },
] }

// nested related data — id from parent record
{ type: 'data', source: { model: 'sales.order', id: '$route.id' }, children: [
  { type: 'input', bind: { field: 'customer_id' } },
  { type: 'data', source: { model: 'sales.customer', id: 'customer_id' }, children: [
    { type: 'text', bind: { field: 'company_name' } },
    { type: 'text', bind: { field: 'phone' } },
  ] },
] }
```

### Context creation

The `data` widget creates a new context scope. In record mode, children resolve field bindings against the fetched record. In collection mode, the `repeat` widget iterates and creates row-level context per record. Parent context is accessible via `$parent.*` references.

---

## 5. Reactive Variables

All dynamic behavior is controlled by reactive variables set via `setValue` actions.

### Namespaces

| Variable                          | Purpose                        | Example                              |
| --------------------------------- | ------------------------------ | ------------------------------------ |
| `$state.{key}`                    | Ephemeral UI state             | `$state.activeTab`, `$state.loading` |
| `$filter.{model}.{field}[__{op}]` | Filter a list source           | `$filter.sales.order.status`         |
| `$sort.{model}`                   | Sort a list source             | `$sort.sales.order`                  |
| `$page.{model}`                   | Paginate a list source         | `$page.sales.order`                  |
| `$route.id`                       | Route parameter (record pages) | Read-only                            |

### $state

Flat key-value store for ephemeral UI state. Shared across the entire page. Never persisted.

- Flat. Keys are strings, values are any scalar.
- Page-scoped. All widgets on the page share the same `$state`.
- Undeclared. No schema needed. Write any key at any time.
- Reactive. Widgets referencing a `$state` key re-render when it changes.

### $filter

Controls filtering on list data sources (table widget, data widget in list mode).

```
$filter.sales.order.status = 'draft'                // eq
$filter.sales.order.status = ['draft', 'pending']   // in (array value)
$filter.sales.order.total__gt = 100                 // greater than
$filter.sales.order.total__gte = 100                // greater than or equal
$filter.sales.order.total__lt = 1000                // less than
$filter.sales.order.total__lte = 1000               // less than or equal
$filter.sales.order.name__like = 'acme'             // contains
$filter.sales.order.deleted_at__empty = true        // is null
$filter.sales.order.email__not_empty = true         // is not null
```

**Suffixes:**

| Suffix        | Operator                         |
| ------------- | -------------------------------- |
| (none)        | `eq` (or `in` if value is array) |
| `__gt`        | greater than                     |
| `__gte`       | greater than or equal            |
| `__lt`        | less than                        |
| `__lte`       | less than or equal               |
| `__like`      | contains                         |
| `__empty`     | is null/empty                    |
| `__not_empty` | is not null/empty                |

### $sort

Controls sort on list data sources. Value is a comma-separated string. Prefix `-` for descending.

```
$sort.sales.order = '-date'           // single: date descending
$sort.sales.order = '-date,name'      // multi: date desc, then name asc
$sort.sales.order = null              // clear: use model default
```

### $page

Controls pagination on list data sources. Value is a page number.

```
$page.sales.order = 2
```

### $route

Read-only. Contains route parameters.

```
$route.id     // the :id param on record pages
```

---

## 6. Data Binding

Binding connects a widget to data. The `bind` field on a WidgetNode declares the connection.

### Binding types

#### Field binding

Binds to a field on the nearest record in scope (from a parent `data` widget or table row).

```json
{ "bind": { "field": "customer_id" } }
```

Runtime provides: value, setValue, field metadata.

#### Expression binding

Computed read-only value.

```json
{ "bind": { "expression": "{{qty * rate}}" } }
```

#### Model binding (table widget)

Widget fetches its own list data. Creates row-level context for each record.

```json
{ "bind": { "model": { "name": "sales.order", "filters": { "status": "draft" }, "limit": 10 } } }
```

The table widget responds to `$filter.{model}.*`, `$sort.{model}`, and `$page.{model}` reactive variables.

#### Field binding for collections (repeat/table)

Binds to an array field on the parent record (eager-loaded relation). Each item in the array becomes a row context.

```json
{ "bind": { "field": "line_items" } }
```

Used by `repeat` and `table` to iterate over hasMany relations without a separate fetch.

#### No binding

Widget renders from props only. Omit `bind`.

### Scope resolution

| Reference             | Resolves to                                 |
| --------------------- | ------------------------------------------- |
| `fieldName`           | Field on nearest record in scope            |
| `$parent.fieldName`   | One context level up                        |
| `$root.fieldName`     | Top-level page record                       |
| `$state.keyName`      | Page-level UI state                         |
| `$route.id`           | Route parameter                             |
| `$response.fieldName` | Service response (inside onSuccess/onError) |

---

## 7. Context Tree

The runtime maintains a context tree mirroring the widget tree.

### Context creation rules

- Layout widgets (`group`, `section`, `split`, `grid`) do NOT create context. They pass through.
- `data` widget in record mode creates a context scope from its fetched record.
- `data` widget in collection mode provides `records[]` for child `repeat`/`table` widgets.
- `repeat` widget iterates and creates a row-level context per record.
- `table` widget creates a context scope. Each row creates a row-level context.
- Nested `data` widgets create child scopes with `$parent` reference.

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

---

## 8. Triggers and Actions

### Triggers

Events a widget can emit. Declared in `defineWidget()`.

**Common triggers:**

| Widget type    | Triggers                           |
| -------------- | ---------------------------------- |
| Input widgets  | `change`, `focus`, `blur`          |
| Action widgets | `click`                            |
| Table widget   | `rowClick`, `select`, `pageChange` |
| Any widget     | `mount`                            |

### Actions

What happens in response to a trigger.

#### Data actions

```typescript
{ type: 'setValue', field: string, value: any }
{ type: 'clearValue', field: string }
{ type: 'setValues', values: Record<string, any> }
```

#### Backend actions

```typescript
{ type: 'service', name: string, params?: Record<string, any>,
  onSuccess?: WidgetAction, onError?: WidgetAction }
{ type: 'validate', fields?: string[] }
```

#### Model actions

```typescript
{ type: 'model.create', model: string, data: Record<string, any> }
{ type: 'model.update', model?: string, id?: string, data: Record<string, any> }
{ type: 'model.delete', model?: string, id?: string }
{ type: 'model.fetch', model: string, id: string, into: string }
{ type: 'model.list', model: string, filters?: Record<string, any>, into: string }
```

#### Navigation

```typescript
{ type: 'navigate', path: string }
```

#### UI actions

```typescript
{ type: 'focus', field: string }
```

#### Child table actions

```typescript
{ type: 'addRow', field: string }
{ type: 'removeRow', field: string }
{ type: 'duplicateRow', field: string }
```

#### Flow control

```typescript
{ type: 'sequence', actions: WidgetAction[] }
{ type: 'conditional', condition: Condition, then: WidgetAction, else?: WidgetAction }
```

### Removed actions

The following actions are no longer needed. Overlay visibility is controlled by `$state` + `visible` conditions:

- ~~`openDrawer`~~
- ~~`closeDrawer`~~
- ~~`refreshPanel`~~

---

## 9. Expression Language

Same as v1. A small sandboxed expression language for computing values. Any string containing `{{}}` is an expression.

```
{{qty * rate}}
{{format_currency(sum(items.amount), $parent.currency)}}
{{if(status == 'draft', 'Pending', upper(status))}}
```

See widget-system.md section 9 for full grammar, operators, and built-in functions.

---

## 10. Conditional Rendering

The `visible` field on a WidgetNode controls whether the widget renders.

```json
{ "visible": { "field": "$state.drawerOpen", "operator": "eq", "value": true } }
```

Multiple conditions AND together:

```json
{
  "visible": [
    { "field": "status", "operator": "eq", "value": "draft" },
    { "field": "total", "operator": "gt", "value": 0 }
  ]
}
```

All overlay widgets (drawer, modal) use `visible` for open/close state.

---

## 11. Built-in Widgets

### Input

| Widget  | Category | Container | Binding | Triggers            |
| ------- | -------- | --------- | ------- | ------------------- |
| `input` | input    | no        | field   | change, focus, blur |

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
| `split`   | layout   | yes       | none    | —        |
| `grid`    | layout   | yes       | none    | —        |
| `divider` | layout   | no        | none    | —        |
| `spacer`  | layout   | no        | none    | —        |

### Action

| Widget   | Category | Container | Binding | Triggers |
| -------- | -------- | --------- | ------- | -------- |
| `button` | action   | no        | none    | click    |

### Data

| Widget   | Category | Container | Binding     | Triggers                     |
| -------- | -------- | --------- | ----------- | ---------------------------- |
| `data`   | data     | yes       | none        | load, error                  |
| `repeat` | data     | yes       | field/none  | —                            |
| `table`  | data     | yes       | model/field | rowClick, select, pageChange |
| `column` | layout   | yes       | field/none  | —                            |

### Overlay

| Widget   | Category | Container | Binding | Triggers |
| -------- | -------- | --------- | ------- | -------- |
| `drawer` | layout   | yes       | none    | —        |
| `modal`  | layout   | yes       | none    | —        |

### Widget details

#### input

Text input bound to a field. Renders appropriate control based on field metadata (text, number, date, select, etc.).

Props:

- `label`: string (overrides field label from metadata)
- `placeholder`: string
- `readOnly`: boolean
- `disabled`: boolean
- `type`: 'text' | 'number' | 'date' | 'select' | 'textarea' (auto-detected from field metadata if omitted)

Triggers:

- `change` — value changed
- `focus` — input focused
- `blur` — input blurred

#### text

Displays text content. Binds to a field value or expression.

Props:

- `style`: 'body' | 'caption' | 'heading' | 'bold' | 'muted'
- `align`: 'left' | 'center' | 'right'

#### badge

Displays a colored label. Binds to a field.

Props:

- `colorMap`: Record<string, string> (maps field values to color names)
- `variant`: 'solid' | 'outline' | 'subtle' (default: 'subtle')

#### icon

Displays an icon from the icon set.

Props:

- `name`: string (icon identifier, e.g. 'chevron-right')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `color`: string

Triggers:

- `click` — icon clicked

#### image

Displays an image. Binds to a field (URL) or expression.

Props:

- `alt`: string
- `width`: number | string
- `height`: number | string
- `fit`: 'cover' | 'contain' | 'fill' (default: 'cover')

#### group

Groups children in a row or column. No visual chrome.

Props:

- `direction`: 'row' | 'column' (default: 'column')
- `gap`: 'sm' | 'md' | 'lg' (default: 'md')
- `align`: 'start' | 'center' | 'end' | 'stretch'
- `wrap`: boolean (default: false, for row direction)

#### section

Visual grouping with a label and optional collapsibility.

Props:

- `label`: string
- `collapsible`: boolean (default: false)
- `collapsed`: boolean (default: false, initial collapsed state)

#### split

Splits children into columns with configurable sizes.

Props:

- `sizes`: number[] (percentage widths, e.g. `[60, 40]` or `[25, 50, 25]`)
- `direction`: 'horizontal' | 'vertical' (default: 'horizontal')

#### grid

Arranges children in a responsive grid.

Props:

- `columns`: number (default: 4)
- `gap`: 'sm' | 'md' | 'lg'

#### divider

Horizontal rule separator between widgets.

Props:

- `margin`: 'sm' | 'md' | 'lg' (default: 'md')

#### spacer

Empty space between widgets. Expands to fill available space in flex layouts.

Props:

- `size`: number | string (fixed size in px, or omit to flex-grow)

#### button

Clickable action trigger. Does not bind to data.

Props:

- `variant`: 'primary' | 'secondary' | 'ghost' | 'danger' (default: 'secondary')
- `icon`: string (icon name, displayed before label)
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `disabled`: boolean
- `loading`: boolean

Triggers:

- `click` — button clicked

#### repeat

Iterates over a collection and renders children once per record. Creates row-level context for each iteration. This is the primitive loop widget. `table` is a `repeat` with built-in chrome (headers, pagination, sorting).

Props:

- `layout`: 'list' | 'grid' (default: 'list')
- `columns`: number (when layout is 'grid', default: 3)
- `gap`: 'sm' | 'md' | 'lg' (default: 'md')

Binding:

- `bind: { field: 'line_items' }` — iterates over an array field from parent record (eager loaded relation)
- No `bind` — iterates over records from parent `data` widget in collection mode

```typescript
// from parent data collection
{ type: 'data', source: { model: 'sales.product' }, children: [
  { type: 'repeat', props: { layout: 'grid', columns: 3 }, children: [
    { type: 'text', bind: { field: 'name' } },
    { type: 'badge', bind: { field: 'status' } },
  ] },
] }

// from eager-loaded relation field
{ type: 'data', source: { model: 'sales.order', id: '$route.id' }, children: [
  { type: 'repeat', bind: { field: 'line_items' }, children: [
    { type: 'input', bind: { field: 'product_id' } },
    { type: 'input', bind: { field: 'qty' } },
    { type: 'input', bind: { field: 'price' } },
  ] },
] }
```

#### table

Fetches a list of records and renders rows. Creates row-level context for each record. Responds to `$filter`, `$sort`, and `$page` reactive variables. Includes built-in pagination.

Props:

- `bordered`: boolean
- `striped`: boolean
- `selectable`: boolean (enables row selection)
- `pageSize`: number (default: 25)
- `emptyText`: string (shown when no records)

Source: uses `bind.model` to fetch its own data, or `bind.field` to render an eager-loaded array from parent record.

```typescript
// own fetch
{ type: 'table', bind: { model: { name: 'sales.order' } }, children: [...] }

// eager-loaded relation
{ type: 'table', bind: { field: 'line_items' }, children: [...] }
```

Triggers:

- `rowClick` — row clicked (row record in context)
- `select` — selection changed (selected ids in event)
- `pageChange` — page changed

#### column

Declares a column inside a `table` widget. Not rendered standalone.

Props:

- `label`: string (column header)
- `width`: string (e.g. '100px', '20%')
- `align`: 'left' | 'center' | 'right'
- `sortable`: boolean (default: false)

Binding: if `bind.field` is set, renders the field value directly. If `children` are provided, renders children with row context instead.

#### data

Data boundary. Fetches a record (with `id`) or collection (without `id`) and provides context to children. See section 4.

Props:

- `placeholder`: string (shown when id resolves to null)
- `loading`: string (shown while fetching)

Source:

- `model`: string (required)
- `id`: string (reactive variable path)

Triggers:

- `load` — data fetched successfully
- `error` — fetch failed

#### drawer

Slide-in panel from the right side. Renders as overlay.

Props:

- `width`: 'sm' | 'md' | 'lg' (default: 'md')
- `title`: string
- `closable`: boolean (default: true)

Controlled by `visible` condition.

#### modal

Centered overlay with backdrop.

Props:

- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `title`: string
- `closable`: boolean (default: true)

Controlled by `visible` condition.

---

## 12. Opinionated Widgets

Opinionated widgets are pre-composed complex widgets registered via `defineWidget()`. They participate in the same system as any other widget: same context tree, same binding, same actions, same reactive variables.

The architecture supports them. They are not specified here. Each opinionated widget (form, kanban, gantt, calendar, etc.) will have its own spec when designed.

### Structure requirements

An opinionated widget must:

- Register via `defineWidget()` with `category: 'data'`
- Declare `binding: 'model'` (fetches its own data)
- Accept `children` for template customization (e.g. kanban card template)
- Respond to `$filter`, `$sort`, `$page` reactive variables for its bound model
- Create row-level context so children can bind to individual records
- Emit triggers for user interactions (clicks, drops, selections)

---

## 13. Builder API

Chainable builders that produce WidgetNode JSON. Optional DX layer.

### Widget factories

```typescript
$input(field)       $text(content)      $button(label)
$badge(field)       $icon(name)         $image(src)
$group(direction)   $section(label)     $split(sizes)
$grid(columns)      $divider()          $spacer()
$table(model)       $column(label)      $data(model)
$repeat(layout)     $drawer(width)      $modal(size)
```

### Action factories

```typescript
setValue(field, value)       clearValue(field)
setValues(values)           service(name, params?)
navigate(path)              sequence(...actions)
conditional(condition, then, else?)
```

### Page factory

```typescript
page(key, label).widgets([...]).toJSON()
```

### Example

```typescript
export default page('sales.orders', 'Sales Orders')
  .widgets([
    $split([60, 40]).children([
      $table('sales.order')
        .on('rowClick', setValue('$state.selectedId', '{{id}}'))
        .children([$column('Name').field('name'), $column('Status').children([$badge('status')])]),
      $data('sales.order', { id: '$state.selectedId' }).children([
        $text('name').style('heading'),
        $badge('status'),
      ]),
    ]),
  ])
  .toJSON();
```

---

## 14. Custom Widgets

Developers register custom widgets via `defineWidget()` with full React power.

```typescript
defineWidget({
  name: 'sales.pipeline-board',
  label: 'Pipeline Board',
  category: 'display',
  schema: { showLabels: { type: 'boolean', default: true } },
  binding: 'none',
  triggers: ['dealSelect'],
  container: false,
  component: ({ props, on }) => {
    const state = usePageState();
    const action = useAction();
    const shell = useShell();
    // full React — any library, any logic
    return <PipelineBoard onSelect={(id) => on.dealSelect?.(id)} />;
  },
})
```

Custom widgets participate in the same system: same context, same `$state`, same actions, same expression resolution.

### Hooks available to custom widgets

```typescript
usePageState(); // read/write $state
useAction(); // fire actions programmatically
useShell(); // toast, confirm, setTitle
useWidgetContext(); // access current record/model/mode
```

---

## 15. Rendering Chain

```
Route match
  → Shell (sidebar, topbar)
    → PageRenderer (looks up PageDefinition by key)
      → WidgetRenderer (recursive, walks widgets tree)
        → for each WidgetNode:
          → evaluate visible conditions
          → resolve props expressions
          → resolve binding
          → render component with WidgetProps
          → if container: recurse into children
```

No panels. No views. No layout renderer. The widget tree IS the page.

---

## 16. What Changes from v1

### Removed concepts

| Concept                               | Replacement                              |
| ------------------------------------- | ---------------------------------------- |
| `panels` on PageDefinition            | Widget tree in `widgets`                 |
| `layout` field (full/split/dashboard) | `split`, `grid` widgets                  |
| `defineView()` / ViewRegistry         | Everything is a widget                   |
| `source` on panels                    | `data` widget                            |
| `context` wiring                      | Automatic from `data` widget nesting     |
| `ComponentRenderer`                   | Removed                                  |
| `PanelSlot`                           | Removed                                  |
| `LayoutRenderer` layout modes         | Removed                                  |
| `CanvasComponent`                     | Removed (no views)                       |
| `openDrawer` / `closeDrawer` actions  | `visible` + `$state` on `drawer` widget  |
| `refreshPanel` action                 | `refreshSource` still exists             |
| Slot declarations on views            | Container widgets have children directly |

### Kept unchanged

| Concept                                               | Notes                                                                              |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Widget system core (expressions, conditions, actions) | Unchanged                                                                          |
| `defineWidget()` API                                  | Added `data` category                                                              |
| WidgetNode shape                                      | Added `source` field                                                               |
| `$state` reactivity                                   | Unchanged                                                                          |
| Action system                                         | Removed drawer actions, added nothing                                              |
| Builder API                                           | Extended with `$data`, `$repeat`, `$split`, `$grid`, `$drawer`, `$modal`, `page()` |
| Shell (sidebar, topbar, navigation)                   | Still exists outside widget tree                                                   |

### New concepts

| Concept                   | Purpose                              |
| ------------------------- | ------------------------------------ |
| `data` widget             | Data fetching and context creation   |
| `repeat` widget           | Primitive loop / collection iterator |
| `split` widget            | Multi-column layout                  |
| `grid` widget             | Grid layout                          |
| `drawer` widget           | Overlay slide-in panel               |
| `modal` widget            | Overlay centered dialog              |
| `$filter.{model}.{field}` | Reactive list filtering              |
| `$sort.{model}`           | Reactive list sorting                |
| `$page.{model}`           | Reactive pagination                  |
| `$route.id`               | Route parameter access               |
| `page.widgets`            | Flat widget tree replaces panels     |

---

## 17. Boot Payload

```typescript
interface BootResponse {
  user: BootUser;
  permissions: BootPermissions;
  navigation: NavigationTree[];
  pages: PageDefinition[];
  models: Record<string, ModelMeta>;
  widgets: WidgetDefinitionMeta[];
}
```

`views` field removed from boot response. Only widgets exist.

---

## 18. Validation at Boot

The framework validates page definitions at startup:

1. Every `WidgetNode.type` in `widgets` must reference a registered widget.
2. `props` validated against widget's `schema`.
3. `children` only allowed if widget has `container: true`.
4. If widget has `accepts`, children types are checked.
5. `on` keys must match widget's declared `triggers`.
6. `bind` mode must match widget's declared `binding` mode.
7. `source` only allowed on widgets that support it (`data`).

Invalid definitions produce a startup error with the path (e.g. `pages.sales.orders.widgets[0].children[1]`).

---

## 19. Build Phases

### Phase 1: Spec alignment

Update shared types. Remove panels, views, layout from PageDefinition. Add `widgets` field. Update `defineWidget` to accept `data` category. Add `WidgetSource` type.

### Phase 2: New layout widgets

Implement `split`, `grid` widgets. Update `group` if needed.

### Phase 3: Data widget and repeat

Implement `data` widget with reactive source fetching. Record mode: fetch by `id`. Collection mode: fetch list, respond to `$filter`/`$sort`/`$page`. Implement `repeat` widget as the primitive iterator. Handle id resolution from `$state` and parent context.

### Phase 4: Overlay widgets

Implement `drawer` and `modal` as container widgets controlled by `visible`.

### Phase 5: Reactive filter/sort/page

Implement `$filter`, `$sort`, `$page` reactive variables. Wire table widget to respond to them.

### Phase 6: Shell simplification

Remove `LayoutRenderer` layout modes, `PanelSlot`, `ComponentRenderer`, `CanvasComponent`. Replace with direct `WidgetRenderer` call from page route.

### Phase 7: Builder API update

Add `$data`, `$repeat`, `$split`, `$grid`, `$drawer`, `$modal`, `page()` builders. Remove `openDrawer`/`closeDrawer` action factories.

### Phase 8: Opinionated widgets

Separate specs. The architecture supports them via `defineWidget()` with `category: 'data'` and `binding: 'model'`.

### Phase 9: Migration

Update dev playground and test fixtures to new page structure. Remove view registry.
