import type { Meta, StoryObj } from '@storybook/react';
import { FieldWidget } from '../../src/widgets/field';
import type { WidgetComponentProps } from '../../src/widgets/types';
import { Card } from '../../src/layout/card';

const meta: Meta = {
  title: 'Widgets/Field',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

const defaultOn: WidgetComponentProps['on'] = { saveField: () => {} };
const defaultContext: WidgetComponentProps['context'] = { record: {}, model: 'test', mode: 'edit' };

function fieldBind(
  type: string,
  value: unknown,
  opts?: { label?: string; readOnly?: boolean; options?: unknown[] },
): WidgetComponentProps['bind'] {
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

export const StringField: Story = {
  name: 'String',
  render: () => (
    <Card>
      <Card.Content>
        <FieldWidget
          props={{}}
          bind={fieldBind('string', 'Acme Corporation', { label: 'Company Name' })}
          on={defaultOn}
          context={defaultContext}
        />
      </Card.Content>
    </Card>
  ),
};

export const StringEmpty: Story = {
  name: 'String (empty)',
  render: () => (
    <Card>
      <Card.Content>
        <FieldWidget
          props={{}}
          bind={fieldBind('string', null, { label: 'Company Name' })}
          on={defaultOn}
          context={defaultContext}
        />
      </Card.Content>
    </Card>
  ),
};

export const IntField: Story = {
  name: 'Integer',
  render: () => (
    <Card>
      <Card.Content>
        <FieldWidget
          props={{}}
          bind={fieldBind('int', 42500, { label: 'Quantity' })}
          on={defaultOn}
          context={defaultContext}
        />
      </Card.Content>
    </Card>
  ),
};

export const DecimalField: Story = {
  name: 'Decimal',
  render: () => (
    <Card>
      <Card.Content>
        <FieldWidget
          props={{}}
          bind={fieldBind('decimal', 99.95, { label: 'Weight (kg)' })}
          on={defaultOn}
          context={defaultContext}
        />
      </Card.Content>
    </Card>
  ),
};

export const MoneyField: Story = {
  name: 'Money',
  render: () => (
    <Card>
      <Card.Content>
        <FieldWidget
          props={{}}
          bind={fieldBind('money', 1250.0, { label: 'Total Amount' })}
          on={defaultOn}
          context={defaultContext}
        />
      </Card.Content>
    </Card>
  ),
};

export const TextField: Story = {
  name: 'Text (long)',
  render: () => (
    <Card>
      <Card.Content>
        <FieldWidget
          props={{}}
          bind={fieldBind('text', 'This is a longer text value that might wrap', {
            label: 'Description',
          })}
          on={defaultOn}
          context={defaultContext}
        />
      </Card.Content>
    </Card>
  ),
};

export const BooleanTrue: Story = {
  name: 'Boolean (true)',
  render: () => (
    <Card>
      <Card.Content>
        <FieldWidget
          props={{}}
          bind={fieldBind('boolean', true, { label: 'Active' })}
          on={defaultOn}
          context={defaultContext}
        />
      </Card.Content>
    </Card>
  ),
};

export const BooleanFalse: Story = {
  name: 'Boolean (false)',
  render: () => (
    <Card>
      <Card.Content>
        <FieldWidget
          props={{}}
          bind={fieldBind('boolean', false, { label: 'Verified' })}
          on={defaultOn}
          context={defaultContext}
        />
      </Card.Content>
    </Card>
  ),
};

export const EnumField: Story = {
  name: 'Enum',
  render: () => (
    <Card>
      <Card.Content>
        <FieldWidget
          props={{}}
          bind={fieldBind('enum', 'active', {
            label: 'Status',
            options: [
              { value: 'draft', label: 'Draft' },
              { value: 'active', label: 'Active' },
              { value: 'archived', label: 'Archived' },
            ],
          })}
          on={defaultOn}
          context={defaultContext}
        />
      </Card.Content>
    </Card>
  ),
};

export const EnumEmpty: Story = {
  name: 'Enum (empty)',
  render: () => (
    <Card>
      <Card.Content>
        <FieldWidget
          props={{}}
          bind={fieldBind('enum', null, {
            label: 'Priority',
            options: [
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ],
          })}
          on={defaultOn}
          context={defaultContext}
        />
      </Card.Content>
    </Card>
  ),
};

export const DateField: Story = {
  name: 'Date',
  render: () => (
    <Card>
      <Card.Content>
        <FieldWidget
          props={{}}
          bind={fieldBind('date', '2026-06-15', { label: 'Due Date' })}
          on={defaultOn}
          context={defaultContext}
        />
      </Card.Content>
    </Card>
  ),
};

export const DateEmpty: Story = {
  name: 'Date (empty)',
  render: () => (
    <Card>
      <Card.Content>
        <FieldWidget
          props={{}}
          bind={fieldBind('date', null, { label: 'Start Date' })}
          on={defaultOn}
          context={defaultContext}
        />
      </Card.Content>
    </Card>
  ),
};

export const DateTimeField: Story = {
  name: 'DateTime',
  render: () => (
    <Card>
      <Card.Content>
        <FieldWidget
          props={{}}
          bind={fieldBind('datetime', '2026-06-15T14:30:00.000Z', { label: 'Scheduled At' })}
          on={defaultOn}
          context={defaultContext}
        />
      </Card.Content>
    </Card>
  ),
};

export const LinkField: Story = {
  name: 'Link',
  render: () => (
    <Card>
      <Card.Content>
        <FieldWidget
          props={{}}
          bind={fieldBind('link', 'usr-001', {
            label: 'Assigned To',
            options: [
              { value: 'usr-001', label: 'Alice Johnson' },
              { value: 'usr-002', label: 'Bob Smith' },
              { value: 'usr-003', label: 'Carol Williams' },
              { value: 'usr-004', label: 'David Brown' },
            ],
          })}
          on={defaultOn}
          context={defaultContext}
        />
      </Card.Content>
    </Card>
  ),
};

export const LinkEmpty: Story = {
  name: 'Link (empty)',
  render: () => (
    <Card>
      <Card.Content>
        <FieldWidget
          props={{}}
          bind={fieldBind('link', null, {
            label: 'Customer',
            options: [
              { value: 'c-001', label: 'Acme Corp' },
              { value: 'c-002', label: 'Globex Inc' },
            ],
          })}
          on={defaultOn}
          context={defaultContext}
        />
      </Card.Content>
    </Card>
  ),
};

export const ReadOnly: Story = {
  name: 'Read Only (all types)',
  render: () => (
    <Card>
      <Card.Content>
        <FieldWidget
          props={{}}
          bind={fieldBind('string', 'ORD-2026-001', { label: 'Order ID', readOnly: true })}
          on={defaultOn}
          context={defaultContext}
        />
        <FieldWidget
          props={{}}
          bind={fieldBind('int', 150, { label: 'Line Items', readOnly: true })}
          on={defaultOn}
          context={defaultContext}
        />
        <FieldWidget
          props={{}}
          bind={fieldBind('money', 4500.0, { label: 'Grand Total', readOnly: true })}
          on={defaultOn}
          context={defaultContext}
        />
        <FieldWidget
          props={{}}
          bind={fieldBind('boolean', true, { label: 'Confirmed', readOnly: true })}
          on={defaultOn}
          context={defaultContext}
        />
        <FieldWidget
          props={{}}
          bind={fieldBind('enum', 'shipped', {
            label: 'Status',
            readOnly: true,
            options: [{ value: 'shipped', label: 'Shipped' }],
          })}
          on={defaultOn}
          context={defaultContext}
        />
        <FieldWidget
          props={{}}
          bind={fieldBind('date', '2026-07-01', { label: 'Ship Date', readOnly: true })}
          on={defaultOn}
          context={defaultContext}
        />
      </Card.Content>
    </Card>
  ),
};

export const RecordPage: Story = {
  name: 'Record Page (mixed types)',
  render: () => (
    <Card>
      <Card.Content>
        <FieldWidget
          props={{ label: 'Order Number' }}
          bind={fieldBind('string', 'ORD-2026-0042', { label: 'Order Number', readOnly: true })}
          on={defaultOn}
          context={defaultContext}
        />
        <FieldWidget
          props={{}}
          bind={fieldBind('link', 'c-001', {
            label: 'Customer',
            options: [
              { value: 'c-001', label: 'Acme Corp' },
              { value: 'c-002', label: 'Globex Inc' },
            ],
          })}
          on={defaultOn}
          context={defaultContext}
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
          on={defaultOn}
          context={defaultContext}
        />
        <FieldWidget
          props={{}}
          bind={fieldBind('date', '2026-06-28', { label: 'Order Date' })}
          on={defaultOn}
          context={defaultContext}
        />
        <FieldWidget
          props={{}}
          bind={fieldBind('datetime', '2026-07-05T09:00:00.000Z', { label: 'Expected Delivery' })}
          on={defaultOn}
          context={defaultContext}
        />
        <FieldWidget
          props={{}}
          bind={fieldBind('int', 12, { label: 'Line Items' })}
          on={defaultOn}
          context={defaultContext}
        />
        <FieldWidget
          props={{}}
          bind={fieldBind('money', 8750.5, { label: 'Total Amount' })}
          on={defaultOn}
          context={defaultContext}
        />
        <FieldWidget
          props={{}}
          bind={fieldBind('boolean', true, { label: 'Tax Inclusive' })}
          on={defaultOn}
          context={defaultContext}
        />
        <FieldWidget
          props={{}}
          bind={fieldBind('text', null, { label: 'Notes' })}
          on={defaultOn}
          context={defaultContext}
        />
      </Card.Content>
    </Card>
  ),
};
