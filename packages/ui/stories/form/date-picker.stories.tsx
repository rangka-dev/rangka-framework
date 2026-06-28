import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DatePicker } from '../../src/form/date-picker';

const meta: Meta<typeof DatePicker> = {
  title: 'Form/DatePicker',
  component: DatePicker,
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>(null);
    return <DatePicker value={value} onChange={setValue} />;
  },
};

export const WithValue: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>('2026-06-15');
    return <DatePicker value={value} onChange={setValue} />;
  },
};

export const CustomPlaceholder: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>(null);
    return <DatePicker value={value} onChange={setValue} placeholder="Select start date" />;
  },
};

export const Disabled: Story = {
  render: () => <DatePicker value="2026-06-15" disabled />,
};
