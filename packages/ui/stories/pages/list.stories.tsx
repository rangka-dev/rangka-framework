import type { Meta, StoryObj } from '@storybook/react';
import { Plus } from 'lucide-react';
import { Button } from '../../src/primitives/button';
import { Icon } from '../../src/primitives/icon';
import { Badge } from '../../src/primitives/badge';
import { PageShell } from './page-shell';
import { TextWidget, BadgeWidget } from '../../src/widgets/display';
import { ButtonWidget } from '../../src/widgets/action';
import { GroupWidget, StackWidget } from '../../src/widgets/layout';

const meta: Meta = {
  title: 'Pages/List',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

const on = {};
const ctx = { record: {}, model: 'sales.order', mode: 'view' as const };

const orders = [
  {
    id: 'ORD-001',
    customer: 'Acme Corp',
    date: '2026-06-20',
    status: 'Confirmed',
    variant: 'default' as const,
    total: '$4,250.00',
  },
  {
    id: 'ORD-002',
    customer: 'Globex Inc',
    date: '2026-06-21',
    status: 'Draft',
    variant: 'outline' as const,
    total: '$1,800.00',
  },
  {
    id: 'ORD-003',
    customer: 'Wayne Enterprises',
    date: '2026-06-22',
    status: 'Overdue',
    variant: 'destructive' as const,
    total: '$12,500.00',
  },
  {
    id: 'ORD-004',
    customer: 'Stark Industries',
    date: '2026-06-23',
    status: 'Pending',
    variant: 'secondary' as const,
    total: '$8,900.00',
  },
  {
    id: 'ORD-005',
    customer: 'Umbrella Corp',
    date: '2026-06-24',
    status: 'Confirmed',
    variant: 'default' as const,
    total: '$3,200.00',
  },
  {
    id: 'ORD-006',
    customer: 'Cyberdyne Systems',
    date: '2026-06-24',
    status: 'Shipped',
    variant: 'default' as const,
    total: '$6,750.00',
  },
  {
    id: 'ORD-007',
    customer: 'Initech',
    date: '2026-06-25',
    status: 'Draft',
    variant: 'outline' as const,
    total: '$950.00',
  },
  {
    id: 'ORD-008',
    customer: 'Weyland-Yutani',
    date: '2026-06-25',
    status: 'Confirmed',
    variant: 'default' as const,
    total: '$22,000.00',
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
      <table className="w-full text-2xs">
        <thead>
          <tr className="border-b border-border-subtle text-left text-foreground/50">
            <th className="px-6 py-2.5 font-medium">Order</th>
            <th className="px-6 py-2.5 font-medium">Customer</th>
            <th className="px-6 py-2.5 font-medium">Date</th>
            <th className="px-6 py-2.5 font-medium">Status</th>
            <th className="px-6 py-2.5 font-medium text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className="border-b border-border-subtle cursor-pointer hover:bg-foreground/4"
            >
              <td className="px-6 py-2.5 font-medium text-foreground">{order.id}</td>
              <td className="px-6 py-2.5 text-foreground/80">{order.customer}</td>
              <td className="px-6 py-2.5 text-foreground/80">{order.date}</td>
              <td className="px-6 py-2.5">
                <Badge variant={order.variant}>{order.status}</Badge>
              </td>
              <td className="px-6 py-2.5 text-right text-foreground">{order.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <GroupWidget
        props={{ direction: 'row', justify: 'between', align: 'center' }}
        bind={{ value: null }}
        on={on}
        context={ctx}
      >
        <TextWidget
          props={{ variant: 'muted' }}
          bind={{ value: 'Showing 8 of 142 orders' }}
          on={on}
          context={ctx}
        />
        <GroupWidget
          props={{ direction: 'row', gap: 'sm' }}
          bind={{ value: null }}
          on={on}
          context={ctx}
        >
          <ButtonWidget
            props={{ label: 'Previous', variant: 'ghost', size: 'xs' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          />
          <ButtonWidget
            props={{ label: 'Next', variant: 'ghost', size: 'xs' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          />
        </GroupWidget>
      </GroupWidget>
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
      <table className="w-full text-2xs">
        <thead>
          <tr className="border-b border-border-subtle text-left text-foreground/50">
            <th className="px-6 py-2.5 font-medium">Company</th>
            <th className="px-6 py-2.5 font-medium">Contact</th>
            <th className="px-6 py-2.5 font-medium">Email</th>
            <th className="px-6 py-2.5 font-medium">Payment Terms</th>
            <th className="px-6 py-2.5 font-medium text-right">Outstanding</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border-subtle cursor-pointer hover:bg-foreground/4">
            <td className="px-6 py-2.5 font-medium text-foreground">Acme Corp</td>
            <td className="px-6 py-2.5 text-foreground/80">John Smith</td>
            <td className="px-6 py-2.5 text-foreground/80">john@acme.com</td>
            <td className="px-6 py-2.5 text-foreground/80">Net 30</td>
            <td className="px-6 py-2.5 text-right text-foreground">$14,500.00</td>
          </tr>
          <tr className="border-b border-border-subtle cursor-pointer hover:bg-foreground/4">
            <td className="px-6 py-2.5 font-medium text-foreground">Globex Inc</td>
            <td className="px-6 py-2.5 text-foreground/80">Jane Doe</td>
            <td className="px-6 py-2.5 text-foreground/80">jane@globex.com</td>
            <td className="px-6 py-2.5 text-foreground/80">Net 15</td>
            <td className="px-6 py-2.5 text-right text-foreground">$3,200.00</td>
          </tr>
          <tr className="border-b border-border-subtle cursor-pointer hover:bg-foreground/4">
            <td className="px-6 py-2.5 font-medium text-foreground">Wayne Enterprises</td>
            <td className="px-6 py-2.5 text-foreground/80">Bruce Wayne</td>
            <td className="px-6 py-2.5 text-foreground/80">bruce@wayne.com</td>
            <td className="px-6 py-2.5 text-foreground/80">Net 60</td>
            <td className="px-6 py-2.5 text-right text-foreground">$45,000.00</td>
          </tr>
          <tr className="border-b border-border-subtle cursor-pointer hover:bg-foreground/4">
            <td className="px-6 py-2.5 font-medium text-foreground">Stark Industries</td>
            <td className="px-6 py-2.5 text-foreground/80">Pepper Potts</td>
            <td className="px-6 py-2.5 text-foreground/80">pepper@stark.com</td>
            <td className="px-6 py-2.5 text-foreground/80">Net 30</td>
            <td className="px-6 py-2.5 text-right text-foreground">$8,900.00</td>
          </tr>
          <tr className="border-b border-border-subtle cursor-pointer hover:bg-foreground/4">
            <td className="px-6 py-2.5 font-medium text-foreground">Umbrella Corp</td>
            <td className="px-6 py-2.5 text-foreground/80">Albert Wesker</td>
            <td className="px-6 py-2.5 text-foreground/80">wesker@umbrella.com</td>
            <td className="px-6 py-2.5 text-foreground/80">Net 30</td>
            <td className="px-6 py-2.5 text-right text-foreground">$0.00</td>
          </tr>
        </tbody>
      </table>
      <GroupWidget
        props={{ direction: 'row', justify: 'between', align: 'center' }}
        bind={{ value: null }}
        on={on}
        context={ctx}
      >
        <TextWidget
          props={{ variant: 'muted' }}
          bind={{ value: 'Showing 5 of 28 customers' }}
          on={on}
          context={ctx}
        />
        <GroupWidget
          props={{ direction: 'row', gap: 'sm' }}
          bind={{ value: null }}
          on={on}
          context={ctx}
        >
          <ButtonWidget
            props={{ label: 'Previous', variant: 'ghost', size: 'xs' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          />
          <ButtonWidget
            props={{ label: 'Next', variant: 'ghost', size: 'xs' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          />
        </GroupWidget>
      </GroupWidget>
    </PageShell>
  ),
};
