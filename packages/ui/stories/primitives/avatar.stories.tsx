import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from '../../src/primitives/avatar';

const meta: Meta = {
  title: 'Primitives/Avatar',
  component: Avatar,
};

export default meta;

export const WithImage: StoryObj = {
  render: () => (
    <Avatar>
      <Avatar.Image src="https://github.com/shadcn.png" alt="User" />
      <Avatar.Fallback>CN</Avatar.Fallback>
    </Avatar>
  ),
};

export const WithFallback: StoryObj = {
  render: () => (
    <Avatar>
      <Avatar.Fallback>JD</Avatar.Fallback>
    </Avatar>
  ),
};

export const Sizes: StoryObj = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar size="sm">
        <Avatar.Fallback>SM</Avatar.Fallback>
      </Avatar>
      <Avatar size="md">
        <Avatar.Fallback>MD</Avatar.Fallback>
      </Avatar>
      <Avatar size="lg">
        <Avatar.Fallback>LG</Avatar.Fallback>
      </Avatar>
    </div>
  ),
};
