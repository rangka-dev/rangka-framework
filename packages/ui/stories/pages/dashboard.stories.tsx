import type { Meta, StoryObj } from '@storybook/react';
import { Plus } from 'lucide-react';
import { Button } from '../../src/primitives/button';
import { Icon } from '../../src/primitives/icon';
import { PageShell } from './page-shell';
import { TextWidget, BadgeWidget, ComputedWidget } from '../../src/widgets/display';
import { ButtonWidget } from '../../src/widgets/action';
import { GridWidget, CardWidget, StackWidget, GroupWidget } from '../../src/widgets/layout';

const meta: Meta = {
  title: 'Widget Compose/Dashboard',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

const on = {};
const ctx = { record: {}, model: 'dashboard', mode: 'view' as const };

export const SalesDashboard: Story = {
  name: 'Sales',
  render: () => (
    <PageShell module="Sales" page="Dashboard">
      <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
        <GridWidget props={{ columns: 4, gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
          <CardWidget
            props={{ title: '142', description: 'Total Orders' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          >
            <TextWidget
              props={{ variant: 'caption' }}
              bind={{ value: '+12% from last month' }}
              on={on}
              context={ctx}
            />
          </CardWidget>
          <CardWidget
            props={{ title: '$48,250', description: 'Revenue' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          >
            <TextWidget
              props={{ variant: 'caption' }}
              bind={{ value: '+8% from last month' }}
              on={on}
              context={ctx}
            />
          </CardWidget>
          <CardWidget
            props={{ title: '7', description: 'Pending' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          >
            <TextWidget
              props={{ variant: 'caption' }}
              bind={{ value: '3 overdue' }}
              on={on}
              context={ctx}
            />
          </CardWidget>
          <CardWidget
            props={{ title: '98.2%', description: 'Fulfillment' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          >
            <TextWidget
              props={{ variant: 'caption' }}
              bind={{ value: 'Target: 95%' }}
              on={on}
              context={ctx}
            />
          </CardWidget>
        </GridWidget>

        <GridWidget props={{ columns: 2, gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
          <CardWidget
            props={{ title: 'Recent Orders' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          >
            <StackWidget props={{ gap: 'xs' }} bind={{ value: null }} on={on} context={ctx}>
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
                    props={{ variant: 'bold' }}
                    bind={{ value: 'ORD-001' }}
                    on={on}
                    context={ctx}
                  />
                  <TextWidget
                    props={{ variant: 'muted' }}
                    bind={{ value: 'Acme Corp' }}
                    on={on}
                    context={ctx}
                  />
                </GroupWidget>
                <BadgeWidget
                  props={{ variant: 'default', label: 'Confirmed' }}
                  bind={{ value: null }}
                  on={on}
                  context={ctx}
                />
              </GroupWidget>
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
                    props={{ variant: 'bold' }}
                    bind={{ value: 'ORD-002' }}
                    on={on}
                    context={ctx}
                  />
                  <TextWidget
                    props={{ variant: 'muted' }}
                    bind={{ value: 'Globex Inc' }}
                    on={on}
                    context={ctx}
                  />
                </GroupWidget>
                <BadgeWidget
                  props={{ variant: 'outline', label: 'Draft' }}
                  bind={{ value: null }}
                  on={on}
                  context={ctx}
                />
              </GroupWidget>
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
                    props={{ variant: 'bold' }}
                    bind={{ value: 'ORD-003' }}
                    on={on}
                    context={ctx}
                  />
                  <TextWidget
                    props={{ variant: 'muted' }}
                    bind={{ value: 'Wayne Enterprises' }}
                    on={on}
                    context={ctx}
                  />
                </GroupWidget>
                <BadgeWidget
                  props={{ variant: 'destructive', label: 'Overdue' }}
                  bind={{ value: null }}
                  on={on}
                  context={ctx}
                />
              </GroupWidget>
            </StackWidget>
          </CardWidget>
          <CardWidget
            props={{ title: 'Quick Actions' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          >
            <StackWidget props={{ gap: 'sm' }} bind={{ value: null }} on={on} context={ctx}>
              <ButtonWidget
                props={{ label: 'Create Order', variant: 'primary', size: 'sm' }}
                bind={{ value: null }}
                on={on}
                context={ctx}
              />
              <ButtonWidget
                props={{ label: 'Generate Invoice', variant: 'secondary', size: 'sm' }}
                bind={{ value: null }}
                on={on}
                context={ctx}
              />
              <ButtonWidget
                props={{ label: 'Export Report', variant: 'secondary', size: 'sm' }}
                bind={{ value: null }}
                on={on}
                context={ctx}
              />
            </StackWidget>
          </CardWidget>
        </GridWidget>
      </StackWidget>
    </PageShell>
  ),
};

export const HRDashboard: Story = {
  name: 'HR',
  render: () => (
    <PageShell module="HR" page="Dashboard">
      <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
        <GridWidget props={{ columns: 4, gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
          <CardWidget
            props={{ title: '84', description: 'Employees' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          >
            <TextWidget
              props={{ variant: 'caption' }}
              bind={{ value: '+3 this month' }}
              on={on}
              context={ctx}
            />
          </CardWidget>
          <CardWidget
            props={{ title: '5', description: 'Open Positions' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          >
            <TextWidget
              props={{ variant: 'caption' }}
              bind={{ value: '2 eng, 2 sales, 1 ops' }}
              on={on}
              context={ctx}
            />
          </CardWidget>
          <CardWidget
            props={{ title: '12', description: 'On Leave' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          >
            <TextWidget
              props={{ variant: 'caption' }}
              bind={{ value: '3 returning this week' }}
              on={on}
              context={ctx}
            />
          </CardWidget>
          <CardWidget
            props={{ title: '2', description: 'Pending Reviews' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          >
            <TextWidget
              props={{ variant: 'caption' }}
              bind={{ value: 'Due by Friday' }}
              on={on}
              context={ctx}
            />
          </CardWidget>
        </GridWidget>

        <GridWidget props={{ columns: 2, gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
          <CardWidget
            props={{ title: 'Upcoming Onboarding' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          >
            <StackWidget props={{ gap: 'xs' }} bind={{ value: null }} on={on} context={ctx}>
              <GroupWidget
                props={{ direction: 'row', justify: 'between', align: 'center' }}
                bind={{ value: null }}
                on={on}
                context={ctx}
              >
                <TextWidget
                  props={{ variant: 'body' }}
                  bind={{ value: 'Alex Chen — Software Engineer' }}
                  on={on}
                  context={ctx}
                />
                <TextWidget
                  props={{ variant: 'caption' }}
                  bind={{ value: 'Jul 1' }}
                  on={on}
                  context={ctx}
                />
              </GroupWidget>
              <GroupWidget
                props={{ direction: 'row', justify: 'between', align: 'center' }}
                bind={{ value: null }}
                on={on}
                context={ctx}
              >
                <TextWidget
                  props={{ variant: 'body' }}
                  bind={{ value: 'Maria Lopez — Sales Manager' }}
                  on={on}
                  context={ctx}
                />
                <TextWidget
                  props={{ variant: 'caption' }}
                  bind={{ value: 'Jul 8' }}
                  on={on}
                  context={ctx}
                />
              </GroupWidget>
              <GroupWidget
                props={{ direction: 'row', justify: 'between', align: 'center' }}
                bind={{ value: null }}
                on={on}
                context={ctx}
              >
                <TextWidget
                  props={{ variant: 'body' }}
                  bind={{ value: 'James Wilson — DevOps' }}
                  on={on}
                  context={ctx}
                />
                <TextWidget
                  props={{ variant: 'caption' }}
                  bind={{ value: 'Jul 15' }}
                  on={on}
                  context={ctx}
                />
              </GroupWidget>
            </StackWidget>
          </CardWidget>
          <CardWidget
            props={{ title: 'Headcount by Department' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          >
            <StackWidget props={{ gap: 'xs' }} bind={{ value: null }} on={on} context={ctx}>
              <GroupWidget
                props={{ direction: 'row', justify: 'between' }}
                bind={{ value: null }}
                on={on}
                context={ctx}
              >
                <TextWidget
                  props={{ variant: 'body' }}
                  bind={{ value: 'Engineering' }}
                  on={on}
                  context={ctx}
                />
                <ComputedWidget
                  props={{ format: 'number' }}
                  bind={{ value: 32 }}
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
                  props={{ variant: 'body' }}
                  bind={{ value: 'Sales' }}
                  on={on}
                  context={ctx}
                />
                <ComputedWidget
                  props={{ format: 'number' }}
                  bind={{ value: 18 }}
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
                  props={{ variant: 'body' }}
                  bind={{ value: 'Operations' }}
                  on={on}
                  context={ctx}
                />
                <ComputedWidget
                  props={{ format: 'number' }}
                  bind={{ value: 14 }}
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
                  props={{ variant: 'body' }}
                  bind={{ value: 'Finance' }}
                  on={on}
                  context={ctx}
                />
                <ComputedWidget
                  props={{ format: 'number' }}
                  bind={{ value: 12 }}
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
