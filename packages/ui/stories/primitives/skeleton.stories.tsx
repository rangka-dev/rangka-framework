import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from '../../src/primitives/skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Primitives/Skeleton',
  component: Skeleton,
};
export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = { args: { width: 200, height: 20 } };
export const Circle: Story = { args: { width: 40, height: 40, className: 'rounded-full' } };
export const FullWidth: Story = { args: { width: '100%', height: 16 } };
