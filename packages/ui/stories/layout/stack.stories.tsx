import type { Meta, StoryObj } from '@storybook/react';
import { Stack } from '../../src/layout/stack';

const meta: Meta = {
  title: 'Layout/Stack',
};

export default meta;

export const Default: StoryObj = {
  render: () => (
    <Stack gap="md">
      <div className="h-10 rounded bg-[var(--color-muted)]" />
      <div className="h-10 rounded bg-[var(--color-muted)]" />
      <div className="h-10 rounded bg-[var(--color-muted)]" />
    </Stack>
  ),
};

export const WithPadding: StoryObj = {
  render: () => (
    <Stack gap="sm" padding="lg" className="border border-[var(--color-border)] rounded">
      <div className="h-10 rounded bg-[var(--color-muted)]" />
      <div className="h-10 rounded bg-[var(--color-muted)]" />
    </Stack>
  ),
};

export const Centered: StoryObj = {
  render: () => (
    <Stack gap="md" align="center">
      <div className="h-10 w-32 rounded bg-[var(--color-muted)]" />
      <div className="h-10 w-48 rounded bg-[var(--color-muted)]" />
      <div className="h-10 w-24 rounded bg-[var(--color-muted)]" />
    </Stack>
  ),
};
