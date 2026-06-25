import type { Meta, StoryObj } from '@storybook/react';
import { Tabs } from '../../src/layout/tabs';

const meta: Meta = {
  title: 'Layout/Tabs',
};

export default meta;

export const Default: StoryObj = {
  render: () => (
    <Tabs defaultValue="tab1">
      <Tabs.List>
        <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
        <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
        <Tabs.Trigger value="tab3">Tab 3</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="tab1">Content for tab 1</Tabs.Content>
      <Tabs.Content value="tab2">Content for tab 2</Tabs.Content>
      <Tabs.Content value="tab3">Content for tab 3</Tabs.Content>
    </Tabs>
  ),
};
