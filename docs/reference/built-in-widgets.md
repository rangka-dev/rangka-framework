---
status: stable
since: 0.2.0
last-updated: 2026-06-21
description: All built-in widgets with props, triggers, and binding modes
---

# Built-in widgets

All widgets that ship with Rangka. Each widget follows the same contract as custom widgets defined via `defineWidget()`.

## Data source pattern

Data container widgets (`data`, `form`, `table`) use the `source` field to declare what model they operate on. This is separate from `bind` which handles field/expression value binding.

```typescript
source: { model: string; id?: string; filters?: Record<string, unknown>; limit?: number }
```

| Field     | Type   | Description                                                |
| --------- | ------ | ---------------------------------------------------------- |
| `model`   | string | Qualified model name (e.g. `sales.order`)                  |
| `id`      | string | Record ID or expression (`$route.id`, `$state.selectedId`) |
| `filters` | object | Static filters applied to the query                        |
| `limit`   | number | Maximum number of records                                  |

When `id` is set, the widget operates in record mode (single record). Otherwise it operates in collection mode (list).

The `id` field supports bare `$`-prefixed expressions without template syntax:

```typescript
// All equivalent for resolving the route parameter
source: { model: 'sales.order', id: '$route.id' }
source: { model: 'sales.order', id: '{{$route.id}}' }

// State variable
source: { model: 'sales.customer', id: '$state.selectedId' }
```

## Input widgets

### input

Text and number input field.

| Property      | Type    | Default | Description              |
| ------------- | ------- | ------- | ------------------------ |
| `label`       | string  |         | Field label              |
| `placeholder` | string  |         | Placeholder text         |
| `readOnly`    | boolean | `false` | Prevent editing          |
| `disabled`    | boolean | `false` | Disable the input        |
| `error`       | string  |         | Error message to display |
| `prefix`      | string  |         | Text before the input    |
| `suffix`      | string  |         | Text after the input     |
| `min`         | number  |         | Minimum numeric value    |
| `max`         | number  |         | Maximum numeric value    |
| `step`        | number  |         | Numeric step increment   |
| `pattern`     | string  |         | Regex validation pattern |

- Binding: `field`
- Triggers: `change`, `focus`, `blur`
- Container: no

---

### select

Dropdown selection from field options.

| Property      | Type    | Default | Description           |
| ------------- | ------- | ------- | --------------------- |
| `label`       | string  |         | Field label           |
| `placeholder` | string  |         | Placeholder text      |
| `searchable`  | boolean | `false` | Enable type-to-search |
| `disabled`    | boolean | `false` | Disable the select    |

- Binding: `field`
- Triggers: `change`
- Container: no

---

### checkbox

Boolean toggle input.

| Property   | Type    | Default | Description          |
| ---------- | ------- | ------- | -------------------- |
| `label`    | string  |         | Checkbox label       |
| `disabled` | boolean | `false` | Disable the checkbox |

- Binding: `field`
- Triggers: `change`
- Container: no

---

### textarea

Multiline text input.

| Property      | Type    | Default | Description       |
| ------------- | ------- | ------- | ----------------- |
| `label`       | string  |         | Field label       |
| `placeholder` | string  |         | Placeholder text  |
| `rows`        | number  | `4`     | Visible rows      |
| `disabled`    | boolean | `false` | Disable the input |
| `readOnly`    | boolean | `false` | Prevent editing   |

- Binding: `field`
- Triggers: `change`, `focus`, `blur`
- Container: no

---

### datepicker

Date selection input.

| Property   | Type    | Default | Description        |
| ---------- | ------- | ------- | ------------------ |
| `label`    | string  |         | Field label        |
| `disabled` | boolean | `false` | Disable the picker |

- Binding: `field`
- Triggers: `change`
- Container: no

---

### datetime

Date and time selection input.

| Property   | Type    | Default | Description        |
| ---------- | ------- | ------- | ------------------ |
| `label`    | string  |         | Field label        |
| `disabled` | boolean | `false` | Disable the picker |

- Binding: `field`
- Triggers: `change`
- Container: no

---

### money

Currency input with formatting.

| Property   | Type    | Default | Description       |
| ---------- | ------- | ------- | ----------------- |
| `label`    | string  |         | Field label       |
| `currency` | string  | `'$'`   | Currency symbol   |
| `disabled` | boolean | `false` | Disable the input |
| `readOnly` | boolean | `false` | Prevent editing   |

- Binding: `field`
- Triggers: `change`, `focus`, `blur`
- Container: no

---

### link

Foreign key reference picker. Searches and selects a record from the linked model.

| Property      | Type    | Default | Description        |
| ------------- | ------- | ------- | ------------------ |
| `label`       | string  |         | Field label        |
| `placeholder` | string  |         | Placeholder text   |
| `disabled`    | boolean | `false` | Disable the picker |

- Binding: `field`
- Triggers: `change`, `search`
- Container: no

---

### many-to-many

Multi-select for many-to-many relationships.

| Property      | Type    | Default | Description        |
| ------------- | ------- | ------- | ------------------ |
| `label`       | string  |         | Field label        |
| `placeholder` | string  |         | Placeholder text   |
| `disabled`    | boolean | `false` | Disable the picker |

- Binding: `field`
- Triggers: `change`, `search`
- Container: no

---

### dynamic-link

Polymorphic reference picker. The target model is determined by another field's value.

| Property     | Type    | Default | Description                             |
| ------------ | ------- | ------- | --------------------------------------- |
| `label`      | string  |         | Field label                             |
| `modelField` | string  |         | Field that stores the target model name |
| `models`     | array   |         | Allowed target models                   |
| `disabled`   | boolean | `false` | Disable the picker                      |

- Binding: `field`
- Triggers: `change`, `search`
- Container: no

---

### attachment

Single file upload.

| Property   | Type    | Default | Description                        |
| ---------- | ------- | ------- | ---------------------------------- |
| `label`    | string  |         | Field label                        |
| `accept`   | string  |         | Allowed MIME types                 |
| `maxSize`  | string  |         | Maximum file size (e.g., `'10mb'`) |
| `disabled` | boolean | `false` | Disable uploads                    |

- Binding: `field`
- Triggers: `change`, `remove`
- Container: no

---

### attachments

Multiple file upload.

| Property   | Type    | Default | Description                |
| ---------- | ------- | ------- | -------------------------- |
| `label`    | string  |         | Field label                |
| `accept`   | string  |         | Allowed MIME types         |
| `maxSize`  | string  |         | Maximum file size per file |
| `maxCount` | number  | `10`    | Maximum number of files    |
| `disabled` | boolean | `false` | Disable uploads            |

- Binding: `field`
- Triggers: `change`, `remove`
- Container: no

---

### code

Code editor with syntax highlighting.

| Property   | Type    | Default | Description                  |
| ---------- | ------- | ------- | ---------------------------- |
| `label`    | string  |         | Field label                  |
| `language` | string  |         | Syntax highlighting language |
| `rows`     | number  | `6`     | Visible rows                 |
| `disabled` | boolean | `false` | Disable editing              |

- Binding: `field`
- Triggers: `change`, `focus`, `blur`
- Container: no

---

### json

JSON editor with validation.

| Property   | Type    | Default | Description     |
| ---------- | ------- | ------- | --------------- |
| `label`    | string  |         | Field label     |
| `rows`     | number  | `6`     | Visible rows    |
| `disabled` | boolean | `false` | Disable editing |

- Binding: `field`
- Triggers: `change`, `focus`, `blur`
- Container: no

---

### tree

Hierarchical record picker for tree-structured models.

| Property      | Type    | Default | Description        |
| ------------- | ------- | ------- | ------------------ |
| `label`       | string  |         | Field label        |
| `placeholder` | string  |         | Placeholder text   |
| `disabled`    | boolean | `false` | Disable the picker |

- Binding: `field`
- Triggers: `change`, `search`
- Container: no

---

## Display widgets

### text

Displays text content bound to a field value.

| Property | Type | Default  | Description                          |
| -------- | ---- | -------- | ------------------------------------ |
| `style`  | enum | `'body'` | `heading`, `body`, `caption`, `bold` |

- Binding: `field`
- Triggers: none
- Container: no

---

### badge

Colored status label.

| Property   | Type   | Default     | Description                                      |
| ---------- | ------ | ----------- | ------------------------------------------------ |
| `variant`  | enum   | `'subtle'`  | `solid`, `outline`, `subtle`                     |
| `color`    | enum   | `'default'` | `default`, `success`, `warning`, `error`, `info` |
| `colorMap` | object |             | Maps field values to colors                      |

- Binding: `field`
- Triggers: none
- Container: no

---

### icon

Displays an icon from the icon set.

| Property | Type   | Default      | Description         |
| -------- | ------ | ------------ | ------------------- |
| `name`   | string | **required** | Icon name           |
| `size`   | number | `14`         | Icon size in pixels |
| `color`  | string |              | Icon color          |

- Binding: `none`
- Triggers: `click`
- Container: no

---

### image

Displays an image.

| Property | Type   | Default | Description                                |
| -------- | ------ | ------- | ------------------------------------------ |
| `src`    | string |         | Static image URL (overrides field binding) |
| `alt`    | string |         | Alt text                                   |
| `width`  | string |         | CSS width                                  |
| `height` | string |         | CSS height                                 |

- Binding: `field`
- Triggers: none
- Container: no

---

### computed

Displays a computed field value with formatting.

| Property | Type   | Default  | Description                          |
| -------- | ------ | -------- | ------------------------------------ |
| `label`  | string |          | Display label                        |
| `format` | enum   | `'text'` | `text`, `number`, `currency`, `date` |

- Binding: `field`
- Triggers: none
- Container: no

---

### sequence

Displays a sequence field value (auto-generated numbers like INV-00001).

| Property | Type   | Default | Description   |
| -------- | ------ | ------- | ------------- |
| `label`  | string |         | Display label |

- Binding: `field`
- Triggers: none
- Container: no

---

## Layout widgets

### group

Arranges children in a row or column with no visual chrome.

| Property    | Type    | Default    | Description                                   |
| ----------- | ------- | ---------- | --------------------------------------------- |
| `direction` | enum    | `'column'` | `row`, `column`                               |
| `align`     | enum    |            | `start`, `center`, `end`, `stretch`           |
| `justify`   | enum    |            | `start`, `center`, `end`, `between`, `around` |
| `gap`       | enum    | `'md'`     | `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`   |
| `wrap`      | boolean | `false`    | Wrap overflowing children                     |
| `padding`   | enum    |            | `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`   |
| `paddingX`  | enum    |            | Horizontal padding                            |
| `paddingY`  | enum    |            | Vertical padding                              |

- Binding: `none`
- Triggers: none
- Container: yes

---

### section

Visual grouping with a label and optional collapsibility.

| Property           | Type    | Default      | Description                                 |
| ------------------ | ------- | ------------ | ------------------------------------------- |
| `label`            | string  | **required** | Section heading                             |
| `collapsible`      | boolean | `false`      | Allow collapsing                            |
| `defaultCollapsed` | boolean | `false`      | Start collapsed                             |
| `padding`          | enum    | `'md'`       | `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl` |
| `icon`             | string  |              | Icon name beside the label                  |

- Binding: `none`
- Triggers: none
- Container: yes

---

### split

Splits children into resizable columns or rows.

| Property    | Type   | Default        | Description                                       |
| ----------- | ------ | -------------- | ------------------------------------------------- |
| `sizes`     | array  |                | Percentage sizes for each pane (e.g., `[60, 40]`) |
| `direction` | enum   | `'horizontal'` | `horizontal`, `vertical`                          |
| `minSize`   | number | `10`           | Minimum pane size percentage                      |
| `padding`   | enum   |                | `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`       |

- Binding: `none`
- Triggers: none
- Container: yes

---

### grid

Responsive grid layout.

| Property     | Type   | Default | Description                                 |
| ------------ | ------ | ------- | ------------------------------------------- |
| `columns`    | number | `3`     | Number of columns                           |
| `gap`        | enum   | `'md'`  | `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl` |
| `rowGap`     | enum   |         | Override gap for rows                       |
| `colGap`     | enum   |         | Override gap for columns                    |
| `autoFlow`   | enum   | `'row'` | `row`, `column`, `dense`                    |
| `responsive` | object |         | Breakpoint overrides                        |
| `padding`    | enum   |         | `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl` |
| `paddingX`   | enum   |         | Horizontal padding                          |
| `paddingY`   | enum   |         | Vertical padding                            |

- Binding: `none`
- Triggers: none
- Container: yes

---

### divider

Horizontal separator line.

| Property  | Type | Default | Description                    |
| --------- | ---- | ------- | ------------------------------ |
| `margin`  | enum |         | `none`, `sm`, `md`, `lg`, `xl` |
| `marginY` | enum |         | Vertical margin override       |

- Binding: `none`
- Triggers: none
- Container: no

---

### spacer

Empty space between elements.

| Property | Type | Default | Description                  |
| -------- | ---- | ------- | ---------------------------- |
| `size`   | enum | `'md'`  | `xs`, `sm`, `md`, `lg`, `xl` |

- Binding: `none`
- Triggers: none
- Container: no

---

### card

Visual card container with optional title and actions.

| Property      | Type   | Default     | Description           |
| ------------- | ------ | ----------- | --------------------- |
| `title`       | string |             | Card title            |
| `description` | string |             | Card description      |
| `size`        | enum   | `'default'` | `default`, `sm`       |
| `actions`     | array  |             | Header action buttons |
| `footer`      | array  |             | Footer content        |

- Binding: `none`
- Triggers: none
- Container: yes

---

### scroll-area

Scrollable container with a fixed height.

| Property    | Type   | Default      | Description                      |
| ----------- | ------ | ------------ | -------------------------------- |
| `direction` | enum   | `'vertical'` | `vertical`, `horizontal`, `both` |
| `height`    | string |              | CSS height                       |
| `maxHeight` | string |              | CSS max-height                   |

- Binding: `none`
- Triggers: none
- Container: yes

---

### stack

Vertical stack with height control.

| Property  | Type   | Default  | Description                                 |
| --------- | ------ | -------- | ------------------------------------------- |
| `height`  | string | `'auto'` | CSS height                                  |
| `padding` | enum   |          | `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl` |

- Binding: `none`
- Triggers: none
- Container: yes

---

### column

Declares a table column. Only valid as a direct child of `table`.

| Property     | Type    | Default      | Description               |
| ------------ | ------- | ------------ | ------------------------- |
| `label`      | string  | **required** | Column header text        |
| `width`      | string  |              | CSS width                 |
| `align`      | enum    | `'left'`     | `left`, `center`, `right` |
| `sortable`   | boolean |              | Enable column sorting     |
| `filterable` | boolean |              | Enable column filtering   |

- Binding: `none`
- Triggers: none
- Container: yes

---

### drawer

Slide-in panel from the right side.

| Property   | Type    | Default | Description       |
| ---------- | ------- | ------- | ----------------- |
| `width`    | enum    | `'md'`  | `sm`, `md`, `lg`  |
| `title`    | string  |         | Drawer title      |
| `closable` | boolean | `true`  | Show close button |

- Binding: `none`
- Triggers: none
- Container: yes

---

### modal

Centered overlay dialog.

| Property   | Type    | Default | Description       |
| ---------- | ------- | ------- | ----------------- |
| `size`     | enum    | `'md'`  | `sm`, `md`, `lg`  |
| `title`    | string  |         | Modal title       |
| `closable` | boolean | `true`  | Show close button |

- Binding: `none`
- Triggers: none
- Container: yes

---

## Action widgets

### button

Clickable action trigger.

| Property   | Type    | Default       | Description                                    |
| ---------- | ------- | ------------- | ---------------------------------------------- |
| `label`    | string  | **required**  | Button text                                    |
| `variant`  | enum    | `'secondary'` | `primary`, `secondary`, `ghost`, `destructive` |
| `size`     | enum    | `'md'`        | `sm`, `md`, `lg`                               |
| `disabled` | boolean | `false`       | Disable the button                             |
| `loading`  | boolean | `false`       | Show loading state                             |

- Binding: `none`
- Triggers: `click`
- Container: no

---

## Data widgets

### data

Data container that fetches a record or collection. Children render within the data context.

| Property      | Type   | Default | Description              |
| ------------- | ------ | ------- | ------------------------ |
| `placeholder` | string |         | Text shown while loading |
| `pageSize`    | number |         | Page size for collection |

- Source: `{ model, id?, filters?, limit? }`
- Binding: `none`
- Triggers: `load`, `error`
- Container: yes

```typescript
// Single record
{ type: 'data', source: { model: 'sales.order', id: '$route.id' }, children: [...] }

// Collection
{ type: 'data', source: { model: 'sales.product' }, children: [...] }
```

---

### form

Data container with form state management. Fetches a record for editing or provides a blank form for creation.

| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |

- Source: `{ model, id? }`
- Binding: `none`
- Triggers: `success`, `error`
- Container: yes

When `source.id` is set, the form loads the record and enters edit mode. Without `id`, the form starts in create mode.

```typescript
// Edit existing record
{ type: 'form', source: { model: 'sales.order', id: '$route.id' }, children: [...] }

// Create new record
{ type: 'form', source: { model: 'sales.order' }, children: [...] }
```

---

### repeat

Iterates over a collection, rendering children for each item.

| Property  | Type   | Default  | Description                          |
| --------- | ------ | -------- | ------------------------------------ |
| `layout`  | enum   | `'list'` | `list`, `grid`                       |
| `columns` | number | `3`      | Grid columns (when layout is `grid`) |
| `gap`     | enum   | `'md'`   | `sm`, `md`, `lg`                     |

- Binding: `field`
- Triggers: none
- Container: yes

---

### table

Data table with pagination, sorting, and selection.

| Property     | Type    | Default  | Description          |
| ------------ | ------- | -------- | -------------------- |
| `variant`    | enum    | `'card'` | `card`, `flat`       |
| `selectable` | boolean |          | Enable row selection |
| `bordered`   | boolean |          | Show cell borders    |
| `striped`    | boolean |          | Alternate row colors |
| `pageSize`   | number  |          | Rows per page        |
| `emptyText`  | string  |          | Text when no records |

- Source: `{ model, filters?, limit? }`
- Binding: `none`
- Triggers: `rowClick`, `select`, `pageChange`
- Container: yes (accepts `column` only)

When `pageSize` is set, the table fetches its own data (smart mode). Without `pageSize`, it reads records from a parent data container (passive mode).

```typescript
{
  type: 'table',
  source: { model: 'sales.order' },
  props: { pageSize: 10, selectable: true },
  children: [
    { type: 'column', props: { label: 'Customer', sortable: true }, bind: { field: 'customer' } },
    { type: 'column', props: { label: 'Status', filterable: true }, bind: { field: 'status' } },
  ],
}
```

---

### datagrid

Spreadsheet-like grid with inline editing, virtual scrolling, and infinite loading. Use the datagrid when users need to edit data inline, manage rows, or work with large datasets. Use the table widget for simple read-only lists.

| Property      | Type    | Default        | Description                                                |
| ------------- | ------- | -------------- | ---------------------------------------------------------- |
| `pageSize`    | number  | `50`           | Records per fetch batch (infinite scroll)                  |
| `maxHeight`   | number  | auto           | Max height in px. Defaults to `pageSize * rowHeight + 40`. |
| `rowHeight`   | enum    | `'default'`    | `compact` (32px), `default` (40px), `comfortable` (52px)   |
| `editable`    | boolean | `true`         | Enable inline cell editing                                 |
| `resizable`   | boolean | `true`         | Allow column width resizing                                |
| `reorderable` | boolean | `true`         | Allow column drag reordering                               |
| `selectable`  | boolean | `true`         | Show row numbers with checkbox on hover                    |
| `addRow`      | boolean | `false`        | Show add-row button in footer                              |
| `emptyText`   | string  | `'No records'` | Message when no data                                       |

- Source: `{ model, filters? }`
- Binding: `none`
- Triggers: `cellChange`, `rowSelect`, `rowCreate`, `rowDelete`
- Container: yes (accepts `column` only)

The datagrid uses infinite scroll. It fetches `pageSize` records per batch and loads more as the user scrolls near the bottom. There is no pagination UI.

Sorting is server-side. Click a column header to sort. Shift+click for multi-column sort. Sort stays stable during inline editing. Rows do not reorder after a cell edit.

New rows appear at the top of the grid. Required fields must be filled before the row persists to the server. The row shows placeholder labels for required fields until they are populated.

When `children` is empty the datagrid derives columns automatically from model metadata.

```typescript
{
  type: 'datagrid',
  source: { model: 'sales.order' },
  props: { pageSize: 50, editable: true, selectable: true, addRow: true },
  children: [
    { type: 'column', bind: { field: 'customer' }, props: { label: 'Customer', sortable: true, filterable: true } },
    { type: 'column', bind: { field: 'status' }, props: { label: 'Status', editable: true, filterable: true } },
    { type: 'column', bind: { field: 'total' }, props: { label: 'Total', sortable: true, editable: true } },
  ],
  on: {
    rowCreate: { type: 'refreshSource' },
    rowDelete: { type: 'refreshSource' },
  },
}
```

#### Column props (datagrid)

The datagrid reads these additional props on `column` children.

| Property     | Type    | Default            | Description                                      |
| ------------ | ------- | ------------------ | ------------------------------------------------ |
| `label`      | string  | field name         | Column header text                               |
| `width`      | string  | `'150'`            | Initial width in pixels                          |
| `minWidth`   | string  | `'80'`             | Minimum width during resize                      |
| `maxWidth`   | string  |                    | Maximum width during resize                      |
| `sortable`   | boolean | `false`            | Allow sorting by this column                     |
| `filterable` | boolean | `false`            | Include in filter options                        |
| `editable`   | boolean | inherits from grid | Override grid-level editable for this column     |
| `resizable`  | boolean | inherits from grid | Override grid-level resizable for this column    |
| `frozen`     | boolean | `false`            | Pin column to left edge during horizontal scroll |

#### Keyboard navigation

| Key              | Action                                     |
| ---------------- | ------------------------------------------ |
| Arrow keys       | Move active cell                           |
| Tab / Shift+Tab  | Move right/left, wrap to next/previous row |
| Enter / F2       | Enter edit mode                            |
| Escape           | Cancel edit or clear selection             |
| Delete/Backspace | Clear active cell value                    |
| Ctrl+C / Cmd+C   | Copy cell value to clipboard               |
| Ctrl+A / Cmd+A   | Select all rows                            |
| Home / End       | Move to first/last cell in row             |
| Ctrl+Home/End    | Move to first/last cell in grid            |

#### Inline editing

Double-click or press Enter/F2 to edit a cell. The editor type is selected based on the field's data type from model metadata. Edits save immediately on commit (blur or Enter). The cell value is optimistically updated without a full refetch.
