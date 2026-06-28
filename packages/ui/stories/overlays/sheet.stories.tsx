import type { Meta, StoryObj } from '@storybook/react';
import { Sheet } from '../../src/overlays/sheet';

const meta: Meta = {
  title: 'Overlays/Sheet',
};

export default meta;

export const RightSide: StoryObj = {
  render: () => (
    <Sheet>
      <Sheet.Trigger>Open Sheet</Sheet.Trigger>
      <Sheet.Content side="right">
        <Sheet.Header>
          <Sheet.Title>Sheet Title</Sheet.Title>
          <Sheet.Description>This is a side panel.</Sheet.Description>
        </Sheet.Header>
        <p>Sheet content goes here.</p>
        <Sheet.Close>Close</Sheet.Close>
      </Sheet.Content>
    </Sheet>
  ),
};

export const LeftSide: StoryObj = {
  render: () => (
    <Sheet>
      <Sheet.Trigger>Open Left Sheet</Sheet.Trigger>
      <Sheet.Content side="left">
        <Sheet.Header>
          <Sheet.Title>Navigation</Sheet.Title>
        </Sheet.Header>
        <p>Sidebar navigation content.</p>
      </Sheet.Content>
    </Sheet>
  ),
};
