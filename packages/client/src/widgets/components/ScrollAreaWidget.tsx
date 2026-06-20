import React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { WidgetProps } from '../types.js';

export function ScrollAreaWidget({ props, children }: WidgetProps) {
  const direction = (props.direction as 'vertical' | 'horizontal' | 'both') ?? 'vertical';
  const height = props.height as string | undefined;
  const maxHeight = props.maxHeight as string | undefined;

  return (
    <ScrollArea
      className={cn(
        direction === 'horizontal' && 'overflow-x-auto',
        height && (height === '100%' ? 'h-full' : `h-[${height}]`),
        maxHeight && `max-h-[${maxHeight}]`,
      )}
    >
      {children}
    </ScrollArea>
  );
}

ScrollAreaWidget.widgetMeta = {
  name: 'scroll-area',
  label: 'Scroll Area',
  category: 'layout' as const,
  schema: {
    direction: {
      type: 'enum' as const,
      options: ['vertical', 'horizontal', 'both'],
      default: 'vertical',
    },
    height: { type: 'string' as const },
    maxHeight: { type: 'string' as const },
  },
  binding: 'none' as const,
  triggers: [],
  container: true,
};
