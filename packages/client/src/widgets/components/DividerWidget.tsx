import React from 'react';
import { Separator } from '@/components/ui/separator';
import type { WidgetProps } from '../types.js';

const spacingMap: Record<string, string> = {
  none: 'my-0',
  sm: 'my-2',
  md: 'my-4',
  lg: 'my-6',
  xl: 'my-8',
};

export function DividerWidget({ props }: WidgetProps) {
  const margin = (props.margin as string) ?? (props.marginY as string) ?? 'md';
  const className = spacingMap[margin] ?? spacingMap.md;

  return <Separator className={className} />;
}

DividerWidget.widgetMeta = {
  name: 'divider',
  label: 'Divider',
  category: 'layout' as const,
  schema: {
    margin: {
      type: 'enum' as const,
      options: ['none', 'sm', 'md', 'lg', 'xl'],
    },
    marginY: {
      type: 'enum' as const,
      options: ['none', 'sm', 'md', 'lg', 'xl'],
    },
  },
  binding: 'none' as const,
  triggers: [],
  container: false,
};
