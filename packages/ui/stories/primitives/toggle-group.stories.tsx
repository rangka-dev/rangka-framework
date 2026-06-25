import type { Meta, StoryObj } from '@storybook/react';
import { ToggleGroup } from '../../src/primitives/toggle-group';

const meta: Meta = {
  title: 'Primitives/ToggleGroup',
  component: ToggleGroup,
};

export default meta;

export const Single: StoryObj = {
  render: () => (
    <ToggleGroup defaultValue={['center']}>
      <ToggleGroup.Item value="left">Left</ToggleGroup.Item>
      <ToggleGroup.Item value="center">Center</ToggleGroup.Item>
      <ToggleGroup.Item value="right">Right</ToggleGroup.Item>
    </ToggleGroup>
  ),
};

export const Multiple: StoryObj = {
  render: () => (
    <ToggleGroup multiple defaultValue={['bold', 'italic']}>
      <ToggleGroup.Item value="bold">B</ToggleGroup.Item>
      <ToggleGroup.Item value="italic">I</ToggleGroup.Item>
      <ToggleGroup.Item value="underline">U</ToggleGroup.Item>
    </ToggleGroup>
  ),
};

export const Disabled: StoryObj = {
  render: () => (
    <ToggleGroup disabled defaultValue={['center']}>
      <ToggleGroup.Item value="left">Left</ToggleGroup.Item>
      <ToggleGroup.Item value="center">Center</ToggleGroup.Item>
      <ToggleGroup.Item value="right">Right</ToggleGroup.Item>
    </ToggleGroup>
  ),
};
