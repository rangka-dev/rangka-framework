import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from '../../src/primitives/progress';

const meta: Meta<typeof Progress> = {
  title: 'Primitives/Progress',
  component: Progress,
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  args: {
    value: 60,
    max: 100,
  },
  render: (args) => (
    <Progress value={args.value} max={args.max} style={{ width: 300 }}>
      <Progress.Track>
        <Progress.Indicator />
      </Progress.Track>
    </Progress>
  ),
};

export const Indeterminate: Story = {
  render: () => (
    <Progress value={null} style={{ width: 300 }}>
      <Progress.Track>
        <Progress.Indicator />
      </Progress.Track>
    </Progress>
  ),
};

export const Complete: Story = {
  render: () => (
    <Progress value={100} style={{ width: 300 }}>
      <Progress.Track>
        <Progress.Indicator />
      </Progress.Track>
    </Progress>
  ),
};
