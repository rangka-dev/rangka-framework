import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MoneyInput } from '../../src/form/money-input';

const meta: Meta<typeof MoneyInput> = {
  title: 'Form/MoneyInput',
  component: MoneyInput,
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof MoneyInput>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<number | null>(null);
    return <MoneyInput value={value} onChange={setValue} placeholder="0.00" />;
  },
};

export const WithValue: Story = {
  render: () => {
    const [value, setValue] = useState<number | null>(1250.99);
    return <MoneyInput value={value} onChange={setValue} />;
  },
};

export const Euro: Story = {
  render: () => {
    const [value, setValue] = useState<number | null>(500);
    return <MoneyInput value={value} onChange={setValue} currency="€" />;
  },
};

export const Small: Story = {
  render: () => {
    const [value, setValue] = useState<number | null>(25);
    return <MoneyInput value={value} onChange={setValue} size="sm" />;
  },
};

export const Large: Story = {
  render: () => {
    const [value, setValue] = useState<number | null>(10000);
    return <MoneyInput value={value} onChange={setValue} size="lg" />;
  },
};

export const Disabled: Story = {
  render: () => <MoneyInput value={99.99} disabled />,
};
