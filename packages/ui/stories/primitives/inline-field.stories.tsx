import type { Meta, StoryObj } from '@storybook/react';
import { Type, Calendar, List, Link2, ToggleLeft } from 'lucide-react';
import { InlineField } from '../../src/primitives/inline-field';
import { Badge } from '../../src/primitives/badge';

const meta: Meta<typeof InlineField> = {
  title: 'Primitives/InlineField',
  component: InlineField,
};
export default meta;
type Story = StoryObj<typeof InlineField>;

export const Default: Story = {
  args: { label: 'Name', icon: Type },
  render: (args) => (
    <InlineField {...args}>
      <InlineField.Value>John Doe</InlineField.Value>
    </InlineField>
  ),
};

export const Empty: Story = {
  args: { label: 'Email', icon: Type },
  render: (args) => (
    <InlineField {...args}>
      <InlineField.Empty />
    </InlineField>
  ),
};

export const ReadOnly: Story = {
  args: { label: 'ID', icon: Type, readOnly: true },
  render: (args) => (
    <InlineField {...args}>
      <InlineField.Value readOnly>ORD-001</InlineField.Value>
    </InlineField>
  ),
};

export const Editing: Story = {
  args: { label: 'Name', icon: Type, editing: true },
  render: (args) => (
    <InlineField {...args}>
      <input
        className="h-6 text-[13px] border-0 bg-transparent p-0 outline-none w-full"
        defaultValue="John Doe"
      />
    </InlineField>
  ),
};

export const Saving: Story = {
  args: { label: 'Amount', icon: Type },
  render: (args) => (
    <InlineField {...args}>
      <InlineField.Value saving>$1,200.00</InlineField.Value>
    </InlineField>
  ),
};

export const WithBadge: Story = {
  args: { label: 'Status', icon: List },
  render: (args) => (
    <InlineField {...args}>
      <InlineField.Value>
        <Badge variant="secondary" className="text-[11px]">
          Active
        </Badge>
      </InlineField.Value>
    </InlineField>
  ),
};

export const FieldList: Story = {
  render: () => (
    <div className="w-[400px] border border-border rounded-lg p-2 space-y-0.5">
      <InlineField label="Name" icon={Type}>
        <InlineField.Value>Acme Corp</InlineField.Value>
      </InlineField>
      <InlineField label="Status" icon={List}>
        <InlineField.Value>
          <Badge variant="secondary" className="text-[11px]">
            Active
          </Badge>
        </InlineField.Value>
      </InlineField>
      <InlineField label="Created" icon={Calendar}>
        <InlineField.Value>Jun 15, 2026</InlineField.Value>
      </InlineField>
      <InlineField label="Website" icon={Link2}>
        <InlineField.Value>
          <span className="text-primary">acme.com</span>
        </InlineField.Value>
      </InlineField>
      <InlineField label="Active" icon={ToggleLeft}>
        <div className="size-4 rounded-sm border bg-primary border-primary" />
      </InlineField>
      <InlineField label="Notes" icon={Type}>
        <InlineField.Empty />
      </InlineField>
    </div>
  ),
};
