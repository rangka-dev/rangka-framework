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

const meta: Meta = {
  title: 'Widget Compose/Record Detail',
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

export const CustomerDetail: Story = {
  name: 'Customer Detail',
  render: () => (
    <PageShell module="Sales" page="Customers">
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
              bind={{ value: 'Acme Corporation' }}
              on={on}
              context={ctx}
            />
            <BadgeWidget
              props={{ variant: 'default', label: 'Active' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            />
          </GroupWidget>
          <ButtonWidget
            props={{ label: 'Archive', variant: 'secondary', size: 'xs' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          />
        </GroupWidget>

        <GridWidget props={{ columns: 2, gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
          <CardWidget props={{}} bind={{ value: null }} on={on} context={ctx}>
            <SectionWidget
              props={{ label: 'General' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            >
              <FieldWidget
                props={{}}
                bind={fieldBind('string', 'Acme Corporation', { label: 'Customer Name' })}
                on={on}
                context={ctx}
              />
              <FieldWidget
                props={{}}
                bind={fieldBind('string', 'billing@acme.com', { label: 'Email' })}
                on={on}
                context={ctx}
              />
              <FieldWidget
                props={{}}
                bind={fieldBind('string', '+1 555-0199', { label: 'Phone' })}
                on={on}
                context={ctx}
              />
              <FieldWidget
                props={{}}
                bind={fieldBind('link', 'cat-enterprise', {
                  label: 'Category',
                  options: [
                    { value: 'cat-enterprise', label: 'Enterprise' },
                    { value: 'cat-smb', label: 'SMB' },
                    { value: 'cat-startup', label: 'Startup' },
                  ],
                })}
                on={on}
                context={ctx}
              />
            </SectionWidget>

            <SectionWidget
              props={{ label: 'Billing' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            >
              <FieldWidget
                props={{}}
                bind={fieldBind('decimal', 50000, { label: 'Credit Limit' })}
                on={on}
                context={ctx}
              />
              <FieldWidget
                props={{}}
                bind={fieldBind('enum', 'Net 30', {
                  label: 'Payment Terms',
                  options: [
                    { value: 'Net 15', label: 'Net 15' },
                    { value: 'Net 30', label: 'Net 30' },
                    { value: 'Net 60', label: 'Net 60' },
                    { value: 'COD', label: 'COD' },
                  ],
                })}
                on={on}
                context={ctx}
              />
              <FieldWidget
                props={{}}
                bind={fieldBind('boolean', true, { label: 'Active' })}
                on={on}
                context={ctx}
              />
            </SectionWidget>

            <SectionWidget props={{ label: 'System' }} bind={{ value: null }} on={on} context={ctx}>
              <FieldWidget
                props={{}}
                bind={fieldBind('datetime', '2025-03-12T09:30:00.000Z', {
                  label: 'Created',
                  readOnly: true,
                })}
                on={on}
                context={ctx}
              />
              <FieldWidget
                props={{}}
                bind={fieldBind('datetime', '2026-06-28T14:15:00.000Z', {
                  label: 'Updated',
                  readOnly: true,
                })}
                on={on}
                context={ctx}
              />
            </SectionWidget>
          </CardWidget>
          <CardWidget props={{ title: 'Activity' }} bind={{ value: null }} on={on} context={ctx}>
            <TextWidget
              props={{ variant: 'muted' }}
              bind={{ value: 'Activity feed coming soon' }}
              on={on}
              context={ctx}
            />
          </CardWidget>
        </GridWidget>
      </StackWidget>
    </PageShell>
  ),
};

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
          <GroupWidget
            props={{ direction: 'row', gap: 'xs' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          >
            <ButtonWidget
              props={{ label: 'Print', variant: 'secondary', size: 'xs' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            />
            <ButtonWidget
              props={{ label: 'Mark Shipped', variant: 'primary', size: 'xs' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            />
          </GroupWidget>
        </GroupWidget>

        <GridWidget props={{ columns: 2, gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
          <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
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
                      { value: 'cust-003', label: 'Wayne Enterprises' },
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
                      { value: 'delivered', label: 'Delivered' },
                    ],
                  })}
                  on={on}
                  context={ctx}
                />
                <FieldWidget
                  props={{}}
                  bind={fieldBind('enum', 'normal', {
                    label: 'Priority',
                    options: [
                      { value: 'low', label: 'Low' },
                      { value: 'normal', label: 'Normal' },
                      { value: 'high', label: 'High' },
                      { value: 'urgent', label: 'Urgent' },
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
                  bind={fieldBind('int', 12, { label: 'Line Items', readOnly: true })}
                  on={on}
                  context={ctx}
                />
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
              </SectionWidget>

              <SectionWidget
                props={{ label: 'Settings' }}
                bind={{ value: null }}
                on={on}
                context={ctx}
              >
                <FieldWidget
                  props={{}}
                  bind={fieldBind('boolean', true, { label: 'Tax Inclusive' })}
                  on={on}
                  context={ctx}
                />
                <FieldWidget
                  props={{}}
                  bind={fieldBind('boolean', true, { label: 'Auto Invoice' })}
                  on={on}
                  context={ctx}
                />
                <FieldWidget
                  props={{}}
                  bind={fieldBind('string', null, { label: 'PO Number' })}
                  on={on}
                  context={ctx}
                />
              </SectionWidget>
            </CardWidget>
          </StackWidget>

          <CardWidget props={{ title: 'Activity' }} bind={{ value: null }} on={on} context={ctx}>
            <TextWidget
              props={{ variant: 'muted' }}
              bind={{ value: 'Activity feed coming soon' }}
              on={on}
              context={ctx}
            />
          </CardWidget>
        </GridWidget>
      </StackWidget>
    </PageShell>
  ),
};

export const InventoryItemDetail: Story = {
  name: 'Inventory Item Detail',
  render: () => (
    <PageShell module="Inventory" page="Products">
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
            <SequenceWidget props={{}} bind={{ value: 'ITM-00381' }} on={on} context={ctx} />
            <TextWidget
              props={{ variant: 'heading' }}
              bind={{ value: 'Steel Beam H200' }}
              on={on}
              context={ctx}
            />
          </GroupWidget>
          <ButtonWidget
            props={{ label: 'Adjust Stock', variant: 'secondary', size: 'xs' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          />
        </GroupWidget>

        <GridWidget props={{ columns: 2, gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
          <CardWidget props={{}} bind={{ value: null }} on={on} context={ctx}>
            <SectionWidget
              props={{ label: 'Product Info' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            >
              <FieldWidget
                props={{}}
                bind={fieldBind('string', 'Steel Beam H200', { label: 'Item Name' })}
                on={on}
                context={ctx}
              />
              <FieldWidget
                props={{}}
                bind={fieldBind('link', 'cat-structural', {
                  label: 'Category',
                  options: [
                    { value: 'cat-structural', label: 'Structural Steel' },
                    { value: 'cat-pipe', label: 'Pipes & Fittings' },
                    { value: 'cat-sheet', label: 'Sheet Metal' },
                  ],
                })}
                on={on}
                context={ctx}
              />
              <FieldWidget
                props={{}}
                bind={fieldBind('enum', 'Piece', {
                  label: 'Unit',
                  options: [
                    { value: 'Piece', label: 'Piece' },
                    { value: 'Kg', label: 'Kg' },
                    { value: 'Metre', label: 'Metre' },
                    { value: 'Box', label: 'Box' },
                  ],
                })}
                on={on}
                context={ctx}
              />
              <FieldWidget
                props={{}}
                bind={fieldBind('string', '4901234567890', { label: 'Barcode' })}
                on={on}
                context={ctx}
              />
              <FieldWidget
                props={{}}
                bind={fieldBind('decimal', 26.5, { label: 'Weight (kg)' })}
                on={on}
                context={ctx}
              />
            </SectionWidget>

            <SectionWidget
              props={{ label: 'Pricing' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            >
              <FieldWidget
                props={{}}
                bind={fieldBind('money', 320.0, { label: 'Cost Price' })}
                on={on}
                context={ctx}
              />
              <FieldWidget
                props={{}}
                bind={fieldBind('money', 485.0, { label: 'Selling Price' })}
                on={on}
                context={ctx}
              />
            </SectionWidget>

            <SectionWidget props={{ label: 'Stock' }} bind={{ value: null }} on={on} context={ctx}>
              <FieldWidget
                props={{}}
                bind={fieldBind('boolean', true, { label: 'Stockable' })}
                on={on}
                context={ctx}
              />
              <FieldWidget
                props={{}}
                bind={fieldBind('int', 25, { label: 'Reorder Point' })}
                on={on}
                context={ctx}
              />
            </SectionWidget>

            <SectionWidget props={{ label: 'System' }} bind={{ value: null }} on={on} context={ctx}>
              <FieldWidget
                props={{}}
                bind={fieldBind('datetime', '2025-11-02T08:00:00.000Z', {
                  label: 'Created',
                  readOnly: true,
                })}
                on={on}
                context={ctx}
              />
              <FieldWidget
                props={{}}
                bind={fieldBind('datetime', '2026-06-30T16:45:00.000Z', {
                  label: 'Updated',
                  readOnly: true,
                })}
                on={on}
                context={ctx}
              />
            </SectionWidget>
          </CardWidget>
          <CardWidget props={{ title: 'Activity' }} bind={{ value: null }} on={on} context={ctx}>
            <TextWidget
              props={{ variant: 'muted' }}
              bind={{ value: 'Activity feed coming soon' }}
              on={on}
              context={ctx}
            />
          </CardWidget>
        </GridWidget>
      </StackWidget>
    </PageShell>
  ),
};
