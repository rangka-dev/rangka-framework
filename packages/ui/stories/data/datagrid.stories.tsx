import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Datagrid } from '../../src/data/datagrid';
import { DatagridWidget } from '../../src/widgets/data/datagrid-widget';

const meta: Meta = {
  title: 'Data/Datagrid',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

const records = [
  {
    id: '1',
    name: 'MacBook Pro 16"',
    sku: 'MBP-16-M3',
    category: 'Laptops',
    price: 2499,
    stock: 142,
    active: true,
  },
  {
    id: '2',
    name: 'Magic Keyboard',
    sku: 'MK-2024',
    category: 'Accessories',
    price: 299,
    stock: 580,
    active: true,
  },
  {
    id: '3',
    name: 'Studio Display',
    sku: 'SD-27-5K',
    category: 'Displays',
    price: 1599,
    stock: 23,
    active: true,
  },
  {
    id: '4',
    name: 'AirPods Max',
    sku: 'APM-SLV',
    category: 'Audio',
    price: 549,
    stock: 0,
    active: false,
  },
  {
    id: '5',
    name: 'iPhone 16 Pro',
    sku: 'IP16P-256',
    category: 'Phones',
    price: 1199,
    stock: 312,
    active: true,
  },
  {
    id: '6',
    name: 'iPad Air M2',
    sku: 'IPA-M2-256',
    category: 'Tablets',
    price: 799,
    stock: 95,
    active: true,
  },
  {
    id: '7',
    name: 'USB-C Cable 2m',
    sku: 'USBC-2M',
    category: 'Accessories',
    price: 19,
    stock: 2400,
    active: true,
  },
  {
    id: '8',
    name: 'HomePod Mini',
    sku: 'HPM-BLK',
    category: 'Audio',
    price: 99,
    stock: 8,
    active: true,
  },
  {
    id: '9',
    name: 'Apple Watch Ultra',
    sku: 'AWU-49',
    category: 'Wearables',
    price: 799,
    stock: 45,
    active: true,
  },
  {
    id: '10',
    name: 'Mac Mini M3',
    sku: 'MM-M3-512',
    category: 'Desktops',
    price: 599,
    stock: 220,
    active: true,
  },
];

const columns = [
  { field: 'name', label: 'Product', width: 200, sortable: true },
  { field: 'sku', label: 'SKU', width: 120 },
  { field: 'category', label: 'Category', width: 120, sortable: true },
  { field: 'price', label: 'Price', width: 100, align: 'right' as const, sortable: true },
  { field: 'stock', label: 'Stock', width: 80, align: 'right' as const, sortable: true },
];

export const Primitive: Story = {
  name: 'Primitive',
  render: () => {
    const gridTemplate = '40px 200px 120px 120px 100px 80px';
    return (
      <Datagrid maxHeight={400}>
        <Datagrid.ScrollArea>
          <Datagrid.Header gridTemplate={gridTemplate}>
            <Datagrid.SelectHeader />
            <Datagrid.HeaderCell sortable sorted="asc">
              Product
            </Datagrid.HeaderCell>
            <Datagrid.HeaderCell>SKU</Datagrid.HeaderCell>
            <Datagrid.HeaderCell sortable>Category</Datagrid.HeaderCell>
            <Datagrid.HeaderCell sortable>Price</Datagrid.HeaderCell>
            <Datagrid.HeaderCell sortable>Stock</Datagrid.HeaderCell>
          </Datagrid.Header>
          <Datagrid.Body totalHeight={records.length * 40}>
            {records.map((row, idx) => (
              <Datagrid.Row
                key={row.id}
                gridTemplate={gridTemplate}
                rowHeight={40}
                offset={idx * 40}
              >
                <Datagrid.SelectCell selected={idx === 2} />
                <Datagrid.Cell>{row.name}</Datagrid.Cell>
                <Datagrid.Cell>{row.sku}</Datagrid.Cell>
                <Datagrid.Cell>{row.category}</Datagrid.Cell>
                <Datagrid.Cell align="right">${row.price}</Datagrid.Cell>
                <Datagrid.Cell align="right">{row.stock}</Datagrid.Cell>
              </Datagrid.Row>
            ))}
          </Datagrid.Body>
        </Datagrid.ScrollArea>
        <Datagrid.Footer>
          <Datagrid.FooterCount count={records.length} total={234} />
        </Datagrid.Footer>
      </Datagrid>
    );
  },
};

export const WithActiveCell: Story = {
  name: 'Active Cell',
  render: () => {
    const gridTemplate = '200px 120px 120px 100px 80px';
    return (
      <Datagrid maxHeight={400}>
        <Datagrid.ScrollArea>
          <Datagrid.Header gridTemplate={gridTemplate}>
            <Datagrid.HeaderCell>Product</Datagrid.HeaderCell>
            <Datagrid.HeaderCell>SKU</Datagrid.HeaderCell>
            <Datagrid.HeaderCell>Category</Datagrid.HeaderCell>
            <Datagrid.HeaderCell>Price</Datagrid.HeaderCell>
            <Datagrid.HeaderCell>Stock</Datagrid.HeaderCell>
          </Datagrid.Header>
          <Datagrid.Body totalHeight={records.length * 40}>
            {records.map((row, idx) => (
              <Datagrid.Row
                key={row.id}
                gridTemplate={gridTemplate}
                rowHeight={40}
                offset={idx * 40}
                active={idx === 1}
              >
                <Datagrid.Cell active={idx === 1}>{row.name}</Datagrid.Cell>
                <Datagrid.Cell>{row.sku}</Datagrid.Cell>
                <Datagrid.Cell>{row.category}</Datagrid.Cell>
                <Datagrid.Cell align="right">${row.price}</Datagrid.Cell>
                <Datagrid.Cell align="right">{row.stock}</Datagrid.Cell>
              </Datagrid.Row>
            ))}
          </Datagrid.Body>
        </Datagrid.ScrollArea>
        <Datagrid.Footer>
          <Datagrid.FooterCount count={records.length} />
        </Datagrid.Footer>
      </Datagrid>
    );
  },
};

export const CompactRows: Story = {
  name: 'Compact Row Height',
  render: () => (
    <DatagridWidget
      props={{
        columns,
        selectable: true,
        rowHeight: 'compact',
        maxHeight: 300,
        total: 234,
      }}
      bind={{ value: records }}
      on={{}}
      context={{ record: {}, model: 'inventory.item', mode: 'view' }}
    />
  ),
};

export const DefaultRows: Story = {
  name: 'Default Row Height',
  render: () => (
    <DatagridWidget
      props={{
        columns,
        selectable: true,
        rowHeight: 'default',
        maxHeight: 400,
        total: 234,
      }}
      bind={{ value: records }}
      on={{}}
      context={{ record: {}, model: 'inventory.item', mode: 'view' }}
    />
  ),
};

export const ComfortableRows: Story = {
  name: 'Comfortable Row Height',
  render: () => (
    <DatagridWidget
      props={{
        columns,
        selectable: true,
        rowHeight: 'comfortable',
        maxHeight: 500,
        total: 234,
      }}
      bind={{ value: records }}
      on={{}}
      context={{ record: {}, model: 'inventory.item', mode: 'view' }}
    />
  ),
};

export const Loading: Story = {
  name: 'Loading State',
  render: () => (
    <DatagridWidget
      props={{
        columns,
        selectable: true,
        loading: true,
        maxHeight: 400,
      }}
      bind={{ value: [] }}
      on={{}}
      context={{ record: {}, model: 'inventory.item', mode: 'view' }}
    />
  ),
};

export const EmptyState: Story = {
  name: 'Empty State',
  render: () => (
    <DatagridWidget
      props={{
        columns,
        selectable: false,
        emptyText: 'No items match your criteria.',
        maxHeight: 300,
      }}
      bind={{ value: [] }}
      on={{}}
      context={{ record: {}, model: 'inventory.item', mode: 'view' }}
    />
  ),
};

export const WithSelection: Story = {
  name: 'With Selection',
  render: function SelectionDemo() {
    const [selected, setSelected] = useState<string[]>(['2', '5']);

    const handleSelect = (_row: unknown, checked: boolean) => {
      const row = _row as Record<string, unknown>;
      const id = row.id as string;
      setSelected((prev) => (checked ? [...prev, id] : prev.filter((r) => r !== id)));
    };

    const handleSelectAll = (checked: boolean) => {
      setSelected(checked ? records.map((r) => r.id) : []);
    };

    return (
      <DatagridWidget
        props={{
          columns,
          selectable: true,
          selectedRows: selected,
          maxHeight: 400,
          total: 234,
        }}
        bind={{ value: records }}
        on={{ select: handleSelect, selectAll: handleSelectAll }}
        context={{ record: {}, model: 'inventory.item', mode: 'view' }}
      />
    );
  },
};
