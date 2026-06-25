import type { Meta, StoryObj } from '@storybook/react';
import { Toggle } from '../../src/primitives/toggle';

const meta: Meta<typeof Toggle> = {
  title: 'Primitives/Toggle',
  component: Toggle,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Default: Story = {
  args: {
    children: 'B',
  },
};

export const Outline: Story = {
  args: {
    children: 'B',
    variant: 'outline',
  },
};

export const Small: Story = {
  args: {
    children: 'B',
    size: 'sm',
  },
};

export const Pressed: Story = {
  args: {
    children: 'B',
    defaultPressed: true,
  },
};
