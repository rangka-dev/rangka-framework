import type { Meta, StoryObj } from '@storybook/react';
import { Divider } from '../../src/layout/divider';

const meta: Meta = {
  title: 'Layout/Divider',
};

export default meta;

export const Horizontal: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-2">
      <p>Content above</p>
      <Divider />
      <p>Content below</p>
    </div>
  ),
};

export const Vertical: StoryObj = {
  render: () => (
    <div className="flex items-center gap-2 h-10">
      <span>Left</span>
      <Divider orientation="vertical" margin="sm" />
      <span>Right</span>
    </div>
  ),
};

export const Margins: StoryObj = {
  render: () => (
    <div className="flex flex-col">
      <p>Small margin</p>
      <Divider margin="sm" />
      <p>Medium margin</p>
      <Divider margin="md" />
      <p>Large margin</p>
      <Divider margin="lg" />
      <p>XL margin</p>
      <Divider margin="xl" />
      <p>End</p>
    </div>
  ),
};
