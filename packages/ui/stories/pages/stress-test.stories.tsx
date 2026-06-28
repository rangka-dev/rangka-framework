import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { PageShell } from './page-shell';
import { DrawerWidget } from '../../src/widgets/overlay/drawer-widget';
import { ModalWidget } from '../../src/widgets/overlay/modal-widget';
import { TableWidget } from '../../src/widgets/data/table-widget';
import {
  InputWidget,
  SelectWidget,
  MoneyWidget,
  DatePickerWidget,
  DateTimeWidget,
  LinkWidget,
  TextareaWidget,
  CheckboxWidget,
  AttachmentWidget,
  ManyToManyWidget,
} from '../../src/widgets/input';
import { TextWidget, BadgeWidget, ComputedWidget, SequenceWidget } from '../../src/widgets/display';
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
  title: 'Widget Compose/Stress Test',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

const on = {};
const editCtx = { record: {}, model: 'sales.invoice', mode: 'edit' as const };
const viewCtx = { record: {}, model: 'sales.invoice', mode: 'view' as const };

const lineItems = [
  { id: '1', item: 'MacBook Pro 16"', qty: '2', rate: '$2,499.00', amount: '$4,998.00' },
  { id: '2', item: 'Magic Keyboard', qty: '5', rate: '$299.00', amount: '$1,495.00' },
  { id: '3', item: 'Studio Display', qty: '1', rate: '$1,599.00', amount: '$1,599.00' },
  { id: '4', item: 'USB-C Cable 2m', qty: '10', rate: '$19.00', amount: '$190.00' },
];

// --- Stress Test 1: Sales Invoice (deeply nested, mixed mode, overlays) ---

export const SalesInvoice: Story = {
  name: '1. Sales Invoice',
  render: function InvoiceDemo() {
    const [addItemOpen, setAddItemOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);

    return (
      <PageShell
        module="Sales"
        page="Invoices"
        action={
          <GroupWidget
            props={{ direction: 'row', gap: 'sm' }}
            bind={{ value: null }}
            on={on}
            context={viewCtx}
          >
            <ButtonWidget
              props={{ label: 'Print', variant: 'ghost', size: 'xs' }}
              bind={{ value: null }}
              on={on}
              context={viewCtx}
            />
            <ButtonWidget
              props={{ label: 'Send', variant: 'secondary', size: 'xs' }}
              bind={{ value: null }}
              on={on}
              context={viewCtx}
            />
            <ButtonWidget
              props={{ label: 'Mark as Paid', variant: 'primary', size: 'xs' }}
              bind={{ value: null }}
              on={on}
              context={viewCtx}
            />
          </GroupWidget>
        }
      >
        <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={viewCtx}>
          {/* Header row with sequence, title, badges */}
          <GroupWidget
            props={{ direction: 'row', justify: 'between', align: 'center' }}
            bind={{ value: null }}
            on={on}
            context={viewCtx}
          >
            <GroupWidget
              props={{ direction: 'row', gap: 'sm', align: 'center' }}
              bind={{ value: null }}
              on={on}
              context={viewCtx}
            >
              <SequenceWidget props={{}} bind={{ value: 'INV-00234' }} on={on} context={viewCtx} />
              <TextWidget
                props={{ variant: 'heading' }}
                bind={{ value: 'Acme Corporation' }}
                on={on}
                context={viewCtx}
              />
              <BadgeWidget
                props={{ variant: 'default', label: 'Sent' }}
                bind={{ value: null }}
                on={on}
                context={viewCtx}
              />
              <BadgeWidget
                props={{ variant: 'secondary', label: 'Net 30' }}
                bind={{ value: null }}
                on={on}
                context={viewCtx}
              />
            </GroupWidget>
            <ButtonWidget
              props={{ label: 'History', variant: 'ghost', size: 'xs' }}
              bind={{ value: null }}
              on={{ click: () => setHistoryOpen(true) }}
              context={viewCtx}
            />
          </GroupWidget>

          {/* Two-column layout: details + summary */}
          <GridWidget
            props={{ columns: 3, gap: 'md' }}
            bind={{ value: null }}
            on={on}
            context={viewCtx}
          >
            {/* Left: 2 cols wide - Invoice details */}
            <CardWidget
              props={{ title: 'Invoice Details' }}
              bind={{ value: null }}
              on={on}
              context={viewCtx}
            >
              <GridWidget
                props={{ columns: 2, gap: 'md' }}
                bind={{ value: null }}
                on={on}
                context={viewCtx}
              >
                <InputWidget
                  props={{ label: 'Customer' }}
                  bind={{
                    value: 'Acme Corporation',
                    meta: { type: 'string', label: 'Customer', required: false, readOnly: true },
                  }}
                  on={on}
                  context={viewCtx}
                />
                <InputWidget
                  props={{ label: 'Invoice Date' }}
                  bind={{
                    value: '2026-06-20',
                    meta: { type: 'string', label: 'Date', required: false, readOnly: true },
                  }}
                  on={on}
                  context={viewCtx}
                />
                <InputWidget
                  props={{ label: 'Due Date' }}
                  bind={{
                    value: '2026-07-20',
                    meta: { type: 'string', label: 'Due', required: false, readOnly: true },
                  }}
                  on={on}
                  context={viewCtx}
                />
                <InputWidget
                  props={{ label: 'PO Number' }}
                  bind={{
                    value: 'PO-2026-0891',
                    meta: { type: 'string', label: 'PO', required: false, readOnly: true },
                  }}
                  on={on}
                  context={viewCtx}
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
                    meta: { type: 'enum', label: 'Terms', required: false, readOnly: true },
                  }}
                  on={on}
                  context={viewCtx}
                />
                <InputWidget
                  props={{ label: 'Sales Rep' }}
                  bind={{
                    value: 'Sarah Johnson',
                    meta: { type: 'string', label: 'Rep', required: false, readOnly: true },
                  }}
                  on={on}
                  context={viewCtx}
                />
              </GridWidget>
            </CardWidget>

            {/* Right: 1 col - Financial summary */}
            <CardWidget
              props={{ title: 'Summary' }}
              bind={{ value: null }}
              on={on}
              context={viewCtx}
            >
              <StackWidget props={{ gap: 'sm' }} bind={{ value: null }} on={on} context={viewCtx}>
                <GroupWidget
                  props={{ direction: 'row', justify: 'between' }}
                  bind={{ value: null }}
                  on={on}
                  context={viewCtx}
                >
                  <TextWidget
                    props={{ variant: 'muted' }}
                    bind={{ value: 'Subtotal' }}
                    on={on}
                    context={viewCtx}
                  />
                  <ComputedWidget
                    props={{ format: 'currency', prefix: '$' }}
                    bind={{ value: 8282 }}
                    on={on}
                    context={viewCtx}
                  />
                </GroupWidget>
                <GroupWidget
                  props={{ direction: 'row', justify: 'between' }}
                  bind={{ value: null }}
                  on={on}
                  context={viewCtx}
                >
                  <TextWidget
                    props={{ variant: 'muted' }}
                    bind={{ value: 'Discount (5%)' }}
                    on={on}
                    context={viewCtx}
                  />
                  <TextWidget
                    props={{ variant: 'body' }}
                    bind={{ value: '-$414.10' }}
                    on={on}
                    context={viewCtx}
                  />
                </GroupWidget>
                <GroupWidget
                  props={{ direction: 'row', justify: 'between' }}
                  bind={{ value: null }}
                  on={on}
                  context={viewCtx}
                >
                  <TextWidget
                    props={{ variant: 'muted' }}
                    bind={{ value: 'Tax (10%)' }}
                    on={on}
                    context={viewCtx}
                  />
                  <ComputedWidget
                    props={{ format: 'currency', prefix: '$' }}
                    bind={{ value: 786.79 }}
                    on={on}
                    context={viewCtx}
                  />
                </GroupWidget>
                <DividerWidget
                  props={{ margin: 'sm' }}
                  bind={{ value: null }}
                  on={on}
                  context={viewCtx}
                />
                <GroupWidget
                  props={{ direction: 'row', justify: 'between' }}
                  bind={{ value: null }}
                  on={on}
                  context={viewCtx}
                >
                  <TextWidget
                    props={{ variant: 'bold' }}
                    bind={{ value: 'Total' }}
                    on={on}
                    context={viewCtx}
                  />
                  <ComputedWidget
                    props={{ format: 'currency', prefix: '$' }}
                    bind={{ value: 8654.69 }}
                    on={on}
                    context={viewCtx}
                  />
                </GroupWidget>
                <GroupWidget
                  props={{ direction: 'row', justify: 'between' }}
                  bind={{ value: null }}
                  on={on}
                  context={viewCtx}
                >
                  <TextWidget
                    props={{ variant: 'muted' }}
                    bind={{ value: 'Paid' }}
                    on={on}
                    context={viewCtx}
                  />
                  <TextWidget
                    props={{ variant: 'body' }}
                    bind={{ value: '$0.00' }}
                    on={on}
                    context={viewCtx}
                  />
                </GroupWidget>
                <GroupWidget
                  props={{ direction: 'row', justify: 'between' }}
                  bind={{ value: null }}
                  on={on}
                  context={viewCtx}
                >
                  <TextWidget
                    props={{ variant: 'bold' }}
                    bind={{ value: 'Balance Due' }}
                    on={on}
                    context={viewCtx}
                  />
                  <TextWidget
                    props={{ variant: 'bold' }}
                    bind={{ value: '$8,654.69' }}
                    on={on}
                    context={viewCtx}
                  />
                </GroupWidget>
              </StackWidget>
            </CardWidget>
          </GridWidget>

          {/* Line items table */}
          <CardWidget
            props={{ title: 'Line Items' }}
            bind={{ value: null }}
            on={on}
            context={viewCtx}
          >
            <StackWidget props={{ gap: 'sm' }} bind={{ value: null }} on={on} context={viewCtx}>
              <GroupWidget
                props={{ direction: 'row', justify: 'end' }}
                bind={{ value: null }}
                on={on}
                context={viewCtx}
              >
                <ButtonWidget
                  props={{ label: 'Add Item', variant: 'secondary', size: 'xs' }}
                  bind={{ value: null }}
                  on={{ click: () => setAddItemOpen(true) }}
                  context={viewCtx}
                />
              </GroupWidget>
              <TableWidget
                props={{
                  variant: 'flat',
                  columns: [
                    { field: 'item', label: 'Item', sortable: true },
                    { field: 'qty', label: 'Qty', align: 'right' },
                    { field: 'rate', label: 'Rate', align: 'right' },
                    { field: 'amount', label: 'Amount', align: 'right' },
                  ],
                }}
                bind={{ value: lineItems }}
                on={{}}
                context={viewCtx}
              />
            </StackWidget>
          </CardWidget>

          {/* Notes & Attachments */}
          <GridWidget
            props={{ columns: 2, gap: 'md' }}
            bind={{ value: null }}
            on={on}
            context={viewCtx}
          >
            <CardWidget props={{ title: 'Notes' }} bind={{ value: null }} on={on} context={viewCtx}>
              <TextareaWidget
                props={{ label: 'Internal Notes', rows: 3 }}
                bind={{
                  value:
                    'Customer requested express shipping. Confirm warehouse availability before dispatch.',
                  meta: { type: 'text', label: 'Notes', required: false, readOnly: true },
                }}
                on={on}
                context={viewCtx}
              />
            </CardWidget>
            <CardWidget
              props={{ title: 'Attachments' }}
              bind={{ value: null }}
              on={on}
              context={viewCtx}
            >
              <AttachmentWidget
                props={{ label: 'Supporting Documents' }}
                bind={{
                  value: { name: 'purchase-order-0891.pdf', size: 245000 },
                  meta: { type: 'attachment', label: 'Documents', required: false, readOnly: true },
                }}
                on={on}
                context={viewCtx}
              />
            </CardWidget>
          </GridWidget>
        </StackWidget>

        {/* Add Line Item Modal */}
        <ModalWidget
          props={{ title: 'Add Line Item', size: 'md' }}
          bind={{ value: addItemOpen, setValue: setAddItemOpen }}
          on={{ close: () => setAddItemOpen(false) }}
          context={editCtx}
        >
          <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={editCtx}>
            <LinkWidget
              props={{
                label: 'Item',
                options: [
                  { value: '1', label: 'MacBook Pro 16"' },
                  { value: '2', label: 'Magic Keyboard' },
                  { value: '3', label: 'Studio Display' },
                ],
              }}
              bind={{
                value: '',
                meta: { type: 'link', label: 'Item', required: true, readOnly: false },
              }}
              on={on}
              context={editCtx}
            />
            <GridWidget
              props={{ columns: 3, gap: 'md' }}
              bind={{ value: null }}
              on={on}
              context={editCtx}
            >
              <InputWidget
                props={{ label: 'Quantity', placeholder: '1' }}
                bind={{
                  value: '',
                  meta: { type: 'int', label: 'Qty', required: true, readOnly: false },
                }}
                on={on}
                context={editCtx}
              />
              <MoneyWidget
                props={{ label: 'Rate', currency: '$' }}
                bind={{
                  value: null,
                  meta: { type: 'money', label: 'Rate', required: true, readOnly: false },
                }}
                on={on}
                context={editCtx}
              />
              <MoneyWidget
                props={{ label: 'Amount', currency: '$' }}
                bind={{
                  value: null,
                  meta: { type: 'money', label: 'Amount', required: false, readOnly: true },
                }}
                on={on}
                context={editCtx}
              />
            </GridWidget>
            <TextareaWidget
              props={{ label: 'Description', placeholder: 'Item description...', rows: 2 }}
              bind={{
                value: '',
                meta: { type: 'text', label: 'Desc', required: false, readOnly: false },
              }}
              on={on}
              context={editCtx}
            />
            <GroupWidget
              props={{ direction: 'row', gap: 'sm', justify: 'end' }}
              bind={{ value: null }}
              on={on}
              context={editCtx}
            >
              <ButtonWidget
                props={{ label: 'Cancel', variant: 'ghost', size: 'sm' }}
                bind={{ value: null }}
                on={{ click: () => setAddItemOpen(false) }}
                context={editCtx}
              />
              <ButtonWidget
                props={{ label: 'Add', variant: 'primary', size: 'sm' }}
                bind={{ value: null }}
                on={on}
                context={editCtx}
              />
            </GroupWidget>
          </StackWidget>
        </ModalWidget>

        {/* History Drawer */}
        <DrawerWidget
          props={{ title: 'Invoice History', width: 'md' }}
          bind={{ value: historyOpen, setValue: setHistoryOpen }}
          on={{ close: () => setHistoryOpen(false) }}
          context={viewCtx}
        >
          <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={viewCtx}>
            <GroupWidget
              props={{ direction: 'row', justify: 'between' }}
              bind={{ value: null }}
              on={on}
              context={viewCtx}
            >
              <TextWidget
                props={{ variant: 'body' }}
                bind={{ value: 'Invoice created' }}
                on={on}
                context={viewCtx}
              />
              <TextWidget
                props={{ variant: 'muted' }}
                bind={{ value: 'Jun 20, 2026 9:30 AM' }}
                on={on}
                context={viewCtx}
              />
            </GroupWidget>
            <GroupWidget
              props={{ direction: 'row', justify: 'between' }}
              bind={{ value: null }}
              on={on}
              context={viewCtx}
            >
              <TextWidget
                props={{ variant: 'body' }}
                bind={{ value: 'Sent to customer' }}
                on={on}
                context={viewCtx}
              />
              <TextWidget
                props={{ variant: 'muted' }}
                bind={{ value: 'Jun 20, 2026 10:15 AM' }}
                on={on}
                context={viewCtx}
              />
            </GroupWidget>
            <GroupWidget
              props={{ direction: 'row', justify: 'between' }}
              bind={{ value: null }}
              on={on}
              context={viewCtx}
            >
              <TextWidget
                props={{ variant: 'body' }}
                bind={{ value: 'Viewed by customer' }}
                on={on}
                context={viewCtx}
              />
              <TextWidget
                props={{ variant: 'muted' }}
                bind={{ value: 'Jun 21, 2026 2:45 PM' }}
                on={on}
                context={viewCtx}
              />
            </GroupWidget>
          </StackWidget>
        </DrawerWidget>
      </PageShell>
    );
  },
};

// --- Stress Test 2: HR Onboarding (deep nesting, many field types, conditional) ---

export const HROnboarding: Story = {
  name: '2. HR Onboarding',
  render: function OnboardingDemo() {
    const [step, setStep] = useState(1);
    const ctx = { record: {}, model: 'hr.employee', mode: 'edit' as const };

    return (
      <PageShell module="HR" page="Onboarding">
        <StackWidget props={{ gap: 'lg' }} bind={{ value: null }} on={on} context={ctx}>
          {/* Progress indicator */}
          <GroupWidget
            props={{ direction: 'row', gap: 'md', align: 'center' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          >
            <BadgeWidget
              props={{ variant: step >= 1 ? 'default' : 'outline', label: '1. Personal' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            />
            <BadgeWidget
              props={{ variant: step >= 2 ? 'default' : 'outline', label: '2. Employment' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            />
            <BadgeWidget
              props={{ variant: step >= 3 ? 'default' : 'outline', label: '3. Compensation' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            />
            <BadgeWidget
              props={{ variant: step >= 4 ? 'default' : 'outline', label: '4. Documents' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            />
          </GroupWidget>

          {/* Step 1: Personal Info */}
          {step === 1 && (
            <CardWidget
              props={{ title: 'Personal Information' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            >
              <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
                <GridWidget
                  props={{ columns: 3, gap: 'md' }}
                  bind={{ value: null }}
                  on={on}
                  context={ctx}
                >
                  <InputWidget
                    props={{ label: 'First Name', placeholder: 'John' }}
                    bind={{
                      value: '',
                      meta: { type: 'string', label: 'First', required: true, readOnly: false },
                    }}
                    on={on}
                    context={ctx}
                  />
                  <InputWidget
                    props={{ label: 'Middle Name', placeholder: 'M.' }}
                    bind={{
                      value: '',
                      meta: { type: 'string', label: 'Middle', required: false, readOnly: false },
                    }}
                    on={on}
                    context={ctx}
                  />
                  <InputWidget
                    props={{ label: 'Last Name', placeholder: 'Doe' }}
                    bind={{
                      value: '',
                      meta: { type: 'string', label: 'Last', required: true, readOnly: false },
                    }}
                    on={on}
                    context={ctx}
                  />
                </GridWidget>
                <GridWidget
                  props={{ columns: 2, gap: 'md' }}
                  bind={{ value: null }}
                  on={on}
                  context={ctx}
                >
                  <InputWidget
                    props={{ label: 'Email', placeholder: 'john@company.com' }}
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
                      meta: { type: 'string', label: 'Phone', required: true, readOnly: false },
                    }}
                    on={on}
                    context={ctx}
                  />
                  <DatePickerWidget
                    props={{ label: 'Date of Birth' }}
                    bind={{
                      value: '',
                      meta: { type: 'date', label: 'DOB', required: true, readOnly: false },
                    }}
                    on={on}
                    context={ctx}
                  />
                  <SelectWidget
                    props={{
                      label: 'Gender',
                      options: [
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' },
                        { value: 'other', label: 'Other' },
                        { value: 'prefer_not', label: 'Prefer not to say' },
                      ],
                    }}
                    bind={{
                      value: '',
                      meta: { type: 'enum', label: 'Gender', required: false, readOnly: false },
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
                      props={{ label: 'Street Address' }}
                      bind={{
                        value: '',
                        meta: { type: 'string', label: 'Street', required: false, readOnly: false },
                      }}
                      on={on}
                      context={ctx}
                    />
                    <InputWidget
                      props={{ label: 'Apt/Suite' }}
                      bind={{
                        value: '',
                        meta: { type: 'string', label: 'Apt', required: false, readOnly: false },
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
                      props={{ label: 'ZIP Code' }}
                      bind={{
                        value: '',
                        meta: { type: 'string', label: 'ZIP', required: false, readOnly: false },
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
                  props={{ label: 'Emergency Contact', collapsible: true }}
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
                      props={{ label: 'Contact Name' }}
                      bind={{
                        value: '',
                        meta: { type: 'string', label: 'Name', required: false, readOnly: false },
                      }}
                      on={on}
                      context={ctx}
                    />
                    <InputWidget
                      props={{ label: 'Relationship' }}
                      bind={{
                        value: '',
                        meta: {
                          type: 'string',
                          label: 'Relationship',
                          required: false,
                          readOnly: false,
                        },
                      }}
                      on={on}
                      context={ctx}
                    />
                    <InputWidget
                      props={{ label: 'Phone' }}
                      bind={{
                        value: '',
                        meta: { type: 'string', label: 'Phone', required: false, readOnly: false },
                      }}
                      on={on}
                      context={ctx}
                    />
                    <InputWidget
                      props={{ label: 'Email' }}
                      bind={{
                        value: '',
                        meta: { type: 'string', label: 'Email', required: false, readOnly: false },
                      }}
                      on={on}
                      context={ctx}
                    />
                  </GridWidget>
                </SectionWidget>
              </StackWidget>
            </CardWidget>
          )}

          {/* Step 2: Employment */}
          {step === 2 && (
            <CardWidget
              props={{ title: 'Employment Details' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            >
              <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
                <GridWidget
                  props={{ columns: 2, gap: 'md' }}
                  bind={{ value: null }}
                  on={on}
                  context={ctx}
                >
                  <InputWidget
                    props={{ label: 'Job Title' }}
                    bind={{
                      value: '',
                      meta: { type: 'string', label: 'Title', required: true, readOnly: false },
                    }}
                    on={on}
                    context={ctx}
                  />
                  <LinkWidget
                    props={{
                      label: 'Department',
                      options: [
                        { value: '1', label: 'Engineering' },
                        { value: '2', label: 'Sales' },
                        { value: '3', label: 'Marketing' },
                        { value: '4', label: 'HR' },
                      ],
                    }}
                    bind={{
                      value: '',
                      meta: { type: 'link', label: 'Dept', required: true, readOnly: false },
                    }}
                    on={on}
                    context={ctx}
                  />
                  <LinkWidget
                    props={{
                      label: 'Reports To',
                      options: [
                        { value: '1', label: 'Sarah Johnson' },
                        { value: '2', label: 'Mike Chen' },
                        { value: '3', label: 'Lisa Park' },
                      ],
                    }}
                    bind={{
                      value: '',
                      meta: { type: 'link', label: 'Manager', required: true, readOnly: false },
                    }}
                    on={on}
                    context={ctx}
                  />
                  <SelectWidget
                    props={{
                      label: 'Employment Type',
                      options: [
                        { value: 'full', label: 'Full-time' },
                        { value: 'part', label: 'Part-time' },
                        { value: 'contract', label: 'Contract' },
                      ],
                    }}
                    bind={{
                      value: 'full',
                      meta: { type: 'enum', label: 'Type', required: true, readOnly: false },
                    }}
                    on={on}
                    context={ctx}
                  />
                  <DatePickerWidget
                    props={{ label: 'Start Date' }}
                    bind={{
                      value: '2026-07-01',
                      meta: { type: 'date', label: 'Start', required: true, readOnly: false },
                    }}
                    on={on}
                    context={ctx}
                  />
                  <SelectWidget
                    props={{
                      label: 'Work Location',
                      options: [
                        { value: 'sf', label: 'San Francisco' },
                        { value: 'ny', label: 'New York' },
                        { value: 'remote', label: 'Remote' },
                      ],
                    }}
                    bind={{
                      value: '',
                      meta: { type: 'enum', label: 'Location', required: false, readOnly: false },
                    }}
                    on={on}
                    context={ctx}
                  />
                </GridWidget>
                <ManyToManyWidget
                  props={{
                    label: 'Skills',
                    options: [
                      { value: 'react', label: 'React' },
                      { value: 'ts', label: 'TypeScript' },
                      { value: 'node', label: 'Node.js' },
                      { value: 'python', label: 'Python' },
                      { value: 'go', label: 'Go' },
                    ],
                  }}
                  bind={{
                    value: [],
                    meta: {
                      type: 'many-to-many',
                      label: 'Skills',
                      required: false,
                      readOnly: false,
                    },
                  }}
                  on={on}
                  context={ctx}
                />
                <CheckboxWidget
                  props={{ label: 'Eligible for remote work' }}
                  bind={{
                    value: true,
                    meta: { type: 'boolean', label: 'Remote', required: false, readOnly: false },
                  }}
                  on={on}
                  context={ctx}
                />
                <CheckboxWidget
                  props={{ label: 'Requires visa sponsorship' }}
                  bind={{
                    value: false,
                    meta: { type: 'boolean', label: 'Visa', required: false, readOnly: false },
                  }}
                  on={on}
                  context={ctx}
                />
              </StackWidget>
            </CardWidget>
          )}

          {/* Step 3: Compensation */}
          {step === 3 && (
            <CardWidget
              props={{ title: 'Compensation & Benefits' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            >
              <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
                <GridWidget
                  props={{ columns: 2, gap: 'md' }}
                  bind={{ value: null }}
                  on={on}
                  context={ctx}
                >
                  <MoneyWidget
                    props={{ label: 'Base Salary', currency: '$' }}
                    bind={{
                      value: null,
                      meta: { type: 'money', label: 'Salary', required: true, readOnly: false },
                    }}
                    on={on}
                    context={ctx}
                  />
                  <SelectWidget
                    props={{
                      label: 'Pay Frequency',
                      options: [
                        { value: 'monthly', label: 'Monthly' },
                        { value: 'biweekly', label: 'Bi-weekly' },
                        { value: 'weekly', label: 'Weekly' },
                      ],
                    }}
                    bind={{
                      value: 'monthly',
                      meta: { type: 'enum', label: 'Frequency', required: true, readOnly: false },
                    }}
                    on={on}
                    context={ctx}
                  />
                  <InputWidget
                    props={{ label: 'Bonus Target (%)', placeholder: '0' }}
                    bind={{
                      value: '',
                      meta: { type: 'decimal', label: 'Bonus', required: false, readOnly: false },
                    }}
                    on={on}
                    context={ctx}
                  />
                  <InputWidget
                    props={{ label: 'Equity (shares)', placeholder: '0' }}
                    bind={{
                      value: '',
                      meta: { type: 'int', label: 'Equity', required: false, readOnly: false },
                    }}
                    on={on}
                    context={ctx}
                  />
                </GridWidget>
                <SectionWidget
                  props={{ label: 'Benefits Enrollment' }}
                  bind={{ value: null }}
                  on={on}
                  context={ctx}
                >
                  <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
                    <CheckboxWidget
                      props={{ label: 'Health Insurance (PPO)' }}
                      bind={{
                        value: true,
                        meta: {
                          type: 'boolean',
                          label: 'Health',
                          required: false,
                          readOnly: false,
                        },
                      }}
                      on={on}
                      context={ctx}
                    />
                    <CheckboxWidget
                      props={{ label: 'Dental Insurance' }}
                      bind={{
                        value: true,
                        meta: {
                          type: 'boolean',
                          label: 'Dental',
                          required: false,
                          readOnly: false,
                        },
                      }}
                      on={on}
                      context={ctx}
                    />
                    <CheckboxWidget
                      props={{ label: 'Vision Insurance' }}
                      bind={{
                        value: false,
                        meta: {
                          type: 'boolean',
                          label: 'Vision',
                          required: false,
                          readOnly: false,
                        },
                      }}
                      on={on}
                      context={ctx}
                    />
                    <CheckboxWidget
                      props={{ label: '401(k) Enrollment' }}
                      bind={{
                        value: true,
                        meta: { type: 'boolean', label: '401k', required: false, readOnly: false },
                      }}
                      on={on}
                      context={ctx}
                    />
                    <CheckboxWidget
                      props={{ label: 'Life Insurance (2x salary)' }}
                      bind={{
                        value: false,
                        meta: { type: 'boolean', label: 'Life', required: false, readOnly: false },
                      }}
                      on={on}
                      context={ctx}
                    />
                  </StackWidget>
                </SectionWidget>
              </StackWidget>
            </CardWidget>
          )}

          {/* Step 4: Documents */}
          {step === 4 && (
            <CardWidget
              props={{ title: 'Documents & Agreements' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            >
              <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
                <AttachmentWidget
                  props={{ label: 'Government ID', accept: 'image/*,application/pdf' }}
                  bind={{
                    value: null,
                    meta: { type: 'attachment', label: 'ID', required: true, readOnly: false },
                  }}
                  on={on}
                  context={ctx}
                />
                <AttachmentWidget
                  props={{ label: 'W-4 Form', accept: 'application/pdf' }}
                  bind={{
                    value: null,
                    meta: { type: 'attachment', label: 'W4', required: true, readOnly: false },
                  }}
                  on={on}
                  context={ctx}
                />
                <AttachmentWidget
                  props={{ label: 'Direct Deposit Form', accept: 'application/pdf' }}
                  bind={{
                    value: null,
                    meta: { type: 'attachment', label: 'Deposit', required: true, readOnly: false },
                  }}
                  on={on}
                  context={ctx}
                />
                <SectionWidget
                  props={{ label: 'Agreements' }}
                  bind={{ value: null }}
                  on={on}
                  context={ctx}
                >
                  <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
                    <CheckboxWidget
                      props={{ label: 'I have read and agree to the Employee Handbook' }}
                      bind={{
                        value: false,
                        meta: {
                          type: 'boolean',
                          label: 'Handbook',
                          required: true,
                          readOnly: false,
                        },
                      }}
                      on={on}
                      context={ctx}
                    />
                    <CheckboxWidget
                      props={{ label: 'I agree to the Non-Disclosure Agreement (NDA)' }}
                      bind={{
                        value: false,
                        meta: { type: 'boolean', label: 'NDA', required: true, readOnly: false },
                      }}
                      on={on}
                      context={ctx}
                    />
                    <CheckboxWidget
                      props={{ label: 'I acknowledge the Code of Conduct' }}
                      bind={{
                        value: false,
                        meta: { type: 'boolean', label: 'CoC', required: true, readOnly: false },
                      }}
                      on={on}
                      context={ctx}
                    />
                    <CheckboxWidget
                      props={{ label: 'I consent to background check' }}
                      bind={{
                        value: false,
                        meta: { type: 'boolean', label: 'BGC', required: true, readOnly: false },
                      }}
                      on={on}
                      context={ctx}
                    />
                  </StackWidget>
                </SectionWidget>
                <TextareaWidget
                  props={{
                    label: 'Additional Notes',
                    rows: 3,
                    placeholder: 'Any special requests or notes...',
                  }}
                  bind={{
                    value: '',
                    meta: { type: 'text', label: 'Notes', required: false, readOnly: false },
                  }}
                  on={on}
                  context={ctx}
                />
              </StackWidget>
            </CardWidget>
          )}

          {/* Navigation buttons */}
          <GroupWidget
            props={{ direction: 'row', gap: 'sm', justify: 'between' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          >
            <ButtonWidget
              props={{ label: 'Back', variant: 'ghost', size: 'sm', disabled: step === 1 }}
              bind={{ value: null }}
              on={{ click: () => setStep((s) => Math.max(1, s - 1)) }}
              context={ctx}
            />
            <GroupWidget
              props={{ direction: 'row', gap: 'sm' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            >
              <ButtonWidget
                props={{ label: 'Save Draft', variant: 'secondary', size: 'sm' }}
                bind={{ value: null }}
                on={on}
                context={ctx}
              />
              {step < 4 ? (
                <ButtonWidget
                  props={{ label: 'Next', variant: 'primary', size: 'sm' }}
                  bind={{ value: null }}
                  on={{ click: () => setStep((s) => Math.min(4, s + 1)) }}
                  context={ctx}
                />
              ) : (
                <ButtonWidget
                  props={{ label: 'Submit Onboarding', variant: 'primary', size: 'sm' }}
                  bind={{ value: null }}
                  on={on}
                  context={ctx}
                />
              )}
            </GroupWidget>
          </GroupWidget>
        </StackWidget>
      </PageShell>
    );
  },
};
