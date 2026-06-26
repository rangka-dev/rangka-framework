import type { Meta, StoryObj } from '@storybook/react';
import { PageShell } from './page-shell';
import { InputWidget, CheckboxWidget } from '../../src/widgets/input';
import { TextWidget, BadgeWidget, ComputedWidget, SequenceWidget } from '../../src/widgets/display';
import { ButtonWidget } from '../../src/widgets/action';
import {
  GridWidget,
  CardWidget,
  StackWidget,
  GroupWidget,
  DividerWidget,
} from '../../src/widgets/layout';

const meta: Meta = {
  title: 'Widget Compose/Detail',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

const on = {};
const ctx = { record: {}, model: 'sales.order', mode: 'view' as const };

export const OrderDetail: Story = {
  name: 'Order Detail',
  render: () => (
    <PageShell module="Sales" page="Orders">
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
            <SequenceWidget props={{}} bind={{ value: 'ORD-00142' }} on={on} context={ctx} />
            <TextWidget
              props={{ variant: 'heading' }}
              bind={{ value: 'Acme Corp' }}
              on={on}
              context={ctx}
            />
            <BadgeWidget
              props={{ variant: 'default', label: 'Confirmed' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            />
          </GroupWidget>
          <ButtonWidget
            props={{ label: 'Edit', variant: 'secondary', size: 'xs' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          />
        </GroupWidget>

        <GridWidget props={{ columns: 2, gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
          <CardWidget
            props={{ title: 'Order Details' }}
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
                props={{ label: 'Customer' }}
                bind={{
                  value: 'Acme Corp',
                  meta: { type: 'string', label: 'Customer', required: false, readOnly: true },
                }}
                on={on}
                context={ctx}
              />
              <InputWidget
                props={{ label: 'Order Date' }}
                bind={{
                  value: '2026-06-20',
                  meta: { type: 'string', label: 'Date', required: false, readOnly: true },
                }}
                on={on}
                context={ctx}
              />
              <InputWidget
                props={{ label: 'Priority' }}
                bind={{
                  value: 'Normal',
                  meta: { type: 'string', label: 'Priority', required: false, readOnly: true },
                }}
                on={on}
                context={ctx}
              />
              <InputWidget
                props={{ label: 'Warehouse' }}
                bind={{
                  value: 'Main Warehouse',
                  meta: { type: 'string', label: 'Warehouse', required: false, readOnly: true },
                }}
                on={on}
                context={ctx}
              />
            </GridWidget>
          </CardWidget>

          <CardWidget
            props={{ title: 'Financial Summary' }}
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
                  bind={{ value: 'Subtotal' }}
                  on={on}
                  context={ctx}
                />
                <ComputedWidget
                  props={{ format: 'currency', prefix: '$' }}
                  bind={{ value: 4250 }}
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
                  bind={{ value: 'Tax (10%)' }}
                  on={on}
                  context={ctx}
                />
                <ComputedWidget
                  props={{ format: 'currency', prefix: '$' }}
                  bind={{ value: 425 }}
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
                  props={{ variant: 'bold' }}
                  bind={{ value: 'Total' }}
                  on={on}
                  context={ctx}
                />
                <ComputedWidget
                  props={{ format: 'currency', prefix: '$' }}
                  bind={{ value: 4675 }}
                  on={on}
                  context={ctx}
                />
              </GroupWidget>
            </StackWidget>
          </CardWidget>
        </GridWidget>

        <CardWidget props={{ title: 'Settings' }} bind={{ value: null }} on={on} context={ctx}>
          <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
            <CheckboxWidget
              props={{ label: 'Auto-invoice on delivery' }}
              bind={{
                value: true,
                meta: { type: 'boolean', label: 'Auto-invoice', required: false, readOnly: true },
              }}
              on={on}
              context={ctx}
            />
            <CheckboxWidget
              props={{ label: 'Send shipment notification' }}
              bind={{
                value: true,
                meta: { type: 'boolean', label: 'Notification', required: false, readOnly: true },
              }}
              on={on}
              context={ctx}
            />
            <CheckboxWidget
              props={{ label: 'Archive on completion' }}
              bind={{
                value: false,
                meta: { type: 'boolean', label: 'Archive', required: false, readOnly: true },
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

export const EmployeeProfile: Story = {
  name: 'Employee Profile',
  render: () => (
    <PageShell module="HR" page="Dashboard">
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
            <TextWidget
              props={{ variant: 'heading' }}
              bind={{ value: 'Sarah Johnson' }}
              on={on}
              context={ctx}
            />
            <BadgeWidget
              props={{ variant: 'secondary', label: 'Active' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            />
          </GroupWidget>
          <ButtonWidget
            props={{ label: 'Edit Profile', variant: 'secondary', size: 'xs' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          />
        </GroupWidget>
        <TextWidget
          props={{ variant: 'muted' }}
          bind={{ value: 'VP Engineering · Engineering · Started Jan 15, 2024' }}
          on={on}
          context={ctx}
        />

        <GridWidget props={{ columns: 2, gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
          <CardWidget props={{ title: 'Personal' }} bind={{ value: null }} on={on} context={ctx}>
            <GridWidget
              props={{ columns: 2, gap: 'md' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            >
              <InputWidget
                props={{ label: 'Email' }}
                bind={{
                  value: 'sarah@acme.com',
                  meta: { type: 'string', label: 'Email', required: false, readOnly: true },
                }}
                on={on}
                context={ctx}
              />
              <InputWidget
                props={{ label: 'Phone' }}
                bind={{
                  value: '+1 555-0142',
                  meta: { type: 'string', label: 'Phone', required: false, readOnly: true },
                }}
                on={on}
                context={ctx}
              />
              <InputWidget
                props={{ label: 'Location' }}
                bind={{
                  value: 'San Francisco, CA',
                  meta: { type: 'string', label: 'Location', required: false, readOnly: true },
                }}
                on={on}
                context={ctx}
              />
              <InputWidget
                props={{ label: 'Timezone' }}
                bind={{
                  value: 'PST (UTC-8)',
                  meta: { type: 'string', label: 'Timezone', required: false, readOnly: true },
                }}
                on={on}
                context={ctx}
              />
            </GridWidget>
          </CardWidget>

          <CardWidget
            props={{ title: 'Compensation' }}
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
                  bind={{ value: 'Base Salary' }}
                  on={on}
                  context={ctx}
                />
                <ComputedWidget
                  props={{ format: 'currency', prefix: '$' }}
                  bind={{ value: 185000 }}
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
                  bind={{ value: 'Bonus Target' }}
                  on={on}
                  context={ctx}
                />
                <TextWidget
                  props={{ variant: 'body' }}
                  bind={{ value: '20%' }}
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
                  bind={{ value: 'Equity (vested)' }}
                  on={on}
                  context={ctx}
                />
                <TextWidget
                  props={{ variant: 'body' }}
                  bind={{ value: '12,500 shares' }}
                  on={on}
                  context={ctx}
                />
              </GroupWidget>
            </StackWidget>
          </CardWidget>
        </GridWidget>
      </StackWidget>
    </PageShell>
  ),
};
