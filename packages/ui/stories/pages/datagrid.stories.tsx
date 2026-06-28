import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../src/primitives/button';
import { Icon } from '../../src/primitives/icon';
import { PageShell } from './page-shell';
import { DatagridWidget } from '../../src/widgets/data/datagrid-widget';
import { FilterBar } from '../../src/data/filter-bar';

const meta: Meta = {
  title: 'Widget Compose/Datagrid',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

const products = [
  {
    id: '1',
    name: 'MacBook Pro 16"',
    sku: 'MBP-16-M3',
    category: 'Laptops',
    price: 2499,
    stock: 142,
    unit: 'Piece',
    active: 'Yes',
  },
  {
    id: '2',
    name: 'Magic Keyboard',
    sku: 'MK-2024',
    category: 'Accessories',
    price: 299,
    stock: 580,
    unit: 'Piece',
    active: 'Yes',
  },
  {
    id: '3',
    name: 'Studio Display',
    sku: 'SD-27-5K',
    category: 'Displays',
    price: 1599,
    stock: 23,
    unit: 'Piece',
    active: 'Yes',
  },
  {
    id: '4',
    name: 'AirPods Max',
    sku: 'APM-SLV',
    category: 'Audio',
    price: 549,
    stock: 0,
    unit: 'Piece',
    active: 'No',
  },
  {
    id: '5',
    name: 'iPhone 16 Pro',
    sku: 'IP16P-256',
    category: 'Phones',
    price: 1199,
    stock: 312,
    unit: 'Piece',
    active: 'Yes',
  },
  {
    id: '6',
    name: 'iPad Air M2',
    sku: 'IPA-M2-256',
    category: 'Tablets',
    price: 799,
    stock: 95,
    unit: 'Piece',
    active: 'Yes',
  },
  {
    id: '7',
    name: 'USB-C Cable 2m',
    sku: 'USBC-2M',
    category: 'Accessories',
    price: 19,
    stock: 2400,
    unit: 'Piece',
    active: 'Yes',
  },
  {
    id: '8',
    name: 'HomePod Mini',
    sku: 'HPM-BLK',
    category: 'Audio',
    price: 99,
    stock: 8,
    unit: 'Piece',
    active: 'Yes',
  },
  {
    id: '9',
    name: 'Apple Watch Ultra',
    sku: 'AWU-49',
    category: 'Wearables',
    price: 799,
    stock: 45,
    unit: 'Piece',
    active: 'Yes',
  },
  {
    id: '10',
    name: 'Mac Mini M3',
    sku: 'MM-M3-512',
    category: 'Desktops',
    price: 599,
    stock: 220,
    unit: 'Piece',
    active: 'Yes',
  },
  {
    id: '11',
    name: 'AirTag 4-Pack',
    sku: 'AT-4PK',
    category: 'Accessories',
    price: 99,
    stock: 1200,
    unit: 'Pack',
    active: 'Yes',
  },
  {
    id: '12',
    name: 'Apple Pencil Pro',
    sku: 'AP-PRO',
    category: 'Accessories',
    price: 129,
    stock: 340,
    unit: 'Piece',
    active: 'Yes',
  },
  {
    id: '13',
    name: 'MacBook Air 15"',
    sku: 'MBA-15-M3',
    category: 'Laptops',
    price: 1299,
    stock: 180,
    unit: 'Piece',
    active: 'Yes',
  },
  {
    id: '14',
    name: 'Pro Display XDR',
    sku: 'PDXDR-32',
    category: 'Displays',
    price: 4999,
    stock: 12,
    unit: 'Piece',
    active: 'Yes',
  },
  {
    id: '15',
    name: 'MagSafe Charger',
    sku: 'MSC-15W',
    category: 'Accessories',
    price: 39,
    stock: 890,
    unit: 'Piece',
    active: 'Yes',
  },
];

const columns = [
  { field: 'name', label: 'Product', width: 200, sortable: true, fieldType: 'string' },
  { field: 'sku', label: 'SKU', width: 120, fieldType: 'string' },
  { field: 'category', label: 'Category', width: 120, sortable: true, fieldType: 'link' },
  {
    field: 'price',
    label: 'Price',
    width: 100,
    sortable: true,
    fieldType: 'money',
  },
  {
    field: 'stock',
    label: 'Stock',
    width: 80,
    sortable: true,
    fieldType: 'int',
  },
  { field: 'unit', label: 'Unit', width: 80, fieldType: 'enum' },
  { field: 'active', label: 'Active', width: 80, fieldType: 'boolean' },
];

export const InventoryGrid: Story = {
  name: 'Inventory Grid',
  render: function Demo() {
    const [selected, setSelected] = useState<string[]>([]);

    const handleSelect = (_row: unknown, checked: boolean) => {
      const row = _row as Record<string, unknown>;
      const id = row.id as string;
      setSelected((prev) => (checked ? [...prev, id] : prev.filter((r) => r !== id)));
    };

    const handleSelectAll = (checked: boolean) => {
      setSelected(checked ? products.map((r) => r.id) : []);
    };

    return (
      <PageShell
        module="Inventory"
        page="Items"
        layout="full"
        action={
          <Button variant="primary" size="xs">
            <Icon icon={Plus} size="sm" />
            <span>Add Item</span>
          </Button>
        }
      >
        <DatagridWidget
          props={{
            columns,
            selectable: true,
            selectedRows: selected,
            rowHeight: 'default',
            addRow: true,
            total: 234,
          }}
          bind={{ value: products }}
          on={{
            select: handleSelect,
            selectAll: handleSelectAll,
            cellClick: () => {},
          }}
          context={{ record: {}, model: 'inventory.item', mode: 'view' }}
        />
      </PageShell>
    );
  },
};

export const CompactGrid: Story = {
  name: 'Compact Grid',
  render: () => (
    <PageShell module="Inventory" page="Items" layout="full">
      <DatagridWidget
        props={{
          columns,
          selectable: true,
          selectedRows: [],
          rowHeight: 'compact',
          total: 15,
        }}
        bind={{ value: products }}
        on={{}}
        context={{ record: {}, model: 'inventory.item', mode: 'view' }}
      />
    </PageShell>
  ),
};

export const WithFilterBar: Story = {
  name: 'With Filter',
  render: () => (
    <PageShell
      module="Inventory"
      page="Items"
      layout="full"
      action={
        <>
          <FilterBar.Trigger count={1} active />
          <Button variant="primary" size="xs">
            <Icon icon={Plus} size="sm" />
            <span>Add Item</span>
          </Button>
        </>
      }
    >
      <FilterBar>
        <FilterBar.Content>
          <FilterBar.Badge label="Category" operator="=" value="Laptops" onRemove={() => {}} />
          <FilterBar.AddButton />
        </FilterBar.Content>
      </FilterBar>
      <DatagridWidget
        props={{
          columns,
          selectable: true,
          selectedRows: [],
          rowHeight: 'default',
          total: 3,
        }}
        bind={{ value: products.filter((p) => p.category === 'Laptops') }}
        on={{}}
        context={{ record: {}, model: 'inventory.item', mode: 'view' }}
      />
    </PageShell>
  ),
};

export const LoadingGrid: Story = {
  name: 'Loading',
  render: () => (
    <PageShell module="Inventory" page="Items" layout="full">
      <DatagridWidget
        props={{
          columns,
          selectable: true,
          loading: true,
        }}
        bind={{ value: [] }}
        on={{}}
        context={{ record: {}, model: 'inventory.item', mode: 'view' }}
      />
    </PageShell>
  ),
};

export const EmptyGrid: Story = {
  name: 'Empty',
  render: () => (
    <PageShell module="Inventory" page="Items" layout="full">
      <DatagridWidget
        props={{
          columns,
          selectable: false,
          emptyText: 'No items found. Add your first inventory item.',
        }}
        bind={{ value: [] }}
        on={{}}
        context={{ record: {}, model: 'inventory.item', mode: 'view' }}
      />
    </PageShell>
  ),
};

// --- Typed cells with editing ---

const typedColumns = [
  { field: 'name', label: 'Name', width: 180, sortable: true, fieldType: 'string', editable: true },
  { field: 'description', label: 'Description', width: 220, fieldType: 'text', editable: true },
  { field: 'quantity', label: 'Qty', width: 80, sortable: true, fieldType: 'int', editable: true },
  {
    field: 'weight',
    label: 'Weight (kg)',
    width: 100,
    fieldType: 'decimal',
    editable: true,
    precision: 3,
  },
  {
    field: 'price',
    label: 'Price',
    width: 100,
    sortable: true,
    fieldType: 'money',
    editable: true,
    currency: '$',
  },
  {
    field: 'status',
    label: 'Status',
    width: 120,
    sortable: true,
    fieldType: 'enum',
    editable: true,
    options: [
      { value: 'draft', label: 'Draft' },
      { value: 'active', label: 'Active' },
      { value: 'archived', label: 'Archived' },
      { value: 'discontinued', label: 'Discontinued' },
    ],
  },
  { field: 'active', label: 'Active', width: 70, fieldType: 'boolean', editable: true },
  { field: 'releaseDate', label: 'Release Date', width: 120, fieldType: 'date', editable: true },
  {
    field: 'lastUpdated',
    label: 'Last Updated',
    width: 160,
    fieldType: 'datetime',
    editable: true,
  },
  {
    field: 'category',
    label: 'Category',
    width: 130,
    fieldType: 'link',
    editable: true,
    options: [
      { value: 'cat-1', label: 'Electronics' },
      { value: 'cat-2', label: 'Furniture' },
      { value: 'cat-3', label: 'Clothing' },
      { value: 'cat-4', label: 'Food & Beverage' },
    ],
  },
  {
    field: 'tags',
    label: 'Tags',
    width: 150,
    fieldType: 'many-to-many',
    editable: true,
    options: [
      { value: 'ergonomic', label: 'Ergonomic' },
      { value: 'office', label: 'Office' },
      { value: 'audio', label: 'Audio' },
      { value: 'wireless', label: 'Wireless' },
      { value: 'organic', label: 'Organic' },
      { value: 'beverage', label: 'Beverage' },
      { value: 'clothing', label: 'Clothing' },
      { value: 'summer', label: 'Summer' },
      { value: 'display', label: 'Display' },
      { value: 'usb-c', label: 'USB-C' },
    ],
  },
  { field: 'document', label: 'Attachment', width: 140, fieldType: 'attachment', editable: true },
  { field: 'metadata', label: 'Metadata', width: 180, fieldType: 'json', editable: true },
  { field: 'seq', label: 'Seq #', width: 70, fieldType: 'sequence', editable: false },
];

const typedProducts = [
  {
    id: '1',
    name: 'Standing Desk Pro',
    description: 'Electric height-adjustable desk with memory presets',
    quantity: 45,
    weight: 32.5,
    price: 899,
    status: 'active',
    active: true,
    releaseDate: '2024-03-15',
    lastUpdated: '2025-06-20T14:30:00Z',
    category: 'cat-2',
    tags: ['ergonomic', 'office'],
    document: 'spec-sheet.pdf',
    metadata: { warranty: '5yr', color: 'walnut' },
    seq: 1001,
  },
  {
    id: '2',
    name: 'Wireless Headphones',
    description: 'ANC over-ear headphones with 40h battery',
    quantity: 312,
    weight: 0.254,
    price: 349,
    status: 'active',
    active: true,
    releaseDate: '2024-06-01',
    lastUpdated: '2025-06-18T09:15:00Z',
    category: 'cat-1',
    tags: ['audio', 'wireless'],
    document: 'user-manual.pdf',
    metadata: { bluetooth: '5.3', driver: '40mm' },
    seq: 1002,
  },
  {
    id: '3',
    name: 'Organic Green Tea',
    description: 'Premium loose leaf sencha from Uji, Kyoto',
    quantity: 1200,
    weight: 0.1,
    price: 24,
    status: 'active',
    active: true,
    releaseDate: '2023-11-10',
    lastUpdated: '2025-06-25T16:45:00Z',
    category: 'cat-4',
    tags: ['organic', 'beverage'],
    document: null,
    metadata: { origin: 'Japan', grade: 'A' },
    seq: 1003,
  },
  {
    id: '4',
    name: 'Linen Blazer',
    description: 'Relaxed fit summer blazer in natural linen',
    quantity: 0,
    weight: 0.45,
    price: 189,
    status: 'discontinued',
    active: false,
    releaseDate: '2022-04-20',
    lastUpdated: '2025-01-10T11:00:00Z',
    category: 'cat-3',
    tags: ['clothing', 'summer'],
    document: 'care-instructions.pdf',
    metadata: { material: '100% linen', sizes: ['S', 'M', 'L', 'XL'] },
    seq: 1004,
  },
  {
    id: '5',
    name: '4K Monitor 27"',
    description: 'IPS panel, 144Hz, USB-C with 90W PD',
    quantity: 67,
    weight: 5.8,
    price: 649,
    status: 'active',
    active: true,
    releaseDate: '2024-09-01',
    lastUpdated: '2025-06-27T08:20:00Z',
    category: 'cat-1',
    tags: ['display', 'usb-c'],
    document: 'product-brief.pdf',
    metadata: { panel: 'IPS', resolution: '3840x2160' },
    seq: 1005,
  },
  {
    id: '6',
    name: 'Draft Product',
    description: 'Placeholder for upcoming release',
    quantity: 0,
    weight: null,
    price: 0,
    status: 'draft',
    active: false,
    releaseDate: null,
    lastUpdated: '2025-06-26T17:00:00Z',
    category: null,
    tags: [],
    document: null,
    metadata: null,
    seq: 1006,
  },
];

export const TypedCells: Story = {
  name: 'Typed Cells',
  render: function Demo() {
    const [data, setData] = useState(typedProducts);
    const [selected, setSelected] = useState<string[]>([]);

    const handleCellChange = (rowId: unknown, field: unknown, value: unknown) => {
      setData((prev) =>
        prev.map((row) => (row.id === rowId ? { ...row, [field as string]: value } : row)),
      );
    };

    const handleSelect = (_row: unknown, checked: boolean) => {
      const row = _row as Record<string, unknown>;
      const id = row.id as string;
      setSelected((prev) => (checked ? [...prev, id] : prev.filter((r) => r !== id)));
    };

    return (
      <PageShell module="Inventory" page="Items (Editable)" layout="full">
        <DatagridWidget
          props={{
            columns: typedColumns,
            selectable: true,
            selectedRows: selected,
            editable: true,
            addRow: true,
            total: data.length,
          }}
          bind={{ value: data }}
          on={{
            cellChange: handleCellChange,
            select: handleSelect,
            selectAll: (checked: unknown) => setSelected(checked ? data.map((r) => r.id) : []),
          }}
          context={{ record: {}, model: 'inventory.item', mode: 'edit' }}
        />
      </PageShell>
    );
  },
};
