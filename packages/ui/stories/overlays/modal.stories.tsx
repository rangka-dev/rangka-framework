import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ModalWidget } from '../../src/widgets/overlay/modal-widget';
import { InputWidget, SelectWidget, TextareaWidget } from '../../src/widgets/input';
import { ButtonWidget } from '../../src/widgets/action';
import { StackWidget, GroupWidget, GridWidget } from '../../src/widgets/layout';
import { TextWidget } from '../../src/widgets/display';
import { Button } from '../../src/primitives/button';

const meta: Meta = {
  title: 'Overlays/Modal',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

const on = {};
const ctx = { record: {}, model: 'sales.order', mode: 'edit' as const };

export const Small: Story = {
  name: 'Small — Confirmation',
  render: function Demo() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
          Delete Order
        </Button>
        <ModalWidget
          props={{
            title: 'Delete Order',
            description: 'This action cannot be undone.',
            size: 'sm',
          }}
          bind={{ value: open, setValue: setOpen }}
          on={{ close: () => setOpen(false) }}
          context={ctx}
        >
          <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
            <TextWidget
              props={{ variant: 'body' }}
              bind={{
                value:
                  'Are you sure you want to delete order ORD-001? All associated invoice items will also be removed.',
              }}
              on={on}
              context={ctx}
            />
            <GroupWidget
              props={{ direction: 'row', gap: 'sm', justify: 'end' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            >
              <ButtonWidget
                props={{ label: 'Cancel', variant: 'ghost', size: 'sm' }}
                bind={{ value: null }}
                on={{ click: () => setOpen(false) }}
                context={ctx}
              />
              <ButtonWidget
                props={{ label: 'Delete', variant: 'destructive', size: 'sm' }}
                bind={{ value: null }}
                on={on}
                context={ctx}
              />
            </GroupWidget>
          </StackWidget>
        </ModalWidget>
      </>
    );
  },
};

export const Medium: Story = {
  name: 'Medium — Form',
  render: function Demo() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
          Add Customer
        </Button>
        <ModalWidget
          props={{ title: 'New Customer', size: 'md' }}
          bind={{ value: open, setValue: setOpen }}
          on={{ close: () => setOpen(false) }}
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
                props={{ label: 'Company Name', placeholder: 'Enter company name' }}
                bind={{
                  value: '',
                  meta: { type: 'string', label: 'Company', required: true, readOnly: false },
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
                  meta: { type: 'enum', label: 'Terms', required: false, readOnly: false },
                }}
                on={on}
                context={ctx}
              />
            </GridWidget>
            <TextareaWidget
              props={{ label: 'Notes', placeholder: 'Add notes...', rows: 3 }}
              bind={{
                value: '',
                meta: { type: 'text', label: 'Notes', required: false, readOnly: false },
              }}
              on={on}
              context={ctx}
            />
            <GroupWidget
              props={{ direction: 'row', gap: 'sm', justify: 'end' }}
              bind={{ value: null }}
              on={on}
              context={ctx}
            >
              <ButtonWidget
                props={{ label: 'Cancel', variant: 'ghost', size: 'sm' }}
                bind={{ value: null }}
                on={{ click: () => setOpen(false) }}
                context={ctx}
              />
              <ButtonWidget
                props={{ label: 'Create', variant: 'primary', size: 'sm' }}
                bind={{ value: null }}
                on={on}
                context={ctx}
              />
            </GroupWidget>
          </StackWidget>
        </ModalWidget>
      </>
    );
  },
};

export const Large: Story = {
  name: 'Large — Detail',
  render: function Demo() {
    const [open, setOpen] = useState(false);
    const viewCtx = { record: {}, model: 'sales.order', mode: 'view' as const };
    return (
      <>
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          View Details
        </Button>
        <ModalWidget
          props={{ title: 'Order ORD-001', size: 'lg' }}
          bind={{ value: open, setValue: setOpen }}
          on={{ close: () => setOpen(false) }}
          context={viewCtx}
        >
          <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={viewCtx}>
            <GridWidget
              props={{ columns: 3, gap: 'md' }}
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
                props={{ label: 'Date' }}
                bind={{
                  value: '2026-06-20',
                  meta: { type: 'string', label: 'Date', required: false, readOnly: true },
                }}
                on={on}
                context={viewCtx}
              />
              <InputWidget
                props={{ label: 'Status' }}
                bind={{
                  value: 'Confirmed',
                  meta: { type: 'string', label: 'Status', required: false, readOnly: true },
                }}
                on={on}
                context={viewCtx}
              />
              <InputWidget
                props={{ label: 'Priority' }}
                bind={{
                  value: 'Normal',
                  meta: { type: 'string', label: 'Priority', required: false, readOnly: true },
                }}
                on={on}
                context={viewCtx}
              />
              <InputWidget
                props={{ label: 'Warehouse' }}
                bind={{
                  value: 'Main Warehouse',
                  meta: { type: 'string', label: 'Warehouse', required: false, readOnly: true },
                }}
                on={on}
                context={viewCtx}
              />
              <InputWidget
                props={{ label: 'Total' }}
                bind={{
                  value: '$4,675.00',
                  meta: { type: 'string', label: 'Total', required: false, readOnly: true },
                }}
                on={on}
                context={viewCtx}
              />
            </GridWidget>
            <TextareaWidget
              props={{ label: 'Notes', rows: 3 }}
              bind={{
                value: 'Priority order. Ship via express delivery.',
                meta: { type: 'text', label: 'Notes', required: false, readOnly: true },
              }}
              on={on}
              context={viewCtx}
            />
            <GroupWidget
              props={{ direction: 'row', gap: 'sm', justify: 'end' }}
              bind={{ value: null }}
              on={on}
              context={viewCtx}
            >
              <ButtonWidget
                props={{ label: 'Close', variant: 'ghost', size: 'sm' }}
                bind={{ value: null }}
                on={{ click: () => setOpen(false) }}
                context={viewCtx}
              />
              <ButtonWidget
                props={{ label: 'Edit Order', variant: 'primary', size: 'sm' }}
                bind={{ value: null }}
                on={on}
                context={viewCtx}
              />
            </GroupWidget>
          </StackWidget>
        </ModalWidget>
      </>
    );
  },
};
