import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { Button } from '../../src/primitives/button';
import { Icon } from '../../src/primitives/icon';
import { FilterBar } from '../../src/data/filter-bar';
import { PageShell } from './page-shell';
import { TableWidget } from '../../src/widgets/data/table-widget';
import {
  InputWidget,
  SelectWidget,
  MoneyWidget,
  DatePickerWidget,
  DateTimeWidget,
  LinkWidget,
  TextareaWidget,
  CheckboxWidget,
  AttachmentWidget,
  TreeWidget,
  ManyToManyWidget,
  JsonWidget,
} from '../../src/widgets/input';
import { TextWidget, BadgeWidget, SequenceWidget } from '../../src/widgets/display';
import { ButtonWidget } from '../../src/widgets/action';
import {
  GridWidget,
  CardWidget,
  StackWidget,
  GroupWidget,
  SectionWidget,
  DividerWidget,
} from '../../src/widgets/layout';

const meta: Meta = {
  title: 'Widget Compose/Auto CRUD',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

// --- Field metadata types (mirrors FieldMeta from boot payload) ---

interface FieldMeta {
  name: string;
  type: string;
  label?: string;
  required?: boolean;
  hidden?: boolean;
  readOnly?: boolean;
  searchable?: boolean;
  options?: string[];
  relationship?: {
    type: 'link' | 'hasMany' | 'children' | 'manyToMany' | 'dynamicLink';
    model?: string;
    foreignKey?: string;
  };
  default?: unknown;
}

interface ModelMeta {
  name: string;
  label: string;
  naming?: string;
  traits?: string[];
  fields: FieldMeta[];
}

// --- Layout heuristics ---

type FieldSize = 'short' | 'wide';

function getFieldSize(f: FieldMeta): FieldSize {
  const wideTypes = [
    'text',
    'json',
    'code',
    'attachment',
    'attachments',
    'manyToMany',
    'hasMany',
    'children',
  ];
  if (wideTypes.includes(f.type)) return 'wide';
  if (f.relationship?.type === 'hasMany' || f.relationship?.type === 'children') return 'wide';
  return 'short';
}

function isTraitField(name: string): boolean {
  return ['created_at', 'updated_at', 'deleted_at'].includes(name);
}

function sortFields(model: ModelMeta): {
  basic: FieldMeta[];
  details: FieldMeta[];
  wide: FieldMeta[];
  relations: FieldMeta[];
  system: FieldMeta[];
} {
  const visible = model.fields.filter((f) => !f.hidden && f.name !== 'id');

  const basic: FieldMeta[] = [];
  const details: FieldMeta[] = [];
  const wide: FieldMeta[] = [];
  const relations: FieldMeta[] = [];
  const system: FieldMeta[] = [];

  for (const f of visible) {
    if (isTraitField(f.name)) {
      system.push(f);
      continue;
    }
    if (f.relationship?.type === 'hasMany' || f.relationship?.type === 'children') {
      relations.push(f);
      continue;
    }
    if (getFieldSize(f) === 'wide') {
      wide.push(f);
      continue;
    }
    if (f.name === model.naming || f.type === 'sequence') {
      basic.unshift(f);
      continue;
    }
    if (f.required) {
      basic.push(f);
      continue;
    }
    details.push(f);
  }

  return { basic, details, wide, relations, system };
}

function getListColumns(
  model: ModelMeta,
): { field: string; label: string; sortable?: boolean; align?: 'right' }[] {
  const skip = [
    'text',
    'json',
    'code',
    'attachment',
    'attachments',
    'hasMany',
    'children',
    'manyToMany',
  ];
  const cols: { field: string; label: string; sortable?: boolean; align?: 'right' }[] = [];

  for (const f of model.fields) {
    if (f.hidden || skip.includes(f.type)) continue;
    if (f.relationship?.type === 'hasMany' || f.relationship?.type === 'children') continue;
    if (f.name === 'id') continue;
    if (cols.length >= 7) break;
    const align =
      f.type === 'money' || f.type === 'decimal' || f.type === 'int'
        ? ('right' as const)
        : undefined;
    cols.push({
      field: f.name,
      label: f.label ?? f.name,
      sortable: f.searchable ?? f.required,
      align,
    });
  }
  return cols;
}

// --- Model definitions (mirrors real YAML models) ---

const customerModel: ModelMeta = {
  name: 'sales.customer',
  label: 'Customer',
  naming: 'name',
  traits: ['timestamped', 'soft_delete'],
  fields: [
    { name: 'name', type: 'string', label: 'Customer Name', required: true, searchable: true },
    { name: 'email', type: 'string', label: 'Email', required: true, searchable: true },
    { name: 'phone', type: 'string', label: 'Phone' },
    { name: 'is_active', type: 'boolean', label: 'Active', default: true },
    { name: 'credit_limit', type: 'decimal', label: 'Credit Limit' },
    {
      name: 'payment_terms',
      type: 'enum',
      label: 'Payment Terms',
      options: ['Net 15', 'Net 30', 'Net 60', 'COD'],
    },
    {
      name: 'category',
      type: 'link',
      label: 'Category',
      relationship: { type: 'link', model: 'sales.customer_category' },
    },
    { name: 'notes', type: 'text', label: 'Notes' },
    { name: 'logo', type: 'attachment', label: 'Logo' },
    {
      name: 'tags',
      type: 'manyToMany',
      label: 'Tags',
      relationship: { type: 'manyToMany', model: 'sales.tag' },
    },
    {
      name: 'invoices',
      type: 'hasMany',
      label: 'Invoices',
      relationship: { type: 'hasMany', model: 'sales.invoice', foreignKey: 'customer' },
    },
    { name: 'created_at', type: 'datetime', label: 'Created', readOnly: true },
    { name: 'updated_at', type: 'datetime', label: 'Updated', readOnly: true },
  ],
};

const inventoryItemModel: ModelMeta = {
  name: 'inventory.item',
  label: 'Item',
  naming: 'name',
  traits: ['timestamped', 'soft_delete'],
  fields: [
    { name: 'item_code', type: 'sequence', label: 'Item Code', readOnly: true },
    { name: 'name', type: 'string', label: 'Item Name', required: true, searchable: true },
    {
      name: 'category',
      type: 'link',
      label: 'Category',
      required: true,
      relationship: { type: 'link', model: 'inventory.category' },
    },
    {
      name: 'unit',
      type: 'enum',
      label: 'Unit',
      options: ['Piece', 'Kg', 'Litre', 'Metre', 'Box'],
      default: 'Piece',
    },
    { name: 'cost_price', type: 'money', label: 'Cost Price', required: true },
    { name: 'selling_price', type: 'money', label: 'Selling Price', required: true },
    { name: 'weight', type: 'decimal', label: 'Weight (kg)' },
    { name: 'barcode', type: 'string', label: 'Barcode' },
    { name: 'is_stockable', type: 'boolean', label: 'Stockable', default: true },
    { name: 'reorder_point', type: 'int', label: 'Reorder Point' },
    { name: 'description', type: 'text', label: 'Description' },
    { name: 'metadata', type: 'json', label: 'Custom Fields' },
    { name: 'image', type: 'attachment', label: 'Product Image' },
    {
      name: 'tags',
      type: 'manyToMany',
      label: 'Tags',
      relationship: { type: 'manyToMany', model: 'inventory.tag' },
    },
    {
      name: 'stock_movements',
      type: 'hasMany',
      label: 'Stock Movements',
      relationship: { type: 'hasMany', model: 'inventory.stock_movement', foreignKey: 'item' },
    },
    { name: 'created_at', type: 'datetime', label: 'Created', readOnly: true },
    { name: 'updated_at', type: 'datetime', label: 'Updated', readOnly: true },
  ],
};

// --- Auto-render helpers ---

const on = {};

function AutoField({
  field,
  mode,
  value,
}: {
  field: FieldMeta;
  mode: 'edit' | 'view';
  value: unknown;
}) {
  const bind = {
    value,
    meta: {
      type: field.type,
      label: field.label ?? field.name,
      required: !!field.required,
      readOnly: mode === 'view' || !!field.readOnly,
    },
  };
  const ctx = { record: {}, model: '', mode };
  const props = { label: field.label ?? field.name };

  switch (field.type) {
    case 'string':
      return (
        <InputWidget
          props={{ ...props, placeholder: `Enter ${(field.label ?? field.name).toLowerCase()}` }}
          bind={bind}
          on={on}
          context={ctx}
        />
      );
    case 'text':
      return (
        <TextareaWidget
          props={{
            ...props,
            rows: 3,
            placeholder: `Enter ${(field.label ?? field.name).toLowerCase()}...`,
          }}
          bind={bind}
          on={on}
          context={ctx}
        />
      );
    case 'int':
    case 'decimal':
      return (
        <InputWidget props={{ ...props, placeholder: '0' }} bind={bind} on={on} context={ctx} />
      );
    case 'money':
      return <MoneyWidget props={{ ...props, currency: '$' }} bind={bind} on={on} context={ctx} />;
    case 'boolean':
      return <CheckboxWidget props={props} bind={bind} on={on} context={ctx} />;
    case 'date':
      return <DatePickerWidget props={props} bind={bind} on={on} context={ctx} />;
    case 'datetime':
      return <DateTimeWidget props={props} bind={bind} on={on} context={ctx} />;
    case 'enum':
      return (
        <SelectWidget
          props={{ ...props, options: (field.options ?? []).map((o) => ({ value: o, label: o })) }}
          bind={bind}
          on={on}
          context={ctx}
        />
      );
    case 'link':
      return (
        <LinkWidget
          props={{
            ...props,
            options: [
              { value: '1', label: 'Option A' },
              { value: '2', label: 'Option B' },
              { value: '3', label: 'Option C' },
            ],
          }}
          bind={bind}
          on={on}
          context={ctx}
        />
      );
    case 'manyToMany':
      return (
        <ManyToManyWidget
          props={{
            ...props,
            options: [
              { value: '1', label: 'Tag A' },
              { value: '2', label: 'Tag B' },
              { value: '3', label: 'Tag C' },
            ],
          }}
          bind={bind}
          on={on}
          context={ctx}
        />
      );
    case 'json':
      return <JsonWidget props={props} bind={bind} on={on} context={ctx} />;
    case 'attachment':
      return (
        <AttachmentWidget
          props={{ ...props, accept: 'image/*' }}
          bind={bind}
          on={on}
          context={ctx}
        />
      );
    case 'sequence':
      return (
        <InputWidget
          props={props}
          bind={{ ...bind, meta: { ...bind.meta, readOnly: true } }}
          on={on}
          context={ctx}
        />
      );
    default:
      return <InputWidget props={props} bind={bind} on={on} context={ctx} />;
  }
}

function AutoForm({
  model,
  mode,
  data,
  hideActions,
}: {
  model: ModelMeta;
  mode: 'edit' | 'view';
  data: Record<string, unknown>;
  hideActions?: boolean;
}) {
  const { basic, details, wide, relations, system } = sortFields(model);
  const ctx = { record: data, model: model.name, mode };

  return (
    <StackWidget props={{ gap: 'lg' }} bind={{ value: null }} on={on} context={ctx}>
      {basic.length > 0 && (
        <SectionWidget props={{ label: 'Basic Info' }} bind={{ value: null }} on={on} context={ctx}>
          <GridWidget
            props={{ columns: 2, gap: 'md' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          >
            {basic.map((f) => (
              <AutoField
                key={f.name}
                field={f}
                mode={mode}
                value={data[f.name] ?? f.default ?? null}
              />
            ))}
          </GridWidget>
        </SectionWidget>
      )}

      {details.length > 0 && (
        <SectionWidget
          props={{ label: 'Details', collapsible: mode === 'view' }}
          bind={{ value: null }}
          on={on}
          context={ctx}
        >
          <GridWidget
            props={{ columns: 2, gap: 'md' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          >
            {details.map((f) => (
              <AutoField
                key={f.name}
                field={f}
                mode={mode}
                value={data[f.name] ?? f.default ?? null}
              />
            ))}
          </GridWidget>
        </SectionWidget>
      )}

      {wide.length > 0 && (
        <SectionWidget
          props={{ label: 'Additional', collapsible: true, defaultCollapsed: mode === 'view' }}
          bind={{ value: null }}
          on={on}
          context={ctx}
        >
          <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
            {wide.map((f) => (
              <AutoField
                key={f.name}
                field={f}
                mode={mode}
                value={data[f.name] ?? f.default ?? null}
              />
            ))}
          </StackWidget>
        </SectionWidget>
      )}

      {relations.length > 0 && mode === 'view' && (
        <SectionWidget props={{ label: 'Related' }} bind={{ value: null }} on={on} context={ctx}>
          <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
            {relations.map((f) => (
              <CardWidget
                key={f.name}
                props={{ title: f.label ?? f.name }}
                bind={{ value: null }}
                on={on}
                context={ctx}
              >
                <TableWidget
                  props={{
                    variant: 'flat',
                    columns: [
                      { field: 'id', label: 'ID' },
                      { field: 'name', label: 'Name' },
                      { field: 'date', label: 'Date' },
                      { field: 'amount', label: 'Amount', align: 'right' },
                    ],
                    emptyText: `No ${(f.label ?? f.name).toLowerCase()} yet.`,
                  }}
                  bind={{ value: [] }}
                  on={{}}
                  context={ctx}
                />
              </CardWidget>
            ))}
          </StackWidget>
        </SectionWidget>
      )}

      {system.length > 0 && mode === 'view' && (
        <SectionWidget
          props={{ label: 'System', collapsible: true, defaultCollapsed: true }}
          bind={{ value: null }}
          on={on}
          context={ctx}
        >
          <GridWidget
            props={{ columns: 2, gap: 'md' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          >
            {system.map((f) => (
              <AutoField key={f.name} field={f} mode="view" value={data[f.name] ?? null} />
            ))}
          </GridWidget>
        </SectionWidget>
      )}

      {mode === 'edit' && !hideActions && (
        <GroupWidget
          props={{ direction: 'row', gap: 'sm', justify: 'end' }}
          bind={{ value: null }}
          on={on}
          context={ctx}
        >
          <ButtonWidget
            props={{ label: 'Cancel', variant: 'ghost', size: 'sm' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          />
          <ButtonWidget
            props={{ label: 'Save', variant: 'primary', size: 'sm' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          />
        </GroupWidget>
      )}
    </StackWidget>
  );
}

// --- Mock data ---

const customerData = {
  name: 'Acme Corporation',
  email: 'contact@acme.com',
  phone: '+1 555-0100',
  is_active: true,
  credit_limit: 50000,
  payment_terms: 'Net 30',
  category: '1',
  notes: 'Major enterprise customer. Preferred partner since 2020. Annual review scheduled for Q4.',
  logo: null,
  tags: ['1', '2'],
  created_at: '2024-01-15T09:30:00',
  updated_at: '2026-06-20T14:22:00',
};

const itemData = {
  item_code: 'ITM-00142',
  name: 'MacBook Pro 16"',
  category: '1',
  unit: 'Piece',
  cost_price: 1850,
  selling_price: 2499,
  weight: 2.14,
  barcode: '0195949185694',
  is_stockable: true,
  reorder_point: 20,
  description:
    'The most powerful MacBook Pro ever. M3 Max chip, 16-core CPU, 40-core GPU, 128GB unified memory.',
  metadata: '{"color": "Space Black", "storage": "1TB"}',
  image: null,
  tags: ['1'],
  created_at: '2025-03-10T11:00:00',
  updated_at: '2026-06-25T16:45:00',
};

const customerRows = [
  {
    id: '1',
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '+1 555-0100',
    is_active: 'Yes',
    credit_limit: '$50,000',
    payment_terms: 'Net 30',
  },
  {
    id: '2',
    name: 'Globex Inc',
    email: 'info@globex.com',
    phone: '+1 555-0200',
    is_active: 'Yes',
    credit_limit: '$25,000',
    payment_terms: 'Net 15',
  },
  {
    id: '3',
    name: 'Wayne Enterprises',
    email: 'bruce@wayne.com',
    phone: '+1 555-0300',
    is_active: 'Yes',
    credit_limit: '$100,000',
    payment_terms: 'Net 60',
  },
  {
    id: '4',
    name: 'Stark Industries',
    email: 'pepper@stark.com',
    phone: '+1 555-0400',
    is_active: 'Yes',
    credit_limit: '$75,000',
    payment_terms: 'Net 30',
  },
  {
    id: '5',
    name: 'Umbrella Corp',
    email: 'wesker@umbrella.com',
    phone: '+1 555-0500',
    is_active: 'No',
    credit_limit: '$0',
    payment_terms: 'COD',
  },
  {
    id: '6',
    name: 'Cyberdyne Systems',
    email: 'miles@cyberdyne.com',
    phone: '+1 555-0600',
    is_active: 'Yes',
    credit_limit: '$30,000',
    payment_terms: 'Net 30',
  },
];

const itemRows = [
  {
    id: '1',
    item_code: 'ITM-00142',
    name: 'MacBook Pro 16"',
    category: 'Laptops',
    unit: 'Piece',
    selling_price: '$2,499',
    is_stockable: 'Yes',
  },
  {
    id: '2',
    item_code: 'ITM-00143',
    name: 'Magic Keyboard',
    category: 'Accessories',
    unit: 'Piece',
    selling_price: '$299',
    is_stockable: 'Yes',
  },
  {
    id: '3',
    item_code: 'ITM-00144',
    name: 'Studio Display',
    category: 'Displays',
    unit: 'Piece',
    selling_price: '$1,599',
    is_stockable: 'Yes',
  },
  {
    id: '4',
    item_code: 'ITM-00145',
    name: 'USB-C Cable 2m',
    category: 'Accessories',
    unit: 'Piece',
    selling_price: '$19',
    is_stockable: 'Yes',
  },
  {
    id: '5',
    item_code: 'ITM-00146',
    name: 'AirPods Max',
    category: 'Audio',
    unit: 'Piece',
    selling_price: '$549',
    is_stockable: 'Yes',
  },
];

// --- Stories: Customer model ---

export const CustomerList: Story = {
  name: 'Customer — List',
  render: () => {
    const columns = getListColumns(customerModel);
    return (
      <PageShell
        module="Sales"
        page="Customers"
        layout="full"
        action={
          <Button variant="primary" size="xs">
            <Icon icon={Plus} size="sm" />
            <span>New Customer</span>
          </Button>
        }
      >
        <TableWidget
          props={{ variant: 'flat', columns, selectable: true, page: 1, pageSize: 20, total: 48 }}
          bind={{ value: customerRows }}
          on={{ rowClick: () => {} }}
          context={{ record: {}, model: 'sales.customer', mode: 'view' }}
        />
      </PageShell>
    );
  },
};

export const CustomerCreate: Story = {
  name: 'Customer — Create',
  render: () => (
    <PageShell module="Sales" page="Customers">
      <AutoForm model={customerModel} mode="edit" data={{}} />
    </PageShell>
  ),
};

export const CustomerDetail: Story = {
  name: 'Customer — Detail',
  render: function CustomerDetailDemo() {
    const [editing, setEditing] = useState(false);
    const mode = editing ? 'edit' : 'view';

    return (
      <PageShell
        module="Sales"
        page="Customers"
        action={
          editing ? (
            <GroupWidget
              props={{ direction: 'row', gap: 'sm' }}
              bind={{ value: null }}
              on={on}
              context={{ record: {}, model: '', mode: 'edit' }}
            >
              <ButtonWidget
                props={{ label: 'Cancel', variant: 'ghost', size: 'xs' }}
                bind={{ value: null }}
                on={{ click: () => setEditing(false) }}
                context={{ record: {}, model: '', mode: 'edit' }}
              />
              <ButtonWidget
                props={{ label: 'Save', variant: 'primary', size: 'xs' }}
                bind={{ value: null }}
                on={{}}
                context={{ record: {}, model: '', mode: 'edit' }}
              />
            </GroupWidget>
          ) : (
            <Button variant="secondary" size="xs" onClick={() => setEditing(true)}>
              <Icon icon={Pencil} size="sm" />
              <span>Edit</span>
            </Button>
          )
        }
      >
        <StackWidget
          props={{ gap: 'md' }}
          bind={{ value: null }}
          on={on}
          context={{ record: customerData, model: 'sales.customer', mode }}
        >
          <GroupWidget
            props={{ direction: 'row', gap: 'sm', align: 'center' }}
            bind={{ value: null }}
            on={on}
            context={{ record: {}, model: '', mode }}
          >
            <TextWidget
              props={{ variant: 'heading' }}
              bind={{ value: customerData.name }}
              on={on}
              context={{ record: {}, model: '', mode }}
            />
            <BadgeWidget
              props={{ variant: 'default', label: 'Active' }}
              bind={{ value: null }}
              on={on}
              context={{ record: {}, model: '', mode }}
            />
          </GroupWidget>
          <AutoForm model={customerModel} mode={mode} data={customerData} hideActions />
        </StackWidget>
      </PageShell>
    );
  },
};

// --- Stories: Inventory Item model ---

export const ItemList: Story = {
  name: 'Item — List',
  render: () => {
    const columns = getListColumns(inventoryItemModel);
    return (
      <PageShell
        module="Inventory"
        page="Items"
        layout="full"
        action={
          <Button variant="primary" size="xs">
            <Icon icon={Plus} size="sm" />
            <span>New Item</span>
          </Button>
        }
      >
        <TableWidget
          props={{ variant: 'flat', columns, selectable: true, page: 1, pageSize: 20, total: 234 }}
          bind={{ value: itemRows }}
          on={{ rowClick: () => {} }}
          context={{ record: {}, model: 'inventory.item', mode: 'view' }}
        />
      </PageShell>
    );
  },
};

export const ItemCreate: Story = {
  name: 'Item — Create',
  render: () => (
    <PageShell module="Inventory" page="Items">
      <AutoForm model={inventoryItemModel} mode="edit" data={{}} />
    </PageShell>
  ),
};

export const ItemDetail: Story = {
  name: 'Item — Detail',
  render: function ItemDetailDemo() {
    const [editing, setEditing] = useState(false);
    const mode = editing ? 'edit' : 'view';

    return (
      <PageShell
        module="Inventory"
        page="Items"
        action={
          editing ? (
            <GroupWidget
              props={{ direction: 'row', gap: 'sm' }}
              bind={{ value: null }}
              on={on}
              context={{ record: {}, model: '', mode: 'edit' }}
            >
              <ButtonWidget
                props={{ label: 'Cancel', variant: 'ghost', size: 'xs' }}
                bind={{ value: null }}
                on={{ click: () => setEditing(false) }}
                context={{ record: {}, model: '', mode: 'edit' }}
              />
              <ButtonWidget
                props={{ label: 'Save', variant: 'primary', size: 'xs' }}
                bind={{ value: null }}
                on={{}}
                context={{ record: {}, model: '', mode: 'edit' }}
              />
            </GroupWidget>
          ) : (
            <Button variant="secondary" size="xs" onClick={() => setEditing(true)}>
              <Icon icon={Pencil} size="sm" />
              <span>Edit</span>
            </Button>
          )
        }
      >
        <StackWidget
          props={{ gap: 'md' }}
          bind={{ value: null }}
          on={on}
          context={{ record: itemData, model: 'inventory.item', mode }}
        >
          <GroupWidget
            props={{ direction: 'row', gap: 'sm', align: 'center' }}
            bind={{ value: null }}
            on={on}
            context={{ record: {}, model: '', mode }}
          >
            <SequenceWidget
              props={{}}
              bind={{ value: itemData.item_code }}
              on={on}
              context={{ record: {}, model: '', mode }}
            />
            <TextWidget
              props={{ variant: 'heading' }}
              bind={{ value: itemData.name }}
              on={on}
              context={{ record: {}, model: '', mode }}
            />
            <BadgeWidget
              props={{ variant: 'default', label: 'Active' }}
              bind={{ value: null }}
              on={on}
              context={{ record: {}, model: '', mode }}
            />
          </GroupWidget>
          <AutoForm model={inventoryItemModel} mode={mode} data={itemData} hideActions />
        </StackWidget>
      </PageShell>
    );
  },
};
