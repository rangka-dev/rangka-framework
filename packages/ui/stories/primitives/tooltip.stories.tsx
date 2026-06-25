import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from '../../src/primitives/tooltip';

const meta: Meta = {
  title: 'Primitives/Tooltip',
};

export default meta;

export const SimpleContent: StoryObj = {
  render: () => (
    <Tooltip content="This is a tooltip">
      <Tooltip.Trigger>Hover me</Tooltip.Trigger>
    </Tooltip>
  ),
};

export const CustomContent: StoryObj = {
  render: () => (
    <Tooltip>
      <Tooltip.Trigger>Hover for details</Tooltip.Trigger>
      <Tooltip.Content>
        <strong>Custom tooltip</strong>
        <p>With rich content inside</p>
        <Tooltip.Arrow />
      </Tooltip.Content>
    </Tooltip>
  ),
};
