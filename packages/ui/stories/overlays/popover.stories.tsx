import type { Meta, StoryObj } from '@storybook/react';
import { Popover } from '../../src/overlays/popover';
import { Button } from '../../src/primitives/button';

const meta: Meta = {
  title: 'Overlays/Popover',
};

export default meta;

export const Default: StoryObj = {
  render: () => (
    <Popover>
      <Popover.Trigger asChild>
        <Button variant="outline">Open Popover</Button>
      </Popover.Trigger>
      <Popover.Content>
        <Popover.Title>Dimensions</Popover.Title>
        <Popover.Description>Set the dimensions for the layer.</Popover.Description>
        <div className="mt-3 grid gap-2">
          <div className="grid grid-cols-3 items-center gap-4">
            <label className="text-sm">Width</label>
            <input
              className="col-span-2 h-8 rounded border border-[var(--color-border)] bg-transparent px-2 text-sm"
              defaultValue="100%"
            />
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <label className="text-sm">Height</label>
            <input
              className="col-span-2 h-8 rounded border border-[var(--color-border)] bg-transparent px-2 text-sm"
              defaultValue="25px"
            />
          </div>
        </div>
      </Popover.Content>
    </Popover>
  ),
};

export const WithArrow: StoryObj = {
  render: () => (
    <Popover>
      <Popover.Trigger asChild>
        <Button variant="outline">With Arrow</Button>
      </Popover.Trigger>
      <Popover.Content>
        <Popover.Arrow />
        <Popover.Title>Info</Popover.Title>
        <Popover.Description>
          This popover has an arrow pointing to the trigger.
        </Popover.Description>
      </Popover.Content>
    </Popover>
  ),
};

export const Placement: StoryObj = {
  render: () => (
    <div className="flex items-center gap-4 p-20">
      <Popover>
        <Popover.Trigger asChild>
          <Button variant="outline">Top</Button>
        </Popover.Trigger>
        <Popover.Content side="top">
          <Popover.Description>Placed on top.</Popover.Description>
        </Popover.Content>
      </Popover>
      <Popover>
        <Popover.Trigger asChild>
          <Button variant="outline">Right</Button>
        </Popover.Trigger>
        <Popover.Content side="right">
          <Popover.Description>Placed on right.</Popover.Description>
        </Popover.Content>
      </Popover>
      <Popover>
        <Popover.Trigger asChild>
          <Button variant="outline">Left</Button>
        </Popover.Trigger>
        <Popover.Content side="left">
          <Popover.Description>Placed on left.</Popover.Description>
        </Popover.Content>
      </Popover>
    </div>
  ),
};
