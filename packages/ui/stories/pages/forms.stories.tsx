import type { Meta, StoryObj } from '@storybook/react';
import { Plus } from 'lucide-react';
import { Button } from '../../src/primitives/button';
import { Icon } from '../../src/primitives/icon';
import { PageShell } from './page-shell';
import {
  InputWidget,
  SelectWidget,
  MoneyWidget,
  DatePickerWidget,
  LinkWidget,
  ManyToManyWidget,
  TextareaWidget,
  CheckboxWidget,
} from '../../src/widgets/input';
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
  title: 'Widget Compose/Forms',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

const on = {};
const ctx = { record: {}, model: 'sales.order', mode: 'edit' as const };

export const CreateOrder: Story = {
  name: 'Create Order',
  render: () => (
    <PageShell
      module="Sales"
      page="Orders"
      action={
        <Button variant="primary" size="xs">
          <Icon icon={Plus} size="sm" />
          <span>New Order</span>
        </Button>
      }
    >
      <CardWidget
        props={{
          title: 'Create Order',
          description: 'Fill in the details to create a new sales order.',
        }}
        bind={{ value: null }}
        on={on}
        context={ctx}
      >
        <StackWidget props={{ gap: 'lg' }} bind={{ value: null }} on={on} context={ctx}>
          <SectionWidget
            props={{ label: 'Customer Details' }}
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
              <LinkWidget
                props={{
                  label: 'Customer',
                  options: [
                    { value: '1', label: 'Acme Corp' },
                    { value: '2', label: 'Globex Inc' },
                    { value: '3', label: 'Wayne Enterprises' },
                  ],
                }}
                bind={{
                  value: '1',
                  meta: { type: 'link', label: 'Customer', required: true, readOnly: false },
                }}
                on={on}
                context={ctx}
              />
              <DatePickerWidget
                props={{ label: 'Order Date' }}
                bind={{
                  value: '2026-06-26',
                  meta: { type: 'date', label: 'Order Date', required: true, readOnly: false },
                }}
                on={on}
                context={ctx}
              />
              <SelectWidget
                props={{
                  label: 'Priority',
                  options: [
                    { value: 'low', label: 'Low' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'high', label: 'High' },
                  ],
                }}
                bind={{
                  value: 'normal',
                  meta: { type: 'enum', label: 'Priority', required: false, readOnly: false },
                }}
                on={on}
                context={ctx}
              />
              <SelectWidget
                props={{
                  label: 'Warehouse',
                  options: [
                    { value: 'main', label: 'Main Warehouse' },
                    { value: 'west', label: 'West Branch' },
                  ],
                }}
                bind={{
                  value: 'main',
                  meta: { type: 'enum', label: 'Warehouse', required: true, readOnly: false },
                }}
                on={on}
                context={ctx}
              />
            </GridWidget>
          </SectionWidget>

          <SectionWidget
            props={{ label: 'Financials' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          >
            <GridWidget
              props={{ columns: 3, gap: 'md' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            >
              <MoneyWidget
                props={{ label: 'Subtotal', currency: '$' }}
                bind={{
                  value: 4250,
                  meta: { type: 'money', label: 'Subtotal', required: false, readOnly: false },
                }}
                on={on}
                context={ctx}
              />
              <MoneyWidget
                props={{ label: 'Tax', currency: '$' }}
                bind={{
                  value: 425,
                  meta: { type: 'money', label: 'Tax', required: false, readOnly: false },
                }}
                on={on}
                context={ctx}
              />
              <MoneyWidget
                props={{ label: 'Total', currency: '$' }}
                bind={{
                  value: 4675,
                  meta: { type: 'money', label: 'Total', required: false, readOnly: true },
                }}
                on={on}
                context={ctx}
              />
            </GridWidget>
          </SectionWidget>

          <SectionWidget
            props={{ label: 'Additional', collapsible: true, defaultCollapsed: true }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          >
            <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
              <ManyToManyWidget
                props={{
                  label: 'Tags',
                  options: [
                    { value: 'urgent', label: 'Urgent' },
                    { value: 'vip', label: 'VIP' },
                    { value: 'wholesale', label: 'Wholesale' },
                  ],
                }}
                bind={{
                  value: ['vip'],
                  meta: { type: 'many-to-many', label: 'Tags', required: false, readOnly: false },
                }}
                on={on}
                context={ctx}
              />
              <TextareaWidget
                props={{ label: 'Internal Notes', placeholder: 'Add notes...', rows: 3 }}
                bind={{
                  value: '',
                  meta: { type: 'text', label: 'Notes', required: false, readOnly: false },
                }}
                on={on}
                context={ctx}
              />
            </StackWidget>
          </SectionWidget>

          <DividerWidget props={{ margin: 'sm' }} bind={{ value: null }} on={on} context={ctx} />

          <GroupWidget
            props={{ direction: 'row', gap: 'sm', justify: 'end' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          >
            <ButtonWidget
              props={{ label: 'Cancel', variant: 'ghost', size: 'sm' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            />
            <ButtonWidget
              props={{ label: 'Save Draft', variant: 'secondary', size: 'sm' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            />
            <ButtonWidget
              props={{ label: 'Create Order', variant: 'primary', size: 'sm' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            />
          </GroupWidget>
        </StackWidget>
      </CardWidget>
    </PageShell>
  ),
};

export const NewCustomer: Story = {
  name: 'New Customer',
  render: () => (
    <PageShell module="Sales" page="Customers">
      <CardWidget
        props={{ title: 'New Customer', description: 'Register a new customer.' }}
        bind={{ value: null }}
        on={on}
        context={ctx}
      >
        <StackWidget props={{ gap: 'lg' }} bind={{ value: null }} on={on} context={ctx}>
          <GridWidget
            props={{ columns: 2, gap: 'md' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          >
            <InputWidget
              props={{ label: 'Company Name', placeholder: 'Enter company name' }}
              bind={{
                value: '',
                meta: { type: 'string', label: 'Company Name', required: true, readOnly: false },
              }}
              on={on}
              context={ctx}
            />
            <InputWidget
              props={{ label: 'Tax ID', placeholder: 'XX-XXXXXXX' }}
              bind={{
                value: '',
                meta: { type: 'string', label: 'Tax ID', required: false, readOnly: false },
              }}
              on={on}
              context={ctx}
            />
            <InputWidget
              props={{ label: 'Email', placeholder: 'contact@company.com' }}
              bind={{
                value: '',
                meta: { type: 'string', label: 'Email', required: true, readOnly: false },
              }}
              on={on}
              context={ctx}
            />
            <InputWidget
              props={{ label: 'Phone', placeholder: '+1 (555) 000-0000' }}
              bind={{
                value: '',
                meta: { type: 'string', label: 'Phone', required: false, readOnly: false },
              }}
              on={on}
              context={ctx}
            />
          </GridWidget>

          <SectionWidget
            props={{ label: 'Address', collapsible: true }}
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
                props={{ label: 'Street' }}
                bind={{
                  value: '',
                  meta: { type: 'string', label: 'Street', required: false, readOnly: false },
                }}
                on={on}
                context={ctx}
              />
              <InputWidget
                props={{ label: 'City' }}
                bind={{
                  value: '',
                  meta: { type: 'string', label: 'City', required: false, readOnly: false },
                }}
                on={on}
                context={ctx}
              />
              <InputWidget
                props={{ label: 'State' }}
                bind={{
                  value: '',
                  meta: { type: 'string', label: 'State', required: false, readOnly: false },
                }}
                on={on}
                context={ctx}
              />
              <InputWidget
                props={{ label: 'Zip Code' }}
                bind={{
                  value: '',
                  meta: { type: 'string', label: 'Zip', required: false, readOnly: false },
                }}
                on={on}
                context={ctx}
              />
              <SelectWidget
                props={{
                  label: 'Country',
                  options: [
                    { value: 'us', label: 'United States' },
                    { value: 'ca', label: 'Canada' },
                    { value: 'uk', label: 'United Kingdom' },
                  ],
                }}
                bind={{
                  value: 'us',
                  meta: { type: 'enum', label: 'Country', required: false, readOnly: false },
                }}
                on={on}
                context={ctx}
              />
            </GridWidget>
          </SectionWidget>

          <SectionWidget
            props={{ label: 'Preferences' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          >
            <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
              <CheckboxWidget
                props={{ label: 'Tax-exempt customer' }}
                bind={{
                  value: false,
                  meta: { type: 'boolean', label: 'Tax-exempt', required: false, readOnly: false },
                }}
                on={on}
                context={ctx}
              />
              <CheckboxWidget
                props={{ label: 'Enable automatic invoicing' }}
                bind={{
                  value: true,
                  meta: {
                    type: 'boolean',
                    label: 'Auto-invoice',
                    required: false,
                    readOnly: false,
                  },
                }}
                on={on}
                context={ctx}
              />
              <SelectWidget
                props={{
                  label: 'Payment Terms',
                  options: [
                    { value: 'net15', label: 'Net 15' },
                    { value: 'net30', label: 'Net 30' },
                    { value: 'net60', label: 'Net 60' },
                  ],
                }}
                bind={{
                  value: 'net30',
                  meta: { type: 'enum', label: 'Payment Terms', required: false, readOnly: false },
                }}
                on={on}
                context={ctx}
              />
            </StackWidget>
          </SectionWidget>

          <DividerWidget props={{ margin: 'sm' }} bind={{ value: null }} on={on} context={ctx} />

          <GroupWidget
            props={{ direction: 'row', gap: 'sm', justify: 'end' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          >
            <ButtonWidget
              props={{ label: 'Cancel', variant: 'ghost', size: 'sm' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            />
            <ButtonWidget
              props={{ label: 'Create Customer', variant: 'primary', size: 'sm' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            />
          </GroupWidget>
        </StackWidget>
      </CardWidget>
    </PageShell>
  ),
};
