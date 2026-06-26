import type { Meta, StoryObj } from '@storybook/react';
import {
  InputWidget,
  SelectWidget,
  CheckboxWidget,
  TextareaWidget,
  DatePickerWidget,
  DateTimeWidget,
  MoneyWidget,
  CodeWidget,
  JsonWidget,
  LinkWidget,
  TreeWidget,
  ManyToManyWidget,
  AttachmentWidget,
  AttachmentsWidget,
} from '../../src/widgets/input';
import type { WidgetComponentProps } from '../../src/widgets/types';
import { Stack } from '../../src/layout/stack';
import { Grid } from '../../src/layout/grid';
import { Card } from '../../src/layout/card';

const meta: Meta = {
  title: 'Widgets/Input',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

const defaultBind = (value: unknown = '') => ({
  value,
  setValue: () => {},
  meta: { type: 'string' as const, label: '', required: false, readOnly: false },
});

const defaultOn = {};
const defaultContext = { record: {}, model: 'test', mode: 'edit' as const };

function WidgetShowcase({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <Card.Content className="pt-4">
        <Stack gap="lg">{children}</Stack>
      </Card.Content>
    </Card>
  );
}

export const TextInput: Story = {
  name: 'Text Input',
  render: () => (
    <WidgetShowcase>
      <InputWidget
        props={{ label: 'Full Name', placeholder: 'Enter name...' }}
        bind={{
          ...defaultBind(),
          meta: { type: 'string', label: 'Full Name', required: true, readOnly: false },
        }}
        on={defaultOn}
        context={defaultContext}
      />
      <InputWidget
        props={{ label: 'Email', placeholder: 'user@example.com' }}
        bind={{
          ...defaultBind('john@acme.com'),
          meta: { type: 'string', label: 'Email', required: true, readOnly: false },
        }}
        on={defaultOn}
        context={defaultContext}
      />
      <InputWidget
        props={{ label: 'Notes (read-only)' }}
        bind={{
          ...defaultBind('Cannot edit this'),
          meta: { type: 'string', label: 'Notes', required: false, readOnly: true },
        }}
        on={defaultOn}
        context={defaultContext}
      />
    </WidgetShowcase>
  ),
};

export const NumberInput: Story = {
  name: 'Number Input',
  render: () => (
    <WidgetShowcase>
      <InputWidget
        props={{ label: 'Quantity', placeholder: '0' }}
        bind={{
          ...defaultBind(42),
          meta: { type: 'int', label: 'Quantity', required: true, readOnly: false },
        }}
        on={defaultOn}
        context={defaultContext}
      />
      <InputWidget
        props={{ label: 'Price', placeholder: '0.00' }}
        bind={{
          ...defaultBind(99.5),
          meta: { type: 'decimal', label: 'Price', required: false, readOnly: false },
        }}
        on={defaultOn}
        context={defaultContext}
      />
    </WidgetShowcase>
  ),
};

export const SelectInput: Story = {
  name: 'Select',
  render: () => (
    <WidgetShowcase>
      <SelectWidget
        props={{
          label: 'Status',
          options: [
            { value: 'draft', label: 'Draft' },
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'shipped', label: 'Shipped' },
            { value: 'delivered', label: 'Delivered' },
          ],
        }}
        bind={{
          ...defaultBind('confirmed'),
          meta: { type: 'enum', label: 'Status', required: true, readOnly: false },
        }}
        on={defaultOn}
        context={defaultContext}
      />
    </WidgetShowcase>
  ),
};

export const CheckboxInput: Story = {
  name: 'Checkbox',
  render: () => (
    <WidgetShowcase>
      <CheckboxWidget
        props={{ label: 'Auto-invoice on delivery' }}
        bind={{
          ...defaultBind(false),
          meta: { type: 'boolean', label: 'Auto-invoice', required: false, readOnly: false },
        }}
        on={defaultOn}
        context={defaultContext}
      />
      <CheckboxWidget
        props={{ label: 'Send notification' }}
        bind={{
          ...defaultBind(true),
          meta: { type: 'boolean', label: 'Send notification', required: false, readOnly: false },
        }}
        on={defaultOn}
        context={defaultContext}
      />
    </WidgetShowcase>
  ),
};

export const TextareaInput: Story = {
  name: 'Textarea',
  render: () => (
    <WidgetShowcase>
      <TextareaWidget
        props={{ label: 'Description', placeholder: 'Enter description...', rows: 4 }}
        bind={{
          ...defaultBind(''),
          meta: { type: 'text', label: 'Description', required: false, readOnly: false },
        }}
        on={defaultOn}
        context={defaultContext}
      />
    </WidgetShowcase>
  ),
};

export const DateInputs: Story = {
  name: 'Date & DateTime',
  render: () => (
    <WidgetShowcase>
      <DatePickerWidget
        props={{ label: 'Order Date' }}
        bind={{
          ...defaultBind(null),
          meta: { type: 'date', label: 'Order Date', required: true, readOnly: false },
        }}
        on={defaultOn}
        context={defaultContext}
      />
      <DateTimeWidget
        props={{ label: 'Scheduled At' }}
        bind={{
          ...defaultBind(null),
          meta: { type: 'datetime', label: 'Scheduled At', required: false, readOnly: false },
        }}
        on={defaultOn}
        context={defaultContext}
      />
    </WidgetShowcase>
  ),
};

export const MoneyInput: Story = {
  name: 'Money',
  render: () => (
    <WidgetShowcase>
      <MoneyWidget
        props={{ label: 'Total Amount', currency: '$' }}
        bind={{
          ...defaultBind(4250.0),
          meta: { type: 'money', label: 'Total Amount', required: true, readOnly: false },
        }}
        on={defaultOn}
        context={defaultContext}
      />
      <MoneyWidget
        props={{ label: 'Tax (EUR)', currency: '€' }}
        bind={{
          ...defaultBind(325.5),
          meta: { type: 'money', label: 'Tax', required: false, readOnly: false },
        }}
        on={defaultOn}
        context={defaultContext}
      />
    </WidgetShowcase>
  ),
};

export const CodeInput: Story = {
  name: 'Code',
  render: () => (
    <WidgetShowcase>
      <CodeWidget
        props={{ label: 'Custom Script', rows: 6 }}
        bind={{
          ...defaultBind('function hello() {\n  return "world";\n}'),
          meta: { type: 'string', label: 'Script', required: false, readOnly: false },
        }}
        on={defaultOn}
        context={defaultContext}
      />
    </WidgetShowcase>
  ),
};

export const JsonInput: Story = {
  name: 'JSON',
  render: () => (
    <WidgetShowcase>
      <JsonWidget
        props={{ label: 'Configuration', rows: 6 }}
        bind={{
          ...defaultBind({ theme: 'dark', locale: 'en', features: ['search', 'export'] }),
          meta: { type: 'json', label: 'Configuration', required: false, readOnly: false },
        }}
        on={defaultOn}
        context={defaultContext}
      />
    </WidgetShowcase>
  ),
};

export const LinkInput: Story = {
  name: 'Link (Foreign Key)',
  render: () => (
    <WidgetShowcase>
      <LinkWidget
        props={{
          label: 'Customer',
          options: [
            { value: '1', label: 'Acme Corp' },
            { value: '2', label: 'Globex Inc' },
            { value: '3', label: 'Wayne Enterprises' },
            { value: '4', label: 'Stark Industries' },
          ],
        }}
        bind={{
          ...defaultBind('1'),
          meta: { type: 'link', label: 'Customer', required: true, readOnly: false },
        }}
        on={defaultOn}
        context={defaultContext}
      />
    </WidgetShowcase>
  ),
};

export const TreeInput: Story = {
  name: 'Tree (Hierarchical)',
  render: () => (
    <WidgetShowcase>
      <TreeWidget
        props={{
          label: 'Category',
          options: [
            { value: '1', label: 'Electronics', path: '' },
            { value: '2', label: 'Laptops', path: 'Electronics' },
            { value: '3', label: 'Gaming Laptops', path: 'Electronics/Laptops' },
            { value: '4', label: 'Phones', path: 'Electronics' },
            { value: '5', label: 'Clothing', path: '' },
            { value: '6', label: 'Shirts', path: 'Clothing' },
          ],
        }}
        bind={{
          ...defaultBind('3'),
          meta: { type: 'link', label: 'Category', required: true, readOnly: false },
        }}
        on={defaultOn}
        context={defaultContext}
      />
    </WidgetShowcase>
  ),
};

export const ManyToManyInput: Story = {
  name: 'Many-to-Many',
  render: () => (
    <WidgetShowcase>
      <ManyToManyWidget
        props={{
          label: 'Tags',
          options: [
            { value: 'urgent', label: 'Urgent' },
            { value: 'vip', label: 'VIP' },
            { value: 'wholesale', label: 'Wholesale' },
            { value: 'recurring', label: 'Recurring' },
            { value: 'international', label: 'International' },
          ],
        }}
        bind={{
          ...defaultBind(['urgent', 'vip']),
          meta: { type: 'many-to-many', label: 'Tags', required: false, readOnly: false },
        }}
        on={defaultOn}
        context={defaultContext}
      />
    </WidgetShowcase>
  ),
};

export const FileUploads: Story = {
  name: 'Attachment & Attachments',
  render: () => (
    <WidgetShowcase>
      <AttachmentWidget
        props={{ label: 'Invoice PDF' }}
        bind={{
          ...defaultBind(null),
          meta: { type: 'attachment', label: 'Invoice PDF', required: false, readOnly: false },
        }}
        on={defaultOn}
        context={defaultContext}
      />
      <AttachmentWidget
        props={{ label: 'Contract (uploaded)' }}
        bind={{
          ...defaultBind({ name: 'contract-2026.pdf', size: 245000 }),
          meta: { type: 'attachment', label: 'Contract', required: false, readOnly: false },
        }}
        on={defaultOn}
        context={defaultContext}
      />
      <AttachmentsWidget
        props={{ label: 'Supporting Documents', maxCount: 5 }}
        bind={{
          ...defaultBind([
            { name: 'receipt.pdf', size: 120000 },
            { name: 'photo.jpg', size: 3200000 },
          ]),
          meta: {
            type: 'attachments',
            label: 'Supporting Documents',
            required: false,
            readOnly: false,
          },
        }}
        on={defaultOn}
        context={defaultContext}
      />
    </WidgetShowcase>
  ),
};

export const WithValidationErrors: Story = {
  name: 'With Validation Errors',
  render: () => (
    <WidgetShowcase>
      <InputWidget
        props={{ label: 'Customer Name', placeholder: 'Required field' }}
        bind={{
          value: '',
          setValue: () => {},
          meta: { type: 'string', label: 'Customer Name', required: true, readOnly: false },
          error: 'This field is required',
        }}
        on={defaultOn}
        context={defaultContext}
      />
      <SelectWidget
        props={{
          label: 'Status',
          options: [
            { value: 'draft', label: 'Draft' },
            { value: 'confirmed', label: 'Confirmed' },
          ],
        }}
        bind={{
          value: undefined,
          setValue: () => {},
          meta: { type: 'enum', label: 'Status', required: true, readOnly: false },
          error: 'Please select a status',
        }}
        on={defaultOn}
        context={defaultContext}
      />
      <MoneyWidget
        props={{ label: 'Amount', currency: '$' }}
        bind={{
          value: -5,
          setValue: () => {},
          meta: { type: 'money', label: 'Amount', required: true, readOnly: false },
          error: 'Amount must be positive',
        }}
        on={defaultOn}
        context={defaultContext}
      />
    </WidgetShowcase>
  ),
};

export const AllInputTypes: Story = {
  name: 'All Input Types (Gallery)',
  render: () => (
    <Grid columns={2} gap="md">
      <Card>
        <Card.Header>
          <Card.Title>Text Fields</Card.Title>
        </Card.Header>
        <Card.Content>
          <Stack gap="md">
            <InputWidget
              props={{ label: 'Name', placeholder: 'Enter name...' }}
              bind={{
                ...defaultBind(''),
                meta: { type: 'string', label: 'Name', required: true, readOnly: false },
              }}
              on={defaultOn}
              context={defaultContext}
            />
            <TextareaWidget
              props={{ label: 'Notes', rows: 3 }}
              bind={{
                ...defaultBind(''),
                meta: { type: 'text', label: 'Notes', required: false, readOnly: false },
              }}
              on={defaultOn}
              context={defaultContext}
            />
          </Stack>
        </Card.Content>
      </Card>
      <Card>
        <Card.Header>
          <Card.Title>Numbers & Money</Card.Title>
        </Card.Header>
        <Card.Content>
          <Stack gap="md">
            <InputWidget
              props={{ label: 'Quantity' }}
              bind={{
                ...defaultBind(10),
                meta: { type: 'int', label: 'Quantity', required: false, readOnly: false },
              }}
              on={defaultOn}
              context={defaultContext}
            />
            <MoneyWidget
              props={{ label: 'Price', currency: '$' }}
              bind={{
                ...defaultBind(99.99),
                meta: { type: 'money', label: 'Price', required: false, readOnly: false },
              }}
              on={defaultOn}
              context={defaultContext}
            />
          </Stack>
        </Card.Content>
      </Card>
      <Card>
        <Card.Header>
          <Card.Title>Selection</Card.Title>
        </Card.Header>
        <Card.Content>
          <Stack gap="md">
            <SelectWidget
              props={{
                label: 'Priority',
                options: [
                  { value: 'low', label: 'Low' },
                  { value: 'med', label: 'Medium' },
                  { value: 'high', label: 'High' },
                ],
              }}
              bind={{
                ...defaultBind('med'),
                meta: { type: 'enum', label: 'Priority', required: false, readOnly: false },
              }}
              on={defaultOn}
              context={defaultContext}
            />
            <CheckboxWidget
              props={{ label: 'Mark as urgent' }}
              bind={{
                ...defaultBind(false),
                meta: { type: 'boolean', label: 'Urgent', required: false, readOnly: false },
              }}
              on={defaultOn}
              context={defaultContext}
            />
          </Stack>
        </Card.Content>
      </Card>
      <Card>
        <Card.Header>
          <Card.Title>Dates</Card.Title>
        </Card.Header>
        <Card.Content>
          <Stack gap="md">
            <DatePickerWidget
              props={{ label: 'Due Date' }}
              bind={{
                ...defaultBind(null),
                meta: { type: 'date', label: 'Due Date', required: false, readOnly: false },
              }}
              on={defaultOn}
              context={defaultContext}
            />
            <DateTimeWidget
              props={{ label: 'Reminder' }}
              bind={{
                ...defaultBind(null),
                meta: { type: 'datetime', label: 'Reminder', required: false, readOnly: false },
              }}
              on={defaultOn}
              context={defaultContext}
            />
          </Stack>
        </Card.Content>
      </Card>
    </Grid>
  ),
};
