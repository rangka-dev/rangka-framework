import type { Meta, StoryObj } from '@storybook/react';
import { CircleIcon, SearchIcon, SettingsIcon } from 'lucide-react';
import { Icon } from '../../src/primitives/icon';

const meta: Meta<typeof Icon> = {
  title: 'Primitives/Icon',
  component: Icon,
};
export default meta;
type Story = StoryObj<typeof Icon>;

export const Default: Story = { args: { icon: CircleIcon } };
export const Small: Story = { args: { icon: SearchIcon, size: 'sm' } };
export const Large: Story = { args: { icon: SettingsIcon, size: 'lg' } };
