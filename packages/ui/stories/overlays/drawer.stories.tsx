import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DrawerWidget } from '../../src/widgets/overlay/drawer-widget';
import { InputWidget, SelectWidget, TextareaWidget } from '../../src/widgets/input';
import { ButtonWidget } from '../../src/widgets/action';
import { StackWidget, GroupWidget, DividerWidget } from '../../src/widgets/layout';
import { Button } from '../../src/primitives/button';

const meta: Meta = {
  title: 'Overlays/Drawer',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

const on = {};
const ctx = { record: {}, model: 'sales.order', mode: 'edit' as const };

export const RightSmall: Story = {
  name: 'Right — Small',
  render: function Demo() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
          Open Small Drawer
        </Button>
        <DrawerWidget
          props={{ title: 'Quick Add', width: 'sm' }}
          bind={{ value: open, setValue: setOpen }}
          on={{ close: () => setOpen(false) }}
          context={ctx}
        >
          <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
            <InputWidget
              props={{ label: 'Name', placeholder: 'Enter name' }}
              bind={{
                value: '',
                meta: { type: 'string', label: 'Name', required: true, readOnly: false },
              }}
              on={on}
              context={ctx}
            />
            <InputWidget
              props={{ label: 'Email', placeholder: 'Enter email' }}
              bind={{
                value: '',
                meta: { type: 'string', label: 'Email', required: true, readOnly: false },
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
                props={{ label: 'Save', variant: 'primary', size: 'sm' }}
                bind={{ value: null }}
                on={on}
                context={ctx}
              />
            </GroupWidget>
          </StackWidget>
        </DrawerWidget>
      </>
    );
  },
};

export const RightMedium: Story = {
  name: 'Right — Medium',
  render: function Demo() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
          Open Medium Drawer
        </Button>
        <DrawerWidget
          props={{ title: 'Create Customer', width: 'md' }}
          bind={{ value: open, setValue: setOpen }}
          on={{ close: () => setOpen(false) }}
          context={ctx}
        >
          <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
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
              props={{ label: 'Contact Person', placeholder: 'Full name' }}
              bind={{
                value: '',
                meta: { type: 'string', label: 'Contact', required: false, readOnly: false },
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
            <TextareaWidget
              props={{ label: 'Notes', placeholder: 'Add any notes...', rows: 3 }}
              bind={{
                value: '',
                meta: { type: 'text', label: 'Notes', required: false, readOnly: false },
              }}
              on={on}
              context={ctx}
            />
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
                on={{ click: () => setOpen(false) }}
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
        </DrawerWidget>
      </>
    );
  },
};

export const RightLarge: Story = {
  name: 'Right — Large',
  render: function Demo() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
          Open Large Drawer
        </Button>
        <DrawerWidget
          props={{ title: 'Order Details', width: 'lg' }}
          bind={{ value: open, setValue: setOpen }}
          on={{ close: () => setOpen(false) }}
          context={{ record: {}, model: 'sales.order', mode: 'view' }}
        >
          <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
            <InputWidget
              props={{ label: 'Customer' }}
              bind={{
                value: 'Acme Corporation',
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
              props={{ label: 'Status' }}
              bind={{
                value: 'Confirmed',
                meta: { type: 'string', label: 'Status', required: false, readOnly: true },
              }}
              on={on}
              context={ctx}
            />
            <InputWidget
              props={{ label: 'Total' }}
              bind={{
                value: '$4,675.00',
                meta: { type: 'string', label: 'Total', required: false, readOnly: true },
              }}
              on={on}
              context={ctx}
            />
            <TextareaWidget
              props={{ label: 'Notes', rows: 4 }}
              bind={{
                value: 'Priority order. Ship via express. Contact before delivery.',
                meta: { type: 'text', label: 'Notes', required: false, readOnly: true },
              }}
              on={on}
              context={ctx}
            />
          </StackWidget>
        </DrawerWidget>
      </>
    );
  },
};
