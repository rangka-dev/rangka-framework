import type { Meta, StoryObj } from '@storybook/react';
import { Label } from '../../src/primitives/label';

const meta: Meta<typeof Label> = {
  title: 'Primitives/Label',
  component: Label,
};
export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = { args: { children: 'Email address' } };
export const Required: Story = { args: { children: 'Password', required: true } };
