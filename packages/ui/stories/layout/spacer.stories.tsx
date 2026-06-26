import type { Meta, StoryObj } from '@storybook/react';
import { Spacer } from '../../src/layout/spacer';

const meta: Meta = {
  title: 'Layout/Spacer',
};

export default meta;

export const AllSizes: StoryObj = {
  render: () => (
    <div className="flex flex-col">
      <div className="h-10 bg-[var(--color-muted)] rounded" />
      <Spacer size="xs" />
      <p className="text-xs text-[var(--color-muted-foreground)]">xs</p>
      <div className="h-10 bg-[var(--color-muted)] rounded" />
      <Spacer size="sm" />
      <p className="text-xs text-[var(--color-muted-foreground)]">sm</p>
      <div className="h-10 bg-[var(--color-muted)] rounded" />
      <Spacer size="md" />
      <p className="text-xs text-[var(--color-muted-foreground)]">md (default)</p>
      <div className="h-10 bg-[var(--color-muted)] rounded" />
      <Spacer size="lg" />
      <p className="text-xs text-[var(--color-muted-foreground)]">lg</p>
      <div className="h-10 bg-[var(--color-muted)] rounded" />
      <Spacer size="xl" />
      <p className="text-xs text-[var(--color-muted-foreground)]">xl</p>
      <div className="h-10 bg-[var(--color-muted)] rounded" />
    </div>
  ),
};
