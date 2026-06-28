import type { Meta, StoryObj } from '@storybook/react';
import { Table } from '../../src/data/table';
import { TablePagination } from '../../src/data/table-pagination';
import { Badge } from '../../src/primitives/badge';
import { useState } from 'react';

const meta: Meta = {
  title: 'Data/Table',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

const orders = [
  { id: 'ORD-001', customer: 'Acme Corp', date: '2026-06-20', status: 'Confirmed', total: 4250 },
  { id: 'ORD-002', customer: 'Globex Inc', date: '2026-06-21', status: 'Draft', total: 1800 },
  {
    id: 'ORD-003',
    customer: 'Wayne Enterprises',
    date: '2026-06-22',
    status: 'Overdue',
    total: 12500,
  },
  {
    id: 'ORD-004',
    customer: 'Stark Industries',
    date: '2026-06-23',
    status: 'Pending',
    total: 8900,
  },
  {
    id: 'ORD-005',
    customer: 'Umbrella Corp',
    date: '2026-06-24',
    status: 'Confirmed',
    total: 3200,
  },
];

const statusVariant = (s: string) => {
  if (s === 'Confirmed') return 'default' as const;
  if (s === 'Overdue') return 'destructive' as const;
  if (s === 'Draft') return 'outline' as const;
  return 'secondary' as const;
};

export const FlatVariant: Story = {
  name: 'Flat (Bleed)',
  render: () => (
    <Table variant="flat">
      <Table.Content>
        <Table.Header>
          <tr>
            <Table.Head>Order</Table.Head>
            <Table.Head>Customer</Table.Head>
            <Table.Head>Date</Table.Head>
            <Table.Head>Status</Table.Head>
            <Table.Head align="right">Total</Table.Head>
          </tr>
        </Table.Header>
        <Table.Body>
          {orders.map((o) => (
            <Table.Row key={o.id} onClick={() => {}}>
              <Table.Cell>{o.id}</Table.Cell>
              <Table.Cell>{o.customer}</Table.Cell>
              <Table.Cell>{o.date}</Table.Cell>
              <Table.Cell>
                <Badge variant={statusVariant(o.status)}>{o.status}</Badge>
              </Table.Cell>
              <Table.Cell align="right">${o.total.toLocaleString()}.00</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Content>
    </Table>
  ),
};

export const CardVariant: Story = {
  name: 'Card',
  render: () => (
    <Table variant="card">
      <Table.Content>
        <Table.Header>
          <tr>
            <Table.Head>Order</Table.Head>
            <Table.Head>Customer</Table.Head>
            <Table.Head>Date</Table.Head>
            <Table.Head>Status</Table.Head>
            <Table.Head align="right">Total</Table.Head>
          </tr>
        </Table.Header>
        <Table.Body>
          {orders.map((o) => (
            <Table.Row key={o.id}>
              <Table.Cell>{o.id}</Table.Cell>
              <Table.Cell>{o.customer}</Table.Cell>
              <Table.Cell>{o.date}</Table.Cell>
              <Table.Cell>
                <Badge variant={statusVariant(o.status)}>{o.status}</Badge>
              </Table.Cell>
              <Table.Cell align="right">${o.total.toLocaleString()}.00</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Content>
    </Table>
  ),
};

export const WithSorting: Story = {
  name: 'With Sorting',
  render: function SortDemo() {
    const [sort, setSort] = useState<{ field: string; dir: 'asc' | 'desc' } | null>(null);

    const sorted = [...orders].sort((a, b) => {
      if (!sort) return 0;
      const av = a[sort.field as keyof typeof a];
      const bv = b[sort.field as keyof typeof b];
      const cmp = String(av).localeCompare(String(bv));
      return sort.dir === 'asc' ? cmp : -cmp;
    });

    const handleSort = (field: string) => {
      if (sort?.field === field && sort.dir === 'asc') setSort({ field, dir: 'desc' });
      else if (sort?.field === field && sort.dir === 'desc') setSort(null);
      else setSort({ field, dir: 'asc' });
    };

    return (
      <Table variant="card">
        <Table.Content>
          <Table.Header>
            <tr>
              <Table.Head
                sortable
                sorted={sort?.field === 'id' ? sort.dir : null}
                onSort={() => handleSort('id')}
              >
                Order
              </Table.Head>
              <Table.Head
                sortable
                sorted={sort?.field === 'customer' ? sort.dir : null}
                onSort={() => handleSort('customer')}
              >
                Customer
              </Table.Head>
              <Table.Head
                sortable
                sorted={sort?.field === 'date' ? sort.dir : null}
                onSort={() => handleSort('date')}
              >
                Date
              </Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head
                align="right"
                sortable
                sorted={sort?.field === 'total' ? sort.dir : null}
                onSort={() => handleSort('total')}
              >
                Total
              </Table.Head>
            </tr>
          </Table.Header>
          <Table.Body>
            {sorted.map((o) => (
              <Table.Row key={o.id}>
                <Table.Cell>{o.id}</Table.Cell>
                <Table.Cell>{o.customer}</Table.Cell>
                <Table.Cell>{o.date}</Table.Cell>
                <Table.Cell>
                  <Badge variant={statusVariant(o.status)}>{o.status}</Badge>
                </Table.Cell>
                <Table.Cell align="right">${o.total.toLocaleString()}.00</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table>
    );
  },
};

export const WithPagination: Story = {
  name: 'With Pagination',
  render: function PaginationDemo() {
    const [page, setPage] = useState(1);
    const pageSize = 3;
    const paged = orders.slice((page - 1) * pageSize, page * pageSize);

    return (
      <Table variant="card">
        <Table.Content>
          <Table.Header>
            <tr>
              <Table.Head>Order</Table.Head>
              <Table.Head>Customer</Table.Head>
              <Table.Head>Date</Table.Head>
              <Table.Head align="right">Total</Table.Head>
            </tr>
          </Table.Header>
          <Table.Body>
            {paged.map((o) => (
              <Table.Row key={o.id}>
                <Table.Cell>{o.id}</Table.Cell>
                <Table.Cell>{o.customer}</Table.Cell>
                <Table.Cell>{o.date}</Table.Cell>
                <Table.Cell align="right">${o.total.toLocaleString()}.00</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={orders.length}
          onPageChange={setPage}
        />
      </Table>
    );
  },
};

export const Striped: Story = {
  name: 'Striped Rows',
  render: () => (
    <Table variant="card">
      <Table.Content>
        <Table.Header>
          <tr>
            <Table.Head>Order</Table.Head>
            <Table.Head>Customer</Table.Head>
            <Table.Head>Date</Table.Head>
            <Table.Head align="right">Total</Table.Head>
          </tr>
        </Table.Header>
        <Table.Body>
          {orders.map((o, i) => (
            <Table.Row key={o.id} striped={i % 2 === 1}>
              <Table.Cell>{o.id}</Table.Cell>
              <Table.Cell>{o.customer}</Table.Cell>
              <Table.Cell>{o.date}</Table.Cell>
              <Table.Cell align="right">${o.total.toLocaleString()}.00</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Content>
    </Table>
  ),
};

export const EmptyState: Story = {
  name: 'Empty State',
  render: () => (
    <Table variant="card">
      <Table.Content>
        <Table.Header>
          <tr>
            <Table.Head>Order</Table.Head>
            <Table.Head>Customer</Table.Head>
            <Table.Head>Date</Table.Head>
            <Table.Head align="right">Total</Table.Head>
          </tr>
        </Table.Header>
        <Table.Body>
          <Table.Empty colSpan={4}>No orders found matching your criteria.</Table.Empty>
        </Table.Body>
      </Table.Content>
    </Table>
  ),
};

export const Loading: Story = {
  name: 'Loading Skeleton',
  render: () => (
    <Table variant="card">
      <Table.Content>
        <Table.Header>
          <tr>
            <Table.Head>Order</Table.Head>
            <Table.Head>Customer</Table.Head>
            <Table.Head>Date</Table.Head>
            <Table.Head>Status</Table.Head>
            <Table.Head align="right">Total</Table.Head>
          </tr>
        </Table.Header>
        <Table.Skeleton columns={5} rows={5} />
      </Table.Content>
    </Table>
  ),
};

export const WithMultiSelect: Story = {
  name: 'Multi Select',
  render: function SelectDemo() {
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const toggleRow = (id: string, checked: boolean) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (checked) next.add(id);
        else next.delete(id);
        return next;
      });
    };

    const toggleAll = (checked: boolean) => {
      if (checked) setSelected(new Set(orders.map((o) => o.id)));
      else setSelected(new Set());
    };

    const allSelected = selected.size === orders.length;
    const indeterminate = selected.size > 0 && selected.size < orders.length;

    return (
      <Table variant="card">
        <Table.Content>
          <Table.Header>
            <tr>
              <Table.SelectHead
                allSelected={allSelected}
                indeterminate={indeterminate}
                onSelectAll={toggleAll}
              />
              <Table.Head>Order</Table.Head>
              <Table.Head>Customer</Table.Head>
              <Table.Head>Date</Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head align="right">Total</Table.Head>
            </tr>
          </Table.Header>
          <Table.Body>
            {orders.map((o, i) => (
              <Table.Row key={o.id} selected={selected.has(o.id)}>
                <Table.SelectCell
                  rowNumber={i + 1}
                  selected={selected.has(o.id)}
                  onSelectChange={(checked) => toggleRow(o.id, checked)}
                />
                <Table.Cell>{o.id}</Table.Cell>
                <Table.Cell>{o.customer}</Table.Cell>
                <Table.Cell>{o.date}</Table.Cell>
                <Table.Cell>
                  <Badge variant={statusVariant(o.status)}>{o.status}</Badge>
                </Table.Cell>
                <Table.Cell align="right">${o.total.toLocaleString()}.00</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table>
    );
  },
};
