import type { Meta, StoryObj } from '@storybook/react';
import { ContextMenu } from '../../src/overlays/context-menu';

const meta: Meta = {
  title: 'Overlays/ContextMenu',
};

export default meta;

export const Default: StoryObj = {
  render: () => (
    <ContextMenu>
      <ContextMenu.Trigger>
        <div className="flex h-40 w-72 items-center justify-center rounded-md border border-dashed border-[var(--color-border)] text-sm text-[var(--color-muted-foreground)]">
          Right click here
        </div>
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item>Back</ContextMenu.Item>
        <ContextMenu.Item>Forward</ContextMenu.Item>
        <ContextMenu.Item>Reload</ContextMenu.Item>
        <ContextMenu.Separator />
        <ContextMenu.Item>View Source</ContextMenu.Item>
        <ContextMenu.Item>Inspect</ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu>
  ),
};

export const WithGroups: StoryObj = {
  render: () => (
    <ContextMenu>
      <ContextMenu.Trigger>
        <div className="flex h-40 w-72 items-center justify-center rounded-md border border-dashed border-[var(--color-border)] text-sm text-[var(--color-muted-foreground)]">
          Right click here
        </div>
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Group>
          <ContextMenu.Label>Edit</ContextMenu.Label>
          <ContextMenu.Item>Cut</ContextMenu.Item>
          <ContextMenu.Item>Copy</ContextMenu.Item>
          <ContextMenu.Item>Paste</ContextMenu.Item>
        </ContextMenu.Group>
        <ContextMenu.Separator />
        <ContextMenu.Group>
          <ContextMenu.Label>View</ContextMenu.Label>
          <ContextMenu.Item>Zoom In</ContextMenu.Item>
          <ContextMenu.Item>Zoom Out</ContextMenu.Item>
          <ContextMenu.Item disabled>Full Screen</ContextMenu.Item>
        </ContextMenu.Group>
      </ContextMenu.Content>
    </ContextMenu>
  ),
};
