import type { Meta, StoryObj } from '@storybook/react';
import { Collapsible } from '../../src/layout/collapsible';

const meta: Meta = {
  title: 'Layout/Collapsible',
};

export default meta;

export const Default: StoryObj = {
  render: () => (
    <Collapsible>
      <Collapsible.Trigger>Toggle content</Collapsible.Trigger>
      <Collapsible.Content>
        <p>This content can be shown or hidden.</p>
      </Collapsible.Content>
    </Collapsible>
  ),
};

export const DefaultOpen: StoryObj = {
  render: () => (
    <Collapsible defaultOpen>
      <Collapsible.Trigger>Toggle content</Collapsible.Trigger>
      <Collapsible.Content>
        <p>This content starts visible.</p>
      </Collapsible.Content>
    </Collapsible>
  ),
};
