import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Plus } from 'lucide-react';
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
} from '../../src/widgets/input';
import { TextWidget, BadgeWidget, ComputedWidget, SequenceWidget } from '../../src/widgets/display';
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
  title: 'Widget Compose/CRUD',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

const on = {};
const ctx = { record: {}, model: 'inventory.product', mode: 'view' as const };
const editCtx = { ...ctx, mode: 'edit' as const };

const products = [
  {
    id: 'PRD-001',
    name: 'MacBook Pro 16"',
    sku: 'MBP-16-M3',
    category: 'Electronics',
    price: '$2,499.00',
    stock: '142',
    status: 'Active',
  },
  {
    id: 'PRD-002',
    name: 'Magic Keyboard',
    sku: 'MK-2024',
    category: 'Accessories',
    price: '$299.00',
    stock: '580',
    status: 'Active',
  },
  {
    id: 'PRD-003',
    name: 'Studio Display',
    sku: 'SD-27-5K',
    category: 'Electronics',
    price: '$1,599.00',
    stock: '23',
    status: 'Low Stock',
  },
  {
    id: 'PRD-004',
    name: 'AirPods Max',
    sku: 'APM-SLV',
    category: 'Audio',
    price: '$549.00',
    stock: '0',
    status: 'Out of Stock',
  },
  {
    id: 'PRD-005',
    name: 'iPhone 16 Pro',
    sku: 'IP16P-256',
    category: 'Electronics',
    price: '$1,199.00',
    stock: '312',
    status: 'Active',
  },
  {
    id: 'PRD-006',
    name: 'iPad Air M2',
    sku: 'IPA-M2-256',
    category: 'Electronics',
    price: '$799.00',
    stock: '95',
    status: 'Active',
  },
  {
    id: 'PRD-007',
    name: 'USB-C Cable 2m',
    sku: 'USBC-2M',
    category: 'Accessories',
    price: '$19.00',
    stock: '2400',
    status: 'Active',
  },
  {
    id: 'PRD-008',
    name: 'HomePod Mini',
    sku: 'HPM-BLK',
    category: 'Audio',
    price: '$99.00',
    stock: '8',
    status: 'Low Stock',
  },
];

const filterFields = [
  { field: 'name', label: 'Name', type: 'string' },
  { field: 'category', label: 'Category', type: 'string' },
  { field: 'price', label: 'Price', type: 'decimal' },
  { field: 'stock', label: 'Stock', type: 'int' },
  { field: 'status', label: 'Status', type: 'enum' },
];

const STRING_OPS = [
  { value: 'like', label: 'Contains', needsValue: true },
  { value: 'eq', label: 'Equals', needsValue: true },
  { value: 'neq', label: 'Not equals', needsValue: true },
  { value: 'empty', label: 'Empty', needsValue: false },
];

const NUMERIC_OPS = [
  { value: 'eq', label: 'Equals', needsValue: true },
  { value: 'gt', label: 'Greater than', needsValue: true },
  { value: 'gte', label: 'Greater or equal', needsValue: true },
  { value: 'lt', label: 'Less than', needsValue: true },
  { value: 'lte', label: 'Less or equal', needsValue: true },
];

function getOps(type: string) {
  if (type === 'decimal' || type === 'int') return NUMERIC_OPS;
  return STRING_OPS;
}

function getSymbol(op: string) {
  switch (op) {
    case 'eq':
      return '=';
    case 'neq':
      return '≠';
    case 'gt':
      return '>';
    case 'gte':
      return '≥';
    case 'lt':
      return '<';
    case 'lte':
      return '≤';
    case 'like':
      return '≈';
    case 'empty':
      return 'is empty';
    default:
      return '=';
  }
}

interface ActiveFilter {
  field: string;
  label: string;
  operator: string;
  value: string;
}

// --- List View ---

export const ProductList: Story = {
  name: '1. List',
  render: function ListDemo() {
    const [filterOpen, setFilterOpen] = useState(true);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [filters, setFilters] = useState<ActiveFilter[]>([
      { field: 'category', label: 'Category', operator: 'eq', value: 'Electronics' },
    ]);
    const [step, setStep] = useState<'fields' | 'operator'>('fields');
    const [selectedField, setSelectedField] = useState<(typeof filterFields)[0] | null>(null);
    const [operator, setOperator] = useState('');
    const [value, setValue] = useState('');
    const [search, setSearch] = useState('');

    const handleFieldSelect = (f: (typeof filterFields)[0]) => {
      setSelectedField(f);
      setOperator(getOps(f.type)[0].value);
      setValue('');
      setStep('operator');
    };

    const handleApply = () => {
      if (!selectedField) return;
      setFilters((prev) => [
        ...prev,
        { field: selectedField.field, label: selectedField.label, operator, value },
      ]);
      setPopoverOpen(false);
      setStep('fields');
      setSelectedField(null);
      setSearch('');
    };

    const handleRemove = (field: string) => {
      const next = filters.filter((f) => f.field !== field);
      setFilters(next);
      if (next.length === 0) setFilterOpen(false);
    };

    const handleToggle = () => {
      if (!filterOpen && filters.length === 0) {
        setFilterOpen(true);
        setPopoverOpen(true);
      } else setFilterOpen(!filterOpen);
    };

    const filteredFields = filterFields.filter((f) =>
      f.label.toLowerCase().includes(search.toLowerCase()),
    );
    const currentOps = selectedField ? getOps(selectedField.type) : [];
    const currentOp = currentOps.find((o) => o.value === operator);

    return (
      <PageShell
        module="Inventory"
        page="Products"
        layout="full"
        action={
          <>
            <FilterBar.Trigger count={filters.length} active={filterOpen} onToggle={handleToggle} />
            <Button variant="primary" size="xs">
              <Icon icon={Plus} size="sm" />
              <span>Add Product</span>
            </Button>
          </>
        }
      >
        {filterOpen && (
          <FilterBar>
            <FilterBar.Content>
              {filters.map((f) => (
                <FilterBar.Badge
                  key={f.field}
                  label={f.label}
                  operator={getSymbol(f.operator)}
                  value={f.value}
                  onRemove={() => handleRemove(f.field)}
                />
              ))}
              <div className="relative">
                <FilterBar.AddButton
                  onClick={() => {
                    setPopoverOpen(true);
                    setStep('fields');
                    setSearch('');
                  }}
                />
                <FilterBar.Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  {step === 'fields' ? (
                    <FilterBar.FieldList search={search} onSearchChange={setSearch}>
                      {filteredFields.map((f) => (
                        <FilterBar.FieldItem key={f.field} onClick={() => handleFieldSelect(f)}>
                          {f.label}
                        </FilterBar.FieldItem>
                      ))}
                    </FilterBar.FieldList>
                  ) : (
                    <FilterBar.OperatorForm
                      fieldLabel={selectedField?.label ?? ''}
                      operators={currentOps}
                      operator={operator}
                      onOperatorChange={setOperator}
                      value={value}
                      onValueChange={setValue}
                      needsValue={currentOp?.needsValue}
                      onApply={handleApply}
                      onBack={() => {
                        setStep('fields');
                        setSelectedField(null);
                      }}
                    />
                  )}
                </FilterBar.Popover>
              </div>
            </FilterBar.Content>
          </FilterBar>
        )}
        <TableWidget
          props={{
            variant: 'flat',
            columns: [
              { field: 'id', label: 'ID' },
              { field: 'name', label: 'Product', sortable: true },
              { field: 'sku', label: 'SKU' },
              { field: 'category', label: 'Category', sortable: true },
              { field: 'price', label: 'Price', align: 'right', sortable: true },
              { field: 'stock', label: 'Stock', align: 'right', sortable: true },
              { field: 'status', label: 'Status' },
            ],
            selectable: true,
            page: 1,
            pageSize: 20,
            total: 86,
          }}
          bind={{ value: products }}
          on={{ rowClick: () => {} }}
          context={ctx}
        />
      </PageShell>
    );
  },
};

// --- Create View ---

export const ProductCreate: Story = {
  name: '2. Create',
  render: () => (
    <PageShell module="Inventory" page="Products">
      <CardWidget
        props={{ title: 'New Product', description: 'Add a new product to inventory.' }}
        bind={{ value: null }}
        on={on}
        context={editCtx}
      >
        <StackWidget props={{ gap: 'lg' }} bind={{ value: null }} on={on} context={editCtx}>
          <SectionWidget
            props={{ label: 'Basic Info' }}
            bind={{ value: null }}
            on={on}
            context={editCtx}
          >
            <GridWidget
              props={{ columns: 2, gap: 'md' }}
              bind={{ value: null }}
              on={on}
              context={editCtx}
            >
              <InputWidget
                props={{ label: 'Product Name', placeholder: 'Enter product name' }}
                bind={{
                  value: '',
                  meta: { type: 'string', label: 'Name', required: true, readOnly: false },
                }}
                on={on}
                context={editCtx}
              />
              <InputWidget
                props={{ label: 'SKU', placeholder: 'e.g. MBP-16-M3' }}
                bind={{
                  value: '',
                  meta: { type: 'string', label: 'SKU', required: true, readOnly: false },
                }}
                on={on}
                context={editCtx}
              />
              <TreeWidget
                props={{
                  label: 'Category',
                  options: [
                    {
                      value: 'electronics',
                      label: 'Electronics',
                      children: [
                        { value: 'laptops', label: 'Laptops' },
                        { value: 'phones', label: 'Phones' },
                        { value: 'displays', label: 'Displays' },
                      ],
                    },
                    { value: 'accessories', label: 'Accessories' },
                    { value: 'audio', label: 'Audio' },
                  ],
                }}
                bind={{
                  value: '',
                  meta: { type: 'tree', label: 'Category', required: true, readOnly: false },
                }}
                on={on}
                context={editCtx}
              />
              <SelectWidget
                props={{
                  label: 'Brand',
                  options: [
                    { value: 'apple', label: 'Apple' },
                    { value: 'samsung', label: 'Samsung' },
                    { value: 'sony', label: 'Sony' },
                    { value: 'microsoft', label: 'Microsoft' },
                  ],
                }}
                bind={{
                  value: '',
                  meta: { type: 'enum', label: 'Brand', required: false, readOnly: false },
                }}
                on={on}
                context={editCtx}
              />
            </GridWidget>
          </SectionWidget>

          <SectionWidget
            props={{ label: 'Pricing & Stock' }}
            bind={{ value: null }}
            on={on}
            context={editCtx}
          >
            <GridWidget
              props={{ columns: 3, gap: 'md' }}
              bind={{ value: null }}
              on={on}
              context={editCtx}
            >
              <MoneyWidget
                props={{ label: 'Cost Price', currency: '$' }}
                bind={{
                  value: null,
                  meta: { type: 'money', label: 'Cost', required: true, readOnly: false },
                }}
                on={on}
                context={editCtx}
              />
              <MoneyWidget
                props={{ label: 'Selling Price', currency: '$' }}
                bind={{
                  value: null,
                  meta: { type: 'money', label: 'Price', required: true, readOnly: false },
                }}
                on={on}
                context={editCtx}
              />
              <InputWidget
                props={{ label: 'Opening Stock', placeholder: '0' }}
                bind={{
                  value: '',
                  meta: { type: 'int', label: 'Stock', required: false, readOnly: false },
                }}
                on={on}
                context={editCtx}
              />
            </GridWidget>
          </SectionWidget>

          <SectionWidget
            props={{ label: 'Details' }}
            bind={{ value: null }}
            on={on}
            context={editCtx}
          >
            <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={editCtx}>
              <TextareaWidget
                props={{ label: 'Description', placeholder: 'Product description...', rows: 3 }}
                bind={{
                  value: '',
                  meta: { type: 'text', label: 'Description', required: false, readOnly: false },
                }}
                on={on}
                context={editCtx}
              />
              <GridWidget
                props={{ columns: 2, gap: 'md' }}
                bind={{ value: null }}
                on={on}
                context={editCtx}
              >
                <InputWidget
                  props={{ label: 'Weight (kg)', placeholder: '0.00' }}
                  bind={{
                    value: '',
                    meta: { type: 'decimal', label: 'Weight', required: false, readOnly: false },
                  }}
                  on={on}
                  context={editCtx}
                />
                <InputWidget
                  props={{ label: 'Barcode', placeholder: 'UPC or EAN' }}
                  bind={{
                    value: '',
                    meta: { type: 'string', label: 'Barcode', required: false, readOnly: false },
                  }}
                  on={on}
                  context={editCtx}
                />
                <LinkWidget
                  props={{
                    label: 'Supplier',
                    options: [
                      { value: '1', label: 'TechDist Inc' },
                      { value: '2', label: 'Global Parts Co' },
                      { value: '3', label: 'Pacific Supply' },
                    ],
                  }}
                  bind={{
                    value: '',
                    meta: { type: 'link', label: 'Supplier', required: false, readOnly: false },
                  }}
                  on={on}
                  context={editCtx}
                />
                <DatePickerWidget
                  props={{ label: 'Available From' }}
                  bind={{
                    value: '',
                    meta: { type: 'date', label: 'Available', required: false, readOnly: false },
                  }}
                  on={on}
                  context={editCtx}
                />
              </GridWidget>
            </StackWidget>
          </SectionWidget>

          <SectionWidget
            props={{ label: 'Media & Tags', collapsible: true, defaultCollapsed: true }}
            bind={{ value: null }}
            on={on}
            context={editCtx}
          >
            <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={editCtx}>
              <AttachmentWidget
                props={{ label: 'Product Image', accept: 'image/*' }}
                bind={{
                  value: null,
                  meta: { type: 'attachment', label: 'Image', required: false, readOnly: false },
                }}
                on={on}
                context={editCtx}
              />
              <ManyToManyWidget
                props={{
                  label: 'Tags',
                  options: [
                    { value: 'new', label: 'New Arrival' },
                    { value: 'sale', label: 'On Sale' },
                    { value: 'featured', label: 'Featured' },
                    { value: 'clearance', label: 'Clearance' },
                  ],
                }}
                bind={{
                  value: [],
                  meta: { type: 'many-to-many', label: 'Tags', required: false, readOnly: false },
                }}
                on={on}
                context={editCtx}
              />
            </StackWidget>
          </SectionWidget>

          <SectionWidget
            props={{ label: 'Settings', collapsible: true, defaultCollapsed: true }}
            bind={{ value: null }}
            on={on}
            context={editCtx}
          >
            <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={editCtx}>
              <CheckboxWidget
                props={{ label: 'Track inventory for this product' }}
                bind={{
                  value: true,
                  meta: { type: 'boolean', label: 'Track', required: false, readOnly: false },
                }}
                on={on}
                context={editCtx}
              />
              <CheckboxWidget
                props={{ label: 'Allow backorders' }}
                bind={{
                  value: false,
                  meta: { type: 'boolean', label: 'Backorder', required: false, readOnly: false },
                }}
                on={on}
                context={editCtx}
              />
              <CheckboxWidget
                props={{ label: 'Publish to storefront' }}
                bind={{
                  value: true,
                  meta: { type: 'boolean', label: 'Publish', required: false, readOnly: false },
                }}
                on={on}
                context={editCtx}
              />
            </StackWidget>
          </SectionWidget>

          <DividerWidget
            props={{ margin: 'sm' }}
            bind={{ value: null }}
            on={on}
            context={editCtx}
          />

          <GroupWidget
            props={{ direction: 'row', gap: 'sm', justify: 'end' }}
            bind={{ value: null }}
            on={on}
            context={editCtx}
          >
            <ButtonWidget
              props={{ label: 'Cancel', variant: 'ghost', size: 'sm' }}
              bind={{ value: null }}
              on={on}
              context={editCtx}
            />
            <ButtonWidget
              props={{ label: 'Save as Draft', variant: 'secondary', size: 'sm' }}
              bind={{ value: null }}
              on={on}
              context={editCtx}
            />
            <ButtonWidget
              props={{ label: 'Create Product', variant: 'primary', size: 'sm' }}
              bind={{ value: null }}
              on={on}
              context={editCtx}
            />
          </GroupWidget>
        </StackWidget>
      </CardWidget>
    </PageShell>
  ),
};

// --- Detail View ---

export const ProductDetail: Story = {
  name: '3. Detail',
  render: () => (
    <PageShell
      module="Inventory"
      page="Products"
      action={
        <GroupWidget
          props={{ direction: 'row', gap: 'sm' }}
          bind={{ value: null }}
          on={on}
          context={ctx}
        >
          <ButtonWidget
            props={{ label: 'Archive', variant: 'ghost', size: 'xs', icon: 'Archive' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          />
          <ButtonWidget
            props={{ label: 'Edit', variant: 'secondary', size: 'xs', icon: 'Pencil' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          />
        </GroupWidget>
      }
    >
      <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
        <GroupWidget
          props={{ direction: 'row', justify: 'between', align: 'center' }}
          bind={{ value: null }}
          on={on}
          context={ctx}
        >
          <GroupWidget
            props={{ direction: 'row', gap: 'sm', align: 'center' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          >
            <SequenceWidget props={{}} bind={{ value: 'PRD-001' }} on={on} context={ctx} />
            <TextWidget
              props={{ variant: 'heading' }}
              bind={{ value: 'MacBook Pro 16"' }}
              on={on}
              context={ctx}
            />
            <BadgeWidget
              props={{ variant: 'default', label: 'Active' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            />
          </GroupWidget>
        </GroupWidget>
        <TextWidget
          props={{ variant: 'muted' }}
          bind={{ value: 'SKU: MBP-16-M3 · Electronics / Laptops · Added Jun 15, 2026' }}
          on={on}
          context={ctx}
        />

        <GridWidget props={{ columns: 2, gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
          <CardWidget
            props={{ title: 'Product Details' }}
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
              <InputWidget
                props={{ label: 'Name' }}
                bind={{
                  value: 'MacBook Pro 16"',
                  meta: { type: 'string', label: 'Name', required: false, readOnly: true },
                }}
                on={on}
                context={ctx}
              />
              <InputWidget
                props={{ label: 'SKU' }}
                bind={{
                  value: 'MBP-16-M3',
                  meta: { type: 'string', label: 'SKU', required: false, readOnly: true },
                }}
                on={on}
                context={ctx}
              />
              <InputWidget
                props={{ label: 'Category' }}
                bind={{
                  value: 'Electronics / Laptops',
                  meta: { type: 'string', label: 'Category', required: false, readOnly: true },
                }}
                on={on}
                context={ctx}
              />
              <InputWidget
                props={{ label: 'Brand' }}
                bind={{
                  value: 'Apple',
                  meta: { type: 'string', label: 'Brand', required: false, readOnly: true },
                }}
                on={on}
                context={ctx}
              />
              <InputWidget
                props={{ label: 'Weight' }}
                bind={{
                  value: '2.14 kg',
                  meta: { type: 'string', label: 'Weight', required: false, readOnly: true },
                }}
                on={on}
                context={ctx}
              />
              <InputWidget
                props={{ label: 'Barcode' }}
                bind={{
                  value: '0195949185694',
                  meta: { type: 'string', label: 'Barcode', required: false, readOnly: true },
                }}
                on={on}
                context={ctx}
              />
            </GridWidget>
          </CardWidget>

          <CardWidget
            props={{ title: 'Pricing & Stock' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          >
            <StackWidget props={{ gap: 'sm' }} bind={{ value: null }} on={on} context={ctx}>
              <GroupWidget
                props={{ direction: 'row', justify: 'between' }}
                bind={{ value: null }}
                on={on}
                context={ctx}
              >
                <TextWidget
                  props={{ variant: 'muted' }}
                  bind={{ value: 'Cost Price' }}
                  on={on}
                  context={ctx}
                />
                <ComputedWidget
                  props={{ format: 'currency', prefix: '$' }}
                  bind={{ value: 1850 }}
                  on={on}
                  context={ctx}
                />
              </GroupWidget>
              <GroupWidget
                props={{ direction: 'row', justify: 'between' }}
                bind={{ value: null }}
                on={on}
                context={ctx}
              >
                <TextWidget
                  props={{ variant: 'muted' }}
                  bind={{ value: 'Selling Price' }}
                  on={on}
                  context={ctx}
                />
                <ComputedWidget
                  props={{ format: 'currency', prefix: '$' }}
                  bind={{ value: 2499 }}
                  on={on}
                  context={ctx}
                />
              </GroupWidget>
              <GroupWidget
                props={{ direction: 'row', justify: 'between' }}
                bind={{ value: null }}
                on={on}
                context={ctx}
              >
                <TextWidget
                  props={{ variant: 'muted' }}
                  bind={{ value: 'Margin' }}
                  on={on}
                  context={ctx}
                />
                <TextWidget
                  props={{ variant: 'body' }}
                  bind={{ value: '26%' }}
                  on={on}
                  context={ctx}
                />
              </GroupWidget>
              <DividerWidget
                props={{ margin: 'sm' }}
                bind={{ value: null }}
                on={on}
                context={ctx}
              />
              <GroupWidget
                props={{ direction: 'row', justify: 'between' }}
                bind={{ value: null }}
                on={on}
                context={ctx}
              >
                <TextWidget
                  props={{ variant: 'muted' }}
                  bind={{ value: 'In Stock' }}
                  on={on}
                  context={ctx}
                />
                <TextWidget
                  props={{ variant: 'bold' }}
                  bind={{ value: '142 units' }}
                  on={on}
                  context={ctx}
                />
              </GroupWidget>
              <GroupWidget
                props={{ direction: 'row', justify: 'between' }}
                bind={{ value: null }}
                on={on}
                context={ctx}
              >
                <TextWidget
                  props={{ variant: 'muted' }}
                  bind={{ value: 'Reserved' }}
                  on={on}
                  context={ctx}
                />
                <TextWidget
                  props={{ variant: 'body' }}
                  bind={{ value: '18 units' }}
                  on={on}
                  context={ctx}
                />
              </GroupWidget>
              <GroupWidget
                props={{ direction: 'row', justify: 'between' }}
                bind={{ value: null }}
                on={on}
                context={ctx}
              >
                <TextWidget
                  props={{ variant: 'muted' }}
                  bind={{ value: 'Available' }}
                  on={on}
                  context={ctx}
                />
                <TextWidget
                  props={{ variant: 'bold' }}
                  bind={{ value: '124 units' }}
                  on={on}
                  context={ctx}
                />
              </GroupWidget>
            </StackWidget>
          </CardWidget>
        </GridWidget>

        <CardWidget props={{ title: 'Description' }} bind={{ value: null }} on={on} context={ctx}>
          <TextWidget
            props={{ variant: 'body' }}
            bind={{
              value:
                'The most powerful MacBook Pro ever. Features the M3 Max chip with up to 16-core CPU, 40-core GPU, and 128GB unified memory. 16.2-inch Liquid Retina XDR display with ProMotion. Up to 22 hours of battery life.',
            }}
            on={on}
            context={ctx}
          />
        </CardWidget>

        <CardWidget props={{ title: 'Settings' }} bind={{ value: null }} on={on} context={ctx}>
          <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
            <CheckboxWidget
              props={{ label: 'Track inventory' }}
              bind={{
                value: true,
                meta: { type: 'boolean', label: 'Track', required: false, readOnly: true },
              }}
              on={on}
              context={ctx}
            />
            <CheckboxWidget
              props={{ label: 'Allow backorders' }}
              bind={{
                value: false,
                meta: { type: 'boolean', label: 'Backorder', required: false, readOnly: true },
              }}
              on={on}
              context={ctx}
            />
            <CheckboxWidget
              props={{ label: 'Published to storefront' }}
              bind={{
                value: true,
                meta: { type: 'boolean', label: 'Published', required: false, readOnly: true },
              }}
              on={on}
              context={ctx}
            />
          </StackWidget>
        </CardWidget>
      </StackWidget>
    </PageShell>
  ),
};

// --- Edit View ---

export const ProductEdit: Story = {
  name: '4. Edit',
  render: () => (
    <PageShell
      module="Inventory"
      page="Products"
      action={
        <GroupWidget
          props={{ direction: 'row', gap: 'sm' }}
          bind={{ value: null }}
          on={on}
          context={editCtx}
        >
          <ButtonWidget
            props={{ label: 'Delete', variant: 'destructive', size: 'xs' }}
            bind={{ value: null }}
            on={on}
            context={editCtx}
          />
        </GroupWidget>
      }
    >
      <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={editCtx}>
        <GroupWidget
          props={{ direction: 'row', gap: 'sm', align: 'center' }}
          bind={{ value: null }}
          on={on}
          context={editCtx}
        >
          <SequenceWidget props={{}} bind={{ value: 'PRD-001' }} on={on} context={editCtx} />
          <TextWidget
            props={{ variant: 'heading' }}
            bind={{ value: 'Edit: MacBook Pro 16"' }}
            on={on}
            context={editCtx}
          />
        </GroupWidget>

        <GridWidget
          props={{ columns: 2, gap: 'md' }}
          bind={{ value: null }}
          on={on}
          context={editCtx}
        >
          <CardWidget
            props={{ title: 'Basic Info' }}
            bind={{ value: null }}
            on={on}
            context={editCtx}
          >
            <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={editCtx}>
              <InputWidget
                props={{ label: 'Product Name' }}
                bind={{
                  value: 'MacBook Pro 16"',
                  meta: { type: 'string', label: 'Name', required: true, readOnly: false },
                }}
                on={on}
                context={editCtx}
              />
              <InputWidget
                props={{ label: 'SKU' }}
                bind={{
                  value: 'MBP-16-M3',
                  meta: { type: 'string', label: 'SKU', required: true, readOnly: false },
                }}
                on={on}
                context={editCtx}
              />
              <TreeWidget
                props={{
                  label: 'Category',
                  options: [
                    {
                      value: 'electronics',
                      label: 'Electronics',
                      children: [
                        { value: 'laptops', label: 'Laptops' },
                        { value: 'phones', label: 'Phones' },
                        { value: 'displays', label: 'Displays' },
                      ],
                    },
                    { value: 'accessories', label: 'Accessories' },
                    { value: 'audio', label: 'Audio' },
                  ],
                }}
                bind={{
                  value: 'laptops',
                  meta: { type: 'tree', label: 'Category', required: true, readOnly: false },
                }}
                on={on}
                context={editCtx}
              />
              <SelectWidget
                props={{
                  label: 'Brand',
                  options: [
                    { value: 'apple', label: 'Apple' },
                    { value: 'samsung', label: 'Samsung' },
                    { value: 'sony', label: 'Sony' },
                  ],
                }}
                bind={{
                  value: 'apple',
                  meta: { type: 'enum', label: 'Brand', required: false, readOnly: false },
                }}
                on={on}
                context={editCtx}
              />
              <SelectWidget
                props={{
                  label: 'Status',
                  options: [
                    { value: 'active', label: 'Active' },
                    { value: 'draft', label: 'Draft' },
                    { value: 'archived', label: 'Archived' },
                  ],
                }}
                bind={{
                  value: 'active',
                  meta: { type: 'enum', label: 'Status', required: true, readOnly: false },
                }}
                on={on}
                context={editCtx}
              />
            </StackWidget>
          </CardWidget>

          <CardWidget
            props={{ title: 'Pricing & Stock' }}
            bind={{ value: null }}
            on={on}
            context={editCtx}
          >
            <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={editCtx}>
              <MoneyWidget
                props={{ label: 'Cost Price', currency: '$' }}
                bind={{
                  value: 1850,
                  meta: { type: 'money', label: 'Cost', required: true, readOnly: false },
                }}
                on={on}
                context={editCtx}
              />
              <MoneyWidget
                props={{ label: 'Selling Price', currency: '$' }}
                bind={{
                  value: 2499,
                  meta: { type: 'money', label: 'Price', required: true, readOnly: false },
                }}
                on={on}
                context={editCtx}
              />
              <InputWidget
                props={{ label: 'Current Stock' }}
                bind={{
                  value: '142',
                  meta: { type: 'int', label: 'Stock', required: false, readOnly: true },
                }}
                on={on}
                context={editCtx}
              />
              <InputWidget
                props={{ label: 'Reorder Point', placeholder: 'Min stock before reorder' }}
                bind={{
                  value: '20',
                  meta: { type: 'int', label: 'Reorder', required: false, readOnly: false },
                }}
                on={on}
                context={editCtx}
              />
              <LinkWidget
                props={{
                  label: 'Supplier',
                  options: [
                    { value: '1', label: 'TechDist Inc' },
                    { value: '2', label: 'Global Parts Co' },
                    { value: '3', label: 'Pacific Supply' },
                  ],
                }}
                bind={{
                  value: '1',
                  meta: { type: 'link', label: 'Supplier', required: false, readOnly: false },
                }}
                on={on}
                context={editCtx}
              />
            </StackWidget>
          </CardWidget>
        </GridWidget>

        <CardWidget
          props={{ title: 'Description' }}
          bind={{ value: null }}
          on={on}
          context={editCtx}
        >
          <TextareaWidget
            props={{ label: 'Description', rows: 4 }}
            bind={{
              value:
                'The most powerful MacBook Pro ever. Features the M3 Max chip with up to 16-core CPU, 40-core GPU, and 128GB unified memory.',
              meta: { type: 'text', label: 'Description', required: false, readOnly: false },
            }}
            on={on}
            context={editCtx}
          />
        </CardWidget>

        <CardWidget
          props={{ title: 'Tags & Media' }}
          bind={{ value: null }}
          on={on}
          context={editCtx}
        >
          <GridWidget
            props={{ columns: 2, gap: 'md' }}
            bind={{ value: null }}
            on={on}
            context={editCtx}
          >
            <ManyToManyWidget
              props={{
                label: 'Tags',
                options: [
                  { value: 'new', label: 'New Arrival' },
                  { value: 'sale', label: 'On Sale' },
                  { value: 'featured', label: 'Featured' },
                  { value: 'clearance', label: 'Clearance' },
                ],
              }}
              bind={{
                value: ['featured'],
                meta: { type: 'many-to-many', label: 'Tags', required: false, readOnly: false },
              }}
              on={on}
              context={editCtx}
            />
            <AttachmentWidget
              props={{ label: 'Product Image', accept: 'image/*' }}
              bind={{
                value: null,
                meta: { type: 'attachment', label: 'Image', required: false, readOnly: false },
              }}
              on={on}
              context={editCtx}
            />
          </GridWidget>
        </CardWidget>

        <CardWidget props={{ title: 'Settings' }} bind={{ value: null }} on={on} context={editCtx}>
          <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={editCtx}>
            <CheckboxWidget
              props={{ label: 'Track inventory for this product' }}
              bind={{
                value: true,
                meta: { type: 'boolean', label: 'Track', required: false, readOnly: false },
              }}
              on={on}
              context={editCtx}
            />
            <CheckboxWidget
              props={{ label: 'Allow backorders' }}
              bind={{
                value: false,
                meta: { type: 'boolean', label: 'Backorder', required: false, readOnly: false },
              }}
              on={on}
              context={editCtx}
            />
            <CheckboxWidget
              props={{ label: 'Publish to storefront' }}
              bind={{
                value: true,
                meta: { type: 'boolean', label: 'Publish', required: false, readOnly: false },
              }}
              on={on}
              context={editCtx}
            />
            <DateTimeWidget
              props={{ label: 'Last Updated' }}
              bind={{
                value: '2026-06-25T14:30:00',
                meta: { type: 'datetime', label: 'Updated', required: false, readOnly: true },
              }}
              on={on}
              context={editCtx}
            />
          </StackWidget>
        </CardWidget>

        <DividerWidget props={{ margin: 'sm' }} bind={{ value: null }} on={on} context={editCtx} />

        <GroupWidget
          props={{ direction: 'row', gap: 'sm', justify: 'end' }}
          bind={{ value: null }}
          on={on}
          context={editCtx}
        >
          <ButtonWidget
            props={{ label: 'Cancel', variant: 'ghost', size: 'sm' }}
            bind={{ value: null }}
            on={on}
            context={editCtx}
          />
          <ButtonWidget
            props={{ label: 'Save Changes', variant: 'primary', size: 'sm' }}
            bind={{ value: null }}
            on={on}
            context={editCtx}
          />
        </GroupWidget>
      </StackWidget>
    </PageShell>
  ),
};
