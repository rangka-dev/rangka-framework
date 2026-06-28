import type { Meta, StoryObj } from '@storybook/react';
import { ScrollArea } from '../../src/layout/scroll-area';

const meta: Meta = {
  title: 'Layout/ScrollArea',
};

export default meta;

export const Default: StoryObj = {
  render: () => (
    <ScrollArea className="h-72 w-48 rounded border border-[var(--color-border)]">
      <ScrollArea.Viewport>
        <div className="p-4">
          {Array.from({ length: 20 }, (_, i) => (
            <p key={i} className="py-1">
              Item {i + 1}
            </p>
          ))}
        </div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar>
        <ScrollArea.Thumb />
      </ScrollArea.Scrollbar>
    </ScrollArea>
  ),
};
