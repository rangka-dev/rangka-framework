import type { Meta, StoryObj } from '@storybook/react';
import { DropdownMenu } from '../../src/overlays/dropdown-menu';

const meta: Meta = {
  title: 'Overlays/DropdownMenu',
};

export default meta;

export const Basic: StoryObj = {
  render: () => (
    <DropdownMenu>
      <DropdownMenu.Trigger>Actions</DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Label>Actions</DropdownMenu.Label>
        <DropdownMenu.Group>
          <DropdownMenu.Item>Edit</DropdownMenu.Item>
          <DropdownMenu.Item>Duplicate</DropdownMenu.Item>
        </DropdownMenu.Group>
        <DropdownMenu.Separator />
        <DropdownMenu.Item>Delete</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  ),
};
