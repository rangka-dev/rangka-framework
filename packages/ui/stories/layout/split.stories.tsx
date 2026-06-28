import type { Meta, StoryObj } from '@storybook/react';
import { Split } from '../../src/layout/split';

const meta: Meta = {
  title: 'Layout/Split',
};

export default meta;

export const Default: StoryObj = {
  render: () => (
    <div className="h-64 border border-[var(--color-border)] rounded">
      <Split direction="horizontal">
        <Split.Panel defaultSize={50}>
          <div className="flex h-full items-center justify-center bg-[var(--color-muted)]">
            Left
          </div>
        </Split.Panel>
        <Split.Handle withHandle />
        <Split.Panel defaultSize={50}>
          <div className="flex h-full items-center justify-center bg-[var(--color-muted)]">
            Right
          </div>
        </Split.Panel>
      </Split>
    </div>
  ),
};

export const Vertical: StoryObj = {
  render: () => (
    <div className="h-64 border border-[var(--color-border)] rounded">
      <Split direction="vertical">
        <Split.Panel defaultSize={40}>
          <div className="flex h-full items-center justify-center bg-[var(--color-muted)]">
            Top
          </div>
        </Split.Panel>
        <Split.Handle withHandle />
        <Split.Panel defaultSize={60}>
          <div className="flex h-full items-center justify-center bg-[var(--color-muted)]">
            Bottom
          </div>
        </Split.Panel>
      </Split>
    </div>
  ),
};

export const ThreePanels: StoryObj = {
  render: () => (
    <div className="h-64 border border-[var(--color-border)] rounded">
      <Split direction="horizontal">
        <Split.Panel defaultSize={25} minSize={15}>
          <div className="flex h-full items-center justify-center bg-[var(--color-muted)]">
            Nav
          </div>
        </Split.Panel>
        <Split.Handle />
        <Split.Panel defaultSize={50}>
          <div className="flex h-full items-center justify-center bg-[var(--color-muted)]">
            Content
          </div>
        </Split.Panel>
        <Split.Handle />
        <Split.Panel defaultSize={25} minSize={15}>
          <div className="flex h-full items-center justify-center bg-[var(--color-muted)]">
            Inspector
          </div>
        </Split.Panel>
      </Split>
    </div>
  ),
};
