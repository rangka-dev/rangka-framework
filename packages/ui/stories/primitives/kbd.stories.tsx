import type { Meta, StoryObj } from '@storybook/react';
import { Kbd } from '../../src/primitives/kbd';

const meta: Meta<typeof Kbd> = {
  title: 'Primitives/Kbd',
  component: Kbd,
};
export default meta;
type Story = StoryObj<typeof Kbd>;

export const Default: Story = { args: { children: 'Ctrl' } };
export const Combination: Story = {
  render: () => (
    <span className="inline-flex items-center gap-1">
      <Kbd>Ctrl</Kbd>+<Kbd>K</Kbd>
    </span>
  ),
};
