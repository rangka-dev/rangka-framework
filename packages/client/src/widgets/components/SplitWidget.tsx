import React from 'react';
import { cn } from '@/lib/utils';
import type { SpacingToken } from '@rangka/shared';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { WidgetRenderer } from '../renderer/WidgetRenderer.js';
import type { WidgetProps } from '../types.js';

const paddingMap: Record<SpacingToken, string> = {
  none: 'p-0',
  xs: 'p-1',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
  '2xl': 'p-12',
};

export function SplitWidget({ props, childNodes }: WidgetProps) {
  const sizes = props.sizes as number[] | undefined;
  const direction = (props.direction as 'horizontal' | 'vertical') ?? 'horizontal';
  const minSize = (props.minSize as number) ?? 10;
  const padding = props.padding as SpacingToken | undefined;

  const nodes = childNodes ?? [];

  return (
    <ResizablePanelGroup
      orientation={direction}
      className={cn('h-full w-full', padding && paddingMap[padding])}
    >
      {nodes.map((node, i) => (
        <React.Fragment key={node.id ?? i}>
          {i > 0 && <ResizableHandle withHandle />}
          <ResizablePanel defaultSize={sizes?.[i] ?? 100 / nodes.length} minSize={minSize}>
            <WidgetRenderer node={node} />
          </ResizablePanel>
        </React.Fragment>
      ))}
    </ResizablePanelGroup>
  );
}

SplitWidget.widgetMeta = {
  name: 'split',
  label: 'Split',
  category: 'layout' as const,
  schema: {
    sizes: { type: 'array' as const },
    direction: {
      type: 'enum' as const,
      options: ['horizontal', 'vertical'],
      default: 'horizontal',
    },
    minSize: { type: 'number' as const, default: 10 },
    padding: { type: 'enum' as const, options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] },
  },
  binding: 'none' as const,
  triggers: [],
  container: true,
};
