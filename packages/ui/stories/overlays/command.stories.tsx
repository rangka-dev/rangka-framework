import type { Meta, StoryObj } from '@storybook/react';
import { Command } from '../../src/overlays/command';

const meta: Meta = {
  title: 'Overlays/Command',
};

export default meta;

export const Basic: StoryObj = {
  render: () => (
    <Command className="w-[350px] rounded-lg border border-[var(--color-border)] shadow-md">
      <Command.Input placeholder="Type a command or search..." />
      <Command.List>
        <Command.Group heading="Suggestions">
          <Command.Item onSelect={() => {}}>Calendar</Command.Item>
          <Command.Item onSelect={() => {}}>Search</Command.Item>
          <Command.Item onSelect={() => {}}>Settings</Command.Item>
        </Command.Group>
        <Command.Group heading="Pages">
          <Command.Item onSelect={() => {}}>Dashboard</Command.Item>
          <Command.Item onSelect={() => {}}>Projects</Command.Item>
          <Command.Item onSelect={() => {}}>Team</Command.Item>
        </Command.Group>
        <Command.Empty>No results found.</Command.Empty>
      </Command.List>
    </Command>
  ),
};
