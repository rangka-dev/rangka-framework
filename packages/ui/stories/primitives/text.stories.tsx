import type { Meta, StoryObj } from '@storybook/react';
import { Text } from '../../src/primitives/text';

const meta: Meta<typeof Text> = {
  title: 'Primitives/Text',
  component: Text,
};

export default meta;
type Story = StoryObj<typeof Text>;

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Text variant="heading">Heading text</Text>
      <Text variant="body">Body text (default)</Text>
      <Text variant="bold">Bold text</Text>
      <Text variant="caption">Caption text</Text>
      <Text variant="muted">Muted text</Text>
      <Text variant="mono">Monospace text</Text>
    </div>
  ),
};

export const Alignment: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      <Text align="left">Left aligned</Text>
      <Text align="center">Center aligned</Text>
      <Text align="right">Right aligned</Text>
    </div>
  ),
};
