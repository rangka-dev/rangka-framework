import type { Meta, StoryObj } from '@storybook/react';
import { PageShell } from './page-shell';
import { FieldWidget } from '../../src/widgets/field';
import { TextWidget, SequenceWidget, BadgeWidget } from '../../src/widgets/display';
import { ButtonWidget } from '../../src/widgets/action';
import {
  CardWidget,
  StackWidget,
  GroupWidget,
  SectionWidget,
  GridWidget,
} from '../../src/widgets/layout';
import { ActivityFeed } from '../../src/primitives/activity-feed';
import { Avatar } from '../../src/primitives/avatar';
import { Icon } from '../../src/primitives/icon';
import { Plus, Send, CreditCard } from 'lucide-react';

const meta: Meta = {
  title: 'Widget Compose/Record Detail (Bottom Activity)',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

const on = { saveField: () => {} };
const ctx = { record: {}, model: 'sales.order', mode: 'edit' as const };

function fieldBind(
  type: string,
  value: unknown,
  opts?: { label?: string; readOnly?: boolean; options?: unknown[] },
) {
  return {
    value,
    setValue: () => {},
    meta: {
      type,
      label: opts?.label ?? type,
      required: false,
      readOnly: opts?.readOnly ?? false,
      options: opts?.options,
    },
  };
}

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
            props={{ label: 'Mark Shipped', variant: 'primary', size: 'xs' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          />
        </GroupWidget>

        <GridWidget props={{ columns: 2, gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
          <CardWidget props={{}} bind={{ value: null }} on={on} context={ctx}>
            <SectionWidget
              props={{ label: 'Order Info' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            >
              <FieldWidget
                props={{}}
                bind={fieldBind('link', 'cust-001', {
                  label: 'Customer',
                  options: [
                    { value: 'cust-001', label: 'Acme Corp' },
                    { value: 'cust-002', label: 'Globex Inc' },
                  ],
                })}
                on={on}
                context={ctx}
              />
              <FieldWidget
                props={{}}
                bind={fieldBind('date', '2026-06-20', { label: 'Order Date' })}
                on={on}
                context={ctx}
              />
              <FieldWidget
                props={{}}
                bind={fieldBind('date', '2026-07-05', { label: 'Expected Delivery' })}
                on={on}
                context={ctx}
              />
              <FieldWidget
                props={{}}
                bind={fieldBind('enum', 'confirmed', {
                  label: 'Status',
                  options: [
                    { value: 'draft', label: 'Draft' },
                    { value: 'confirmed', label: 'Confirmed' },
                    { value: 'shipped', label: 'Shipped' },
                  ],
                })}
                on={on}
                context={ctx}
              />
            </SectionWidget>
          </CardWidget>
          <CardWidget props={{}} bind={{ value: null }} on={on} context={ctx}>
            <SectionWidget
              props={{ label: 'Financial' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            >
              <FieldWidget
                props={{}}
                bind={fieldBind('money', 4250.0, { label: 'Subtotal', readOnly: true })}
                on={on}
                context={ctx}
              />
              <FieldWidget
                props={{}}
                bind={fieldBind('money', 425.0, { label: 'Tax (10%)', readOnly: true })}
                on={on}
                context={ctx}
              />
              <FieldWidget
                props={{}}
                bind={fieldBind('money', 4675.0, { label: 'Grand Total', readOnly: true })}
                on={on}
                context={ctx}
              />
              <FieldWidget
                props={{}}
                bind={fieldBind('boolean', true, { label: 'Tax Inclusive' })}
                on={on}
                context={ctx}
              />
            </SectionWidget>
          </CardWidget>
        </GridWidget>

        <CardWidget props={{ title: 'Activity' }} bind={{ value: null }} on={on} context={ctx}>
          <ActivityFeed showConnector>
            <ActivityFeed.Item type="comment">
              <ActivityFeed.Avatar>
                <Avatar size="sm">
                  <Avatar.Fallback>JD</Avatar.Fallback>
                </Avatar>
              </ActivityFeed.Avatar>
              <ActivityFeed.Content>
                <ActivityFeed.Header timestamp="10 min ago">
                  <span className="font-medium text-foreground">John Doe</span>
                  <span className="text-muted-foreground">commented</span>
                </ActivityFeed.Header>
                <ActivityFeed.Body>
                  <p className="text-2xs text-foreground/80">
                    Shipping confirmed with the warehouse. Expected delivery on Friday.
                  </p>
                </ActivityFeed.Body>
              </ActivityFeed.Content>
            </ActivityFeed.Item>
            <ActivityFeed.Item type="change">
              <ActivityFeed.Avatar>
                <Avatar size="sm">
                  <Avatar.Fallback>JD</Avatar.Fallback>
                </Avatar>
              </ActivityFeed.Avatar>
              <ActivityFeed.Content>
                <ActivityFeed.Header timestamp="15 min ago">
                  <span className="font-medium text-foreground">John Doe</span>
                  <span className="text-muted-foreground">changed Status</span>
                </ActivityFeed.Header>
                <ActivityFeed.Body>
                  <ActivityFeed.Diff from="Draft" to="Confirmed" />
                </ActivityFeed.Body>
              </ActivityFeed.Content>
            </ActivityFeed.Item>
            <ActivityFeed.Item type="event">
              <ActivityFeed.Avatar>
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                  <Icon icon={Send} size="sm" className="text-primary" />
                </div>
              </ActivityFeed.Avatar>
              <ActivityFeed.Content>
                <ActivityFeed.Header timestamp="1 hour ago">
                  <span className="font-medium text-foreground">Invoice sent</span>
                  <span className="text-muted-foreground">to billing@acme.com</span>
                </ActivityFeed.Header>
              </ActivityFeed.Content>
            </ActivityFeed.Item>
            <ActivityFeed.Item type="event">
              <ActivityFeed.Avatar>
                <div className="flex size-8 items-center justify-center rounded-full bg-green-500/10">
                  <Icon icon={CreditCard} size="sm" className="text-green-600" />
                </div>
              </ActivityFeed.Avatar>
              <ActivityFeed.Content>
                <ActivityFeed.Header timestamp="yesterday">
                  <span className="font-medium text-foreground">Payment received</span>
                  <span className="text-muted-foreground">$4,675.00</span>
                </ActivityFeed.Header>
              </ActivityFeed.Content>
            </ActivityFeed.Item>
            <ActivityFeed.Item type="system">
              <ActivityFeed.Avatar>
                <div className="flex size-8 items-center justify-center rounded-full bg-foreground/6">
                  <Icon icon={Plus} size="sm" className="text-muted-foreground" />
                </div>
              </ActivityFeed.Avatar>
              <ActivityFeed.Content>
                <ActivityFeed.Header timestamp="Jun 20, 2026">
                  <span className="text-muted-foreground">Record created by</span>
                  <span className="font-medium text-foreground">John Doe</span>
                </ActivityFeed.Header>
              </ActivityFeed.Content>
            </ActivityFeed.Item>
            <ActivityFeed.CommentInput />
          </ActivityFeed>
        </CardWidget>
      </StackWidget>
    </PageShell>
  ),
};
