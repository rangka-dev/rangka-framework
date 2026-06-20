import React from 'react';
import { cn } from '@/lib/utils';
import type { WidgetProps } from '../types.js';

const sizeMap: Record<string, string> = {
  xs: 'h-1',
  sm: 'h-2',
  md: 'h-4',
  lg: 'h-6',
  xl: 'h-8',
};

export function SpacerWidget({ props }: WidgetProps) {
  const size = (props.size as string) ?? 'md';

  return <div className={cn(sizeMap[size] ?? 'h-4')} aria-hidden="true" />;
}

SpacerWidget.widgetMeta = {
  name: 'spacer',
  label: 'Spacer',
  category: 'layout' as const,
  schema: {
    size: { type: 'enum' as const, options: ['xs', 'sm', 'md', 'lg', 'xl'], default: 'md' },
  },
  binding: 'none' as const,
  triggers: [],
  container: false,
};
