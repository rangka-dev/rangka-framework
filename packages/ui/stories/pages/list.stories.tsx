import type { Meta, StoryObj } from '@storybook/react';
import { Plus } from 'lucide-react';
import { Button } from '../../src/primitives/button';
import { Icon } from '../../src/primitives/icon';
import { PageShell } from './page-shell';
import { TableWidget } from '../../src/widgets/data/table-widget';

const meta: Meta = {
  title: 'Widget Compose/List',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

const ctx = { record: {}, model: 'sales.order', mode: 'view' as const };

const orders = [
  {
    id: 'ORD-001',
    customer: 'Acme Corp',
    date: '2026-06-20',
    status: 'Confirmed',
    total: '$4,250.00',
  },
  {
    id: 'ORD-002',
    customer: 'Globex Inc',
    date: '2026-06-21',
    status: 'Draft',
    total: '$1,800.00',
  },
  {
    id: 'ORD-003',
    customer: 'Wayne Enterprises',
    date: '2026-06-22',
    status: 'Overdue',
    total: '$12,500.00',
  },
  {
    id: 'ORD-004',
    customer: 'Stark Industries',
    date: '2026-06-23',
    status: 'Pending',
    total: '$8,900.00',
  },
  {
    id: 'ORD-005',
    customer: 'Umbrella Corp',
    date: '2026-06-24',
    status: 'Confirmed',
    total: '$3,200.00',
  },
  {
    id: 'ORD-006',
    customer: 'Cyberdyne Systems',
    date: '2026-06-24',
    status: 'Shipped',
    total: '$6,750.00',
  },
  { id: 'ORD-007', customer: 'Initech', date: '2026-06-25', status: 'Draft', total: '$950.00' },
  {
    id: 'ORD-008',
    customer: 'Weyland-Yutani',
    date: '2026-06-25',
    status: 'Confirmed',
    total: '$22,000.00',
  },
];

const customers = [
  {
    id: '1',
    company: 'Acme Corp',
    contact: 'John Smith',
    email: 'john@acme.com',
    terms: 'Net 30',
    outstanding: '$14,500.00',
  },
  {
    id: '2',
    company: 'Globex Inc',
    contact: 'Jane Doe',
    email: 'jane@globex.com',
    terms: 'Net 15',
    outstanding: '$3,200.00',
  },
  {
    id: '3',
    company: 'Wayne Enterprises',
    contact: 'Bruce Wayne',
    email: 'bruce@wayne.com',
    terms: 'Net 60',
    outstanding: '$45,000.00',
  },
  {
    id: '4',
    company: 'Stark Industries',
    contact: 'Pepper Potts',
    email: 'pepper@stark.com',
    terms: 'Net 30',
    outstanding: '$8,900.00',
  },
  {
    id: '5',
    company: 'Umbrella Corp',
    contact: 'Albert Wesker',
    email: 'wesker@umbrella.com',
    terms: 'Net 30',
    outstanding: '$0.00',
  },
];

export const OrderList: Story = {
  name: 'Order List (Bleed)',
  render: () => (
    <PageShell
      module="Sales"
      page="Orders"
      layout="full"
      action={
        <Button variant="primary" size="xs">
          <Icon icon={Plus} size="sm" />
          <span>New Order</span>
        </Button>
      }
    >
      <TableWidget
        props={{
          variant: 'flat',
          columns: [
            { field: 'id', label: 'Order', sortable: true },
            { field: 'customer', label: 'Customer', sortable: true },
            { field: 'date', label: 'Date', sortable: true },
            { field: 'status', label: 'Status' },
            { field: 'total', label: 'Total', align: 'right', sortable: true },
          ],
          page: 1,
          pageSize: 20,
          total: 142,
        }}
        bind={{ value: orders }}
        on={{ rowClick: () => {} }}
        context={ctx}
      />
    </PageShell>
  ),
};

export const OrderListCard: Story = {
  name: 'Order List (Card)',
  render: () => (
    <PageShell module="Sales" page="Orders">
      <TableWidget
        props={{
          variant: 'card',
          columns: [
            { field: 'id', label: 'Order', sortable: true },
            { field: 'customer', label: 'Customer', sortable: true },
            { field: 'date', label: 'Date', sortable: true },
            { field: 'status', label: 'Status' },
            { field: 'total', label: 'Total', align: 'right', sortable: true },
          ],
          page: 1,
          pageSize: 20,
          total: 142,
        }}
        bind={{ value: orders }}
        on={{ rowClick: () => {} }}
        context={ctx}
      />
    </PageShell>
  ),
};

export const CustomerList: Story = {
  name: 'Customer List (Bleed)',
  render: () => (
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
        props={{
          variant: 'flat',
          columns: [
            { field: 'company', label: 'Company', sortable: true },
            { field: 'contact', label: 'Contact' },
            { field: 'email', label: 'Email' },
            { field: 'terms', label: 'Payment Terms' },
            { field: 'outstanding', label: 'Outstanding', align: 'right', sortable: true },
          ],
          page: 1,
          pageSize: 20,
          total: 28,
        }}
        bind={{ value: customers }}
        on={{ rowClick: () => {} }}
        context={ctx}
      />
    </PageShell>
  ),
};

export const EmptyList: Story = {
  name: 'Empty List',
  render: () => (
    <PageShell module="Sales" page="Orders">
      <TableWidget
        props={{
          variant: 'card',
          columns: [
            { field: 'id', label: 'Order' },
            { field: 'customer', label: 'Customer' },
            { field: 'date', label: 'Date' },
            { field: 'status', label: 'Status' },
            { field: 'total', label: 'Total', align: 'right' },
          ],
          emptyText: 'No orders found. Create your first order to get started.',
        }}
        bind={{ value: [] }}
        on={{}}
        context={ctx}
      />
    </PageShell>
  ),
};
