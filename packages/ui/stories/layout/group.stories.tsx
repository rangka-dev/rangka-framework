import type { Meta, StoryObj } from '@storybook/react';
import { Group } from '../../src/layout/group';

const meta: Meta = {
  title: 'Layout/Group',
};

export default meta;

export const Row: StoryObj = {
  render: () => (
    <Group direction="row" gap="md" align="center">
      <div className="h-10 w-20 rounded bg-[var(--color-muted)]" />
      <div className="h-10 w-20 rounded bg-[var(--color-muted)]" />
      <div className="h-10 w-20 rounded bg-[var(--color-muted)]" />
    </Group>
  ),
};

export const Column: StoryObj = {
  render: () => (
    <Group direction="column" gap="sm">
      <div className="h-10 rounded bg-[var(--color-muted)]" />
      <div className="h-10 rounded bg-[var(--color-muted)]" />
      <div className="h-10 rounded bg-[var(--color-muted)]" />
    </Group>
  ),
};

export const SpaceBetween: StoryObj = {
  render: () => (
    <Group direction="row" justify="between" align="center" className="w-full">
      <div className="h-10 w-20 rounded bg-[var(--color-muted)]" />
      <div className="h-10 w-20 rounded bg-[var(--color-muted)]" />
    </Group>
  ),
};

export const Wrapped: StoryObj = {
  render: () => (
    <Group direction="row" gap="sm" wrap className="w-64">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-10 w-20 rounded bg-[var(--color-muted)]" />
      ))}
    </Group>
  ),
};
