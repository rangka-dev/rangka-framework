---
status: stable
since: 0.3.0
last-updated: 2026-06-29
description: widget() and action() builder helpers for constructing WidgetNode and WidgetAction objects
---

# Widget and action builders

Typed factory functions for building `WidgetNode` and `WidgetAction` objects. These are optional helpers. You can always write raw objects instead.

## widget

The `widget` export is both a function and a namespace of helpers.

### Base function

Use `widget(type, opts)` for custom widgets or any widget type:

```typescript
import { widget } from 'rangka';

widget('kanban', { props: { columns: 'status' }, source: { model: 'sales.order' } });
widget('input', { bind: { field: 'name' }, props: { required: true } });
```

### WidgetOptions

| Field      | Type                                            | Description                          |
| ---------- | ----------------------------------------------- | ------------------------------------ |
| `props`    | Record\<string, unknown>                        | Static props passed to the component |
| `bind`     | WidgetBinding                                   | Data binding configuration           |
| `source`   | WidgetSource                                    | Data source (model, id, filters)     |
| `visible`  | Condition \| Condition[]                        | Visibility conditions                |
| `on`       | Record\<string, WidgetAction \| WidgetAction[]> | Event handlers                       |
| `children` | WidgetNode[]                                    | Child widgets                        |

### Named helpers

Each built-in widget type has a shortcut. The first argument is always the identity of the widget (field name, model name, or label depending on type). The second argument is an optional config object. Container widgets take a children array as the last argument.

#### Input widgets

Bind to a field. First argument is the field name.

```typescript
widget.input('name', { required: true, placeholder: 'Enter name' });
widget.textarea('notes');
widget.select('status', { options: ['Draft', 'Active', 'Closed'] });
widget.checkbox('active');
widget.datepicker('start_date');
widget.datetime('scheduled_at');
widget.money('total');
widget.link('customer', { required: true });
widget.attachment('document');
widget.attachments('files');
widget.json('config');
widget.code('template');
widget.tree('parent');
widget.sequence('reference');
widget.computed('full_name');
```

InputOptions:

| Field         | Type                                            | Description            |
| ------------- | ----------------------------------------------- | ---------------------- |
| `required`    | boolean                                         | Mark field as required |
| `placeholder` | string                                          | Placeholder text       |
| `visible`     | Condition \| Condition[]                        | Visibility conditions  |
| `on`          | Record\<string, WidgetAction \| WidgetAction[]> | Event handlers         |
| `props`       | Record\<string, unknown>                        | Additional props       |

SelectOptions extends InputOptions:

| Field     | Type              | Description    |
| --------- | ----------------- | -------------- |
| `options` | readonly string[] | Allowed values |

#### Display widgets

First argument is the field name (for text/badge) or a value (for icon/image).

```typescript
widget.text('total', { style: 'heading' });
widget.badge('status');
widget.icon('alert-circle');
widget.image('/logo.png');
```

TextOptions:

| Field   | Type | Description                                      |
| ------- | ---- | ------------------------------------------------ |
| `style` | enum | `heading`, `label`, `body`, `caption`, or `code` |

#### Layout widgets

Container widgets that organize children. First argument is config, last is children array.

```typescript
widget.section('Details', [
  widget.input('name'),
  widget.input('email'),
]);

widget.section('Advanced', { collapsible: true, defaultCollapsed: true }, [
  widget.input('config'),
]);

widget.group({ direction: 'row', gap: 'sm', justify: 'end' }, [
  widget.button('Cancel', { variant: 'ghost' }),
  widget.button('Save', { variant: 'primary' }),
]);

widget.grid({ columns: 2, gap: 'md' }, [
  widget.input('first_name'),
  widget.input('last_name'),
]);

widget.card({ title: 'Summary', description: 'Monthly totals' }, [
  widget.text('revenue', { style: 'heading' }),
]);

widget.split({ sizes: [60, 40], direction: 'horizontal' }, [
  widget.card({ title: 'Left' }, [...]),
  widget.card({ title: 'Right' }, [...]),
]);

widget.tabs(
  [{ label: 'General' }, { label: 'History' }, { label: 'Attachments' }],
  [
    widget.section('General', [...]),
    widget.stack({}, [...]),
    widget.stack({}, [...]),
  ]
);

widget.tabs(
  [{ label: 'Info' }, { label: 'Notes' }],
  { defaultTab: 0, size: 'sm' },
  [widget.section('Info', [...]), widget.section('Notes', [...])],
);

widget.modal({ size: 'lg', title: 'Confirm' }, [...]);
widget.drawer({ width: 'md', title: 'Details' }, [...]);
widget.scrollArea({ direction: 'vertical', maxHeight: '400px' }, [...]);
widget.stack({ height: '100%' }, [...]);

widget.spacer({ size: 'lg' });
widget.divider({ margin: 'md' });
```

ContainerOptions:

| Field       | Type    | Description                                             |
| ----------- | ------- | ------------------------------------------------------- |
| `direction` | enum    | `row` or `column`                                       |
| `align`     | enum    | `start`, `center`, `end`, `stretch`                     |
| `justify`   | enum    | `start`, `center`, `end`, `between`, `around`, `evenly` |
| `gap`       | enum    | `none`, `xs`, `sm`, `md`, `lg`, `xl`                    |
| `wrap`      | boolean | Wrap overflowing children                               |
| `padding`   | enum    | `none`, `sm`, `md`, `lg`, `xl`                          |
| `paddingX`  | enum    | Horizontal padding                                      |
| `paddingY`  | enum    | Vertical padding                                        |

GridOptions:

| Field        | Type                    | Description                 |
| ------------ | ----------------------- | --------------------------- |
| `columns`    | number                  | Number of columns           |
| `gap`        | enum                    | Gap size                    |
| `rowGap`     | enum                    | Override gap for rows       |
| `colGap`     | enum                    | Override gap for columns    |
| `autoFlow`   | enum                    | `row`, `column`, `dense`    |
| `responsive` | Record\<string, number> | Breakpoint column overrides |
| `padding`    | enum                    | Padding                     |

CardOptions:

| Field         | Type   | Description      |
| ------------- | ------ | ---------------- |
| `title`       | string | Card title       |
| `description` | string | Card description |
| `size`        | enum   | `sm`, `md`, `lg` |

SectionOptions:

| Field              | Type    | Description       |
| ------------------ | ------- | ----------------- |
| `collapsible`      | boolean | Allow collapsing  |
| `defaultCollapsed` | boolean | Start collapsed   |
| `padding`          | enum    | Padding size      |
| `icon`             | string  | Icon beside label |

TabsOptions:

| Field        | Type   | Description                                 |
| ------------ | ------ | ------------------------------------------- |
| `defaultTab` | number | Index of the initially active tab (0-based) |
| `size`       | enum   | `sm`, `md`                                  |

Each tab in the `tabs` array accepts:

| Field   | Type   | Description          |
| ------- | ------ | -------------------- |
| `label` | string | Tab label (required) |
| `icon`  | string | Icon name            |
| `badge` | string | Badge text           |

ModalOptions:

| Field      | Type    | Description                       |
| ---------- | ------- | --------------------------------- |
| `size`     | enum    | `sm`, `md`, `lg`, `xl`, or `full` |
| `title`    | string  | Modal title                       |
| `closable` | boolean | Show close button                 |

DrawerOptions:

| Field      | Type    | Description               |
| ---------- | ------- | ------------------------- |
| `width`    | enum    | `sm`, `md`, `lg`, or `xl` |
| `title`    | string  | Drawer title              |
| `closable` | boolean | Show close button         |

#### Data widgets

Provide data context for child widgets. First argument is the model name.

```typescript
widget.table('sales.order', [
  widget.column('name', { label: 'Name', sortable: true }),
  widget.column('status', { label: 'Status', filterable: true }),
  widget.column('total', { label: 'Total', align: 'right' }),
]);

widget.table('sales.order', { sortable: true, pageSize: 25 }, [widget.column('name')]);

widget.data('sales.customer', [widget.text('name', { style: 'heading' })]);

widget.data('sales.customer', { id: '$route.id' }, [widget.input('name')]);

widget.form('sales.order', { id: '$route.id' }, [
  widget.input('customer'),
  widget.button('Save', { on: { click: action.submit() } }),
]);

widget.form('sales.order', { mode: 'create' }, [widget.input('customer')]);

widget.datagrid('items', [
  widget.column('product'),
  widget.column('qty', { align: 'right' }),
  widget.column('amount', { align: 'right' }),
]);

widget.repeat('sales.order', [widget.text('name')]);
```

TableOptions:

| Field      | Type    | Description                |
| ---------- | ------- | -------------------------- |
| `sortable` | boolean | Enable table-level sorting |
| `pageSize` | number  | Rows per page              |
| `props`    | object  | Additional props           |

ColumnOptions:

| Field        | Type    | Description                  |
| ------------ | ------- | ---------------------------- |
| `label`      | string  | Column header text           |
| `width`      | string  | CSS width                    |
| `align`      | enum    | `left`, `center`, or `right` |
| `sortable`   | boolean | Enable column sorting        |
| `filterable` | boolean | Enable column filtering      |

#### Action widgets

```typescript
widget.button('Submit', { variant: 'primary', on: { click: action.submit() } });
widget.button('Delete', { variant: 'ghost', icon: 'trash' });
```

ButtonOptions:

| Field     | Type   | Description                        |
| --------- | ------ | ---------------------------------- |
| `variant` | enum   | `primary`, `secondary`, or `ghost` |
| `icon`    | string | Lucide icon name                   |

### Event handling

All widgets accept `on` in their config object:

```typescript
widget.input('customer', {
  on: { change: action.fetchOptions('contact', ['customer']) },
});

widget.button('Submit', {
  variant: 'primary',
  on: {
    click: action.sequence([action.service('sales.submit'), action.navigate('/sales/orders')]),
  },
});
```

### Visibility

All widgets accept `visible` in their config object:

```typescript
widget.section(
  'Payment Details',
  { visible: { field: 'payment_method', operator: 'eq', value: 'card' } },
  [widget.input('card_number')],
);
```

## action

The `action` export is both a function and a namespace of helpers.

### Base function

```typescript
import { action } from 'rangka';

action('navigate', { path: '/home' });
```

### Named helpers

```typescript
// Navigation
action.navigate('/sales/orders');

// Form
action.submit();
action.reset();

// Field manipulation
action.setValue('status', 'submitted');
action.clearValue('notes');
action.setValues({ status: 'submitted', reviewed: true });

// Data fetching
action.fetchOptions('contact', ['customer']);
action.refreshSource();

// Service call
action.service('sales.submitInvoice');
action.service('sales.export', { format: 'csv' });

// Model operations
action.modelCreate('sales.order', { status: 'draft' });
action.modelUpdate({ status: 'confirmed' });
action.modelUpdate({ status: 'confirmed' }, { model: 'sales.order', id: '$id' });
action.modelDelete();
action.modelDelete({ model: 'sales.order', id: '$id' });
action.modelFetch('sales.order', '$id', 'currentOrder');
action.modelList('sales.order', 'orders', { status: 'active' });

// Field focus
action.focus('email');

// Table row operations
action.addRow('items');
action.removeRow('items');
action.duplicateRow('items');

// Validation
action.validate();
action.validate(['email', 'phone']);

// Toast
action.toast('Saved successfully');
action.toast('Something went wrong', 'error');

// Composition
action.sequence([action.service('sales.submit'), action.navigate('/sales/orders')]);

action.conditional(
  { field: 'status', operator: 'eq', value: 'Draft' },
  action.modelDelete(),
  action.navigate('/sales/orders'),
);
```

## Full page example

```typescript
import { definePage, widget, action } from 'rangka';

export default definePage({
  key: 'sales.invoice-form',
  label: 'Invoice',
  path: '/sales/invoices/$id',
  widgets: [
    widget.form('sales.invoice', { id: '$route.id' }, [
      widget.grid({ columns: 2 }, [
        widget.card({ title: 'Invoice Details' }, [
          widget.input('customer', {
            required: true,
            on: { change: action.fetchOptions('contact', ['customer']) },
          }),
          widget.sequence('invoice_number'),
          widget.datepicker('date'),
          widget.select('status', { options: ['Draft', 'Submitted', 'Paid'] }),
        ]),

        widget.card({ title: 'Payment' }, [
          widget.select('payment_terms', { options: ['Net 15', 'Net 30', 'Net 60'] }),
          widget.datepicker('due_date'),
          widget.money('total'),
        ]),
      ]),

      widget.card({ title: 'Line Items' }, [
        widget.datagrid('items', [
          widget.column('product', { label: 'Product' }),
          widget.column('qty', { label: 'Qty', align: 'right' }),
          widget.column('rate', { label: 'Rate', align: 'right' }),
          widget.column('amount', { label: 'Amount', align: 'right' }),
        ]),
      ]),

      widget.group({ direction: 'row', justify: 'end', gap: 'sm' }, [
        widget.button('Cancel', {
          variant: 'ghost',
          on: { click: action.navigate('/sales/invoices') },
        }),
        widget.button('Save', { variant: 'primary', on: { click: action.submit() } }),
      ]),
    ]),
  ],
});
```
