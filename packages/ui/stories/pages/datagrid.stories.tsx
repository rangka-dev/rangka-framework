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
    align: 'right' as const,
    sortable: true,
    fieldType: 'money',
  },
  {
    field: 'stock',
    label: 'Stock',
    width: 80,
    align: 'right' as const,
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
