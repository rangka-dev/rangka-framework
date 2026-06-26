import type { Meta, StoryObj } from '@storybook/react';
import { Grid } from '../../src/layout/grid';

const meta: Meta = {
  title: 'Layout/Grid',
};

export default meta;

export const Default: StoryObj = {
  render: () => (
    <Grid columns={3} gap="md">
      <div className="h-20 rounded bg-[var(--color-muted)]" />
      <div className="h-20 rounded bg-[var(--color-muted)]" />
      <div className="h-20 rounded bg-[var(--color-muted)]" />
      <div className="h-20 rounded bg-[var(--color-muted)]" />
      <div className="h-20 rounded bg-[var(--color-muted)]" />
      <div className="h-20 rounded bg-[var(--color-muted)]" />
    </Grid>
  ),
};

export const FourColumns: StoryObj = {
  render: () => (
    <Grid columns={4} gap="sm">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-16 rounded bg-[var(--color-muted)]" />
      ))}
    </Grid>
  ),
};

export const WithPadding: StoryObj = {
  render: () => (
    <Grid columns={2} gap="lg" padding="md" className="border border-[var(--color-border)] rounded">
      <div className="h-20 rounded bg-[var(--color-muted)]" />
      <div className="h-20 rounded bg-[var(--color-muted)]" />
      <div className="h-20 rounded bg-[var(--color-muted)]" />
      <div className="h-20 rounded bg-[var(--color-muted)]" />
    </Grid>
  ),
};
