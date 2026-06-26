import type { Meta, StoryObj } from '@storybook/react';
import { PageShell } from './page-shell';
import { InputWidget, SelectWidget, CheckboxWidget, TextareaWidget } from '../../src/widgets/input';
import { ButtonWidget } from '../../src/widgets/action';
import {
  GridWidget,
  CardWidget,
  StackWidget,
  GroupWidget,
  DividerWidget,
} from '../../src/widgets/layout';

const meta: Meta = {
  title: 'Pages/Settings',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

const on = {};
const ctx = { record: {}, model: 'settings', mode: 'edit' as const };

export const CompanySettings: Story = {
  name: 'Company Settings',
  render: () => (
    <PageShell module="Settings" page="Company">
      <StackWidget props={{ gap: 'lg' }} bind={{ value: null }} on={on} context={ctx}>
        <CardWidget
          props={{ title: 'General', description: 'Basic company information.' }}
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
              props={{ label: 'Company Name' }}
              bind={{
                value: 'Acme Corp',
                meta: { type: 'string', label: 'Company Name', required: true, readOnly: false },
              }}
              on={on}
              context={ctx}
            />
            <InputWidget
              props={{ label: 'Legal Name' }}
              bind={{
                value: 'Acme Corporation Ltd.',
                meta: { type: 'string', label: 'Legal Name', required: false, readOnly: false },
              }}
              on={on}
              context={ctx}
            />
            <InputWidget
              props={{ label: 'Tax ID' }}
              bind={{
                value: '12-3456789',
                meta: { type: 'string', label: 'Tax ID', required: false, readOnly: false },
              }}
              on={on}
              context={ctx}
            />
            <SelectWidget
              props={{
                label: 'Currency',
                options: [
                  { value: 'usd', label: 'USD ($)' },
                  { value: 'eur', label: 'EUR (€)' },
                  { value: 'gbp', label: 'GBP (£)' },
                ],
              }}
              bind={{
                value: 'usd',
                meta: { type: 'enum', label: 'Currency', required: true, readOnly: false },
              }}
              on={on}
              context={ctx}
            />
          </GridWidget>
        </CardWidget>

        <CardWidget
          props={{ title: 'Invoicing', description: 'Default invoice settings.' }}
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
                props={{ label: 'Invoice Prefix' }}
                bind={{
                  value: 'INV-',
                  meta: { type: 'string', label: 'Prefix', required: false, readOnly: false },
                }}
                on={on}
                context={ctx}
              />
              <InputWidget
                props={{ label: 'Next Number' }}
                bind={{
                  value: 1042,
                  meta: { type: 'int', label: 'Next Number', required: false, readOnly: false },
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
              <InputWidget
                props={{ label: 'Default Tax Rate (%)' }}
                bind={{
                  value: 10,
                  meta: { type: 'decimal', label: 'Tax Rate', required: false, readOnly: false },
                }}
                on={on}
                context={ctx}
              />
            </GridWidget>
            <CheckboxWidget
              props={{ label: 'Auto-generate invoice on order confirmation' }}
              bind={{
                value: true,
                meta: { type: 'boolean', label: 'Auto-generate', required: false, readOnly: false },
              }}
              on={on}
              context={ctx}
            />
            <CheckboxWidget
              props={{ label: 'Send invoice by email automatically' }}
              bind={{
                value: false,
                meta: { type: 'boolean', label: 'Email invoice', required: false, readOnly: false },
              }}
              on={on}
              context={ctx}
            />
            <TextareaWidget
              props={{ label: 'Invoice Footer Note', rows: 2 }}
              bind={{
                value: 'Thank you for your business.',
                meta: { type: 'text', label: 'Footer', required: false, readOnly: false },
              }}
              on={on}
              context={ctx}
            />
          </StackWidget>
        </CardWidget>

        <GroupWidget
          props={{ direction: 'row', gap: 'sm', justify: 'end' }}
          bind={{ value: null }}
          on={on}
          context={ctx}
        >
          <ButtonWidget
            props={{ label: 'Reset', variant: 'ghost', size: 'sm' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          />
          <ButtonWidget
            props={{ label: 'Save Changes', variant: 'primary', size: 'sm' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          />
        </GroupWidget>
      </StackWidget>
    </PageShell>
  ),
};

export const UserPreferences: Story = {
  name: 'User Preferences',
  render: () => (
    <PageShell module="Settings" page="Preferences">
      <StackWidget props={{ gap: 'lg' }} bind={{ value: null }} on={on} context={ctx}>
        <CardWidget props={{ title: 'Profile' }} bind={{ value: null }} on={on} context={ctx}>
          <GridWidget
            props={{ columns: 2, gap: 'md' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          >
            <InputWidget
              props={{ label: 'Display Name' }}
              bind={{
                value: 'Irfan Maulana',
                meta: { type: 'string', label: 'Display Name', required: true, readOnly: false },
              }}
              on={on}
              context={ctx}
            />
            <InputWidget
              props={{ label: 'Email' }}
              bind={{
                value: 'irfan@acme.com',
                meta: { type: 'string', label: 'Email', required: true, readOnly: true },
              }}
              on={on}
              context={ctx}
            />
            <SelectWidget
              props={{
                label: 'Language',
                options: [
                  { value: 'en', label: 'English' },
                  { value: 'id', label: 'Bahasa Indonesia' },
                  { value: 'ja', label: 'Japanese' },
                ],
              }}
              bind={{
                value: 'en',
                meta: { type: 'enum', label: 'Language', required: false, readOnly: false },
              }}
              on={on}
              context={ctx}
            />
            <SelectWidget
              props={{
                label: 'Date Format',
                options: [
                  { value: 'mdy', label: 'MM/DD/YYYY' },
                  { value: 'dmy', label: 'DD/MM/YYYY' },
                  { value: 'ymd', label: 'YYYY-MM-DD' },
                ],
              }}
              bind={{
                value: 'ymd',
                meta: { type: 'enum', label: 'Date Format', required: false, readOnly: false },
              }}
              on={on}
              context={ctx}
            />
          </GridWidget>
        </CardWidget>

        <CardWidget props={{ title: 'Notifications' }} bind={{ value: null }} on={on} context={ctx}>
          <StackWidget props={{ gap: 'md' }} bind={{ value: null }} on={on} context={ctx}>
            <CheckboxWidget
              props={{ label: 'Email notifications for new orders' }}
              bind={{
                value: true,
                meta: { type: 'boolean', label: 'Order emails', required: false, readOnly: false },
              }}
              on={on}
              context={ctx}
            />
            <CheckboxWidget
              props={{ label: 'Email notifications for overdue invoices' }}
              bind={{
                value: true,
                meta: {
                  type: 'boolean',
                  label: 'Invoice emails',
                  required: false,
                  readOnly: false,
                },
              }}
              on={on}
              context={ctx}
            />
            <CheckboxWidget
              props={{ label: 'Push notifications for mentions' }}
              bind={{
                value: false,
                meta: { type: 'boolean', label: 'Push mentions', required: false, readOnly: false },
              }}
              on={on}
              context={ctx}
            />
            <CheckboxWidget
              props={{ label: 'Weekly summary email' }}
              bind={{
                value: true,
                meta: {
                  type: 'boolean',
                  label: 'Weekly summary',
                  required: false,
                  readOnly: false,
                },
              }}
              on={on}
              context={ctx}
            />
          </StackWidget>
        </CardWidget>

        <GroupWidget
          props={{ direction: 'row', gap: 'sm', justify: 'end' }}
          bind={{ value: null }}
          on={on}
          context={ctx}
        >
          <ButtonWidget
            props={{ label: 'Save Preferences', variant: 'primary', size: 'sm' }}
            bind={{ value: null }}
            on={on}
            context={ctx}
          />
        </GroupWidget>
      </StackWidget>
    </PageShell>
  ),
};
