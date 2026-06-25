import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Combobox } from '../../src/primitives/combobox';

const meta: Meta = {
  title: 'Primitives/Combobox',
};

export default meta;

export const Default: StoryObj = {
  render: () => {
    const [value, setValue] = useState<string | null>(null);
    return (
      <Combobox value={value ?? undefined} onValueChange={setValue}>
        <Combobox.Input placeholder="Search frameworks..." />
        <Combobox.Content>
          <Combobox.Item value="react">React</Combobox.Item>
          <Combobox.Item value="vue">Vue</Combobox.Item>
          <Combobox.Item value="angular">Angular</Combobox.Item>
          <Combobox.Item value="svelte">Svelte</Combobox.Item>
        </Combobox.Content>
      </Combobox>
    );
  },
};

export const WithGroups: StoryObj = {
  render: () => {
    const [value, setValue] = useState<string | null>(null);
    return (
      <Combobox value={value ?? undefined} onValueChange={setValue}>
        <Combobox.Input placeholder="Search languages..." />
        <Combobox.Content>
          <Combobox.Group label="Frontend">
            <Combobox.Item value="typescript">TypeScript</Combobox.Item>
            <Combobox.Item value="javascript">JavaScript</Combobox.Item>
          </Combobox.Group>
          <Combobox.Group label="Backend">
            <Combobox.Item value="rust">Rust</Combobox.Item>
            <Combobox.Item value="go">Go</Combobox.Item>
          </Combobox.Group>
        </Combobox.Content>
      </Combobox>
    );
  },
};
