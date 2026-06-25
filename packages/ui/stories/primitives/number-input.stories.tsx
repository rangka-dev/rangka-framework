import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { NumberInput } from '../../src/primitives/number-input';

const meta: Meta = {
  title: 'Primitives/NumberInput',
};

export default meta;

export const Default: StoryObj = {
  render: () => {
    const [value, setValue] = useState<number | null>(0);
    return (
      <NumberInput value={value} onValueChange={setValue} min={0} max={100}>
        <NumberInput.Decrement>-</NumberInput.Decrement>
        <NumberInput.Input />
        <NumberInput.Increment>+</NumberInput.Increment>
      </NumberInput>
    );
  },
};

export const WithStep: StoryObj = {
  render: () => {
    const [value, setValue] = useState<number | null>(0);
    return (
      <NumberInput value={value} onValueChange={setValue} step={5} min={0} max={50}>
        <NumberInput.Decrement>-</NumberInput.Decrement>
        <NumberInput.Input />
        <NumberInput.Increment>+</NumberInput.Increment>
      </NumberInput>
    );
  },
};
