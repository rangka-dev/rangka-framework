import React from 'react';
import { cn } from '@/lib/utils';
import type { SpacingToken } from '@rangka/shared';
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

export function StackWidget({ props, children }: WidgetProps) {
  const height = (props.height as string) ?? 'auto';
  const padding = props.padding as SpacingToken | undefined;

  return (
    <div
      className={cn(
        'relative',
        height === 'auto' ? 'h-auto' : height === '100%' ? 'h-full' : `h-[${height}]`,
        padding && paddingMap[padding],
      )}
    >
      {children}
    </div>
  );
}

StackWidget.widgetMeta = {
  name: 'stack',
  label: 'Stack',
  category: 'layout' as const,
  schema: {
    height: { type: 'string' as const, default: 'auto' },
    padding: { type: 'enum' as const, options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] },
  },
  binding: 'none' as const,
  triggers: [],
  container: true,
};
