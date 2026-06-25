import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Select } from '../../src/primitives/select';

const meta: Meta = {
  title: 'Primitives/Select',
};

export default meta;

export const Default: StoryObj = {
  render: () => {
    const [value, setValue] = useState<string | null>(null);
    return (
      <Select value={value ?? undefined} onValueChange={setValue}>
        <Select.Trigger>
          <Select.Value placeholder="Choose a fruit..." />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="apple">Apple</Select.Item>
          <Select.Item value="banana">Banana</Select.Item>
          <Select.Item value="cherry">Cherry</Select.Item>
        </Select.Content>
      </Select>
    );
  },
};

export const WithGroups: StoryObj = {
  render: () => {
    const [value, setValue] = useState<string | null>(null);
    return (
      <Select value={value ?? undefined} onValueChange={setValue}>
        <Select.Trigger>
          <Select.Value placeholder="Choose a status..." />
        </Select.Trigger>
        <Select.Content>
          <Select.Group label="Active">
            <Select.Item value="open">Open</Select.Item>
            <Select.Item value="in-progress">In Progress</Select.Item>
          </Select.Group>
          <Select.Group label="Closed">
            <Select.Item value="done">Done</Select.Item>
            <Select.Item value="cancelled">Cancelled</Select.Item>
          </Select.Group>
        </Select.Content>
      </Select>
    );
  },
};
