import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DateTimePicker } from '../../src/form/date-time-picker';

const meta: Meta<typeof DateTimePicker> = {
  title: 'Form/DateTimePicker',
  component: DateTimePicker,
};

export default meta;
type Story = StoryObj<typeof DateTimePicker>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>(null);
    return <DateTimePicker value={value} onChange={setValue} />;
  },
};

export const WithValue: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>('2026-06-15T14:30:00.000Z');
    return <DateTimePicker value={value} onChange={setValue} />;
  },
};

export const CustomPlaceholder: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>(null);
    return (
      <DateTimePicker value={value} onChange={setValue} placeholder="Schedule date and time" />
    );
  },
};

export const Disabled: Story = {
  render: () => <DateTimePicker value="2026-06-15T09:00:00.000Z" disabled />,
};
