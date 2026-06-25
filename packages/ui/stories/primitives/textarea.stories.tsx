import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from '../../src/primitives/textarea';

const meta: Meta<typeof Textarea> = {
  title: 'Primitives/Textarea',
  component: Textarea,
};
export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = { args: { placeholder: 'Type something...' } };
export const Disabled: Story = { args: { placeholder: 'Disabled', disabled: true } };
export const WithError: Story = { args: { placeholder: 'Invalid input', 'aria-invalid': true } };
