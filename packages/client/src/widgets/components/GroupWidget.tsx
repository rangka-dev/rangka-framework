import React from 'react';
import { cn } from '@/lib/utils';
import type { SpacingToken } from '@rangka/shared';
import type { WidgetProps } from '../types.js';

const gapMap: Record<SpacingToken, string> = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
  '2xl': 'gap-12',
};

const paddingMap: Record<SpacingToken, string> = {
  none: 'p-0',
  xs: 'p-1',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
  '2xl': 'p-12',
};

const paddingXMap: Record<SpacingToken, string> = {
  none: 'px-0',
  xs: 'px-1',
  sm: 'px-2',
  md: 'px-4',
  lg: 'px-6',
  xl: 'px-8',
  '2xl': 'px-12',
};

const paddingYMap: Record<SpacingToken, string> = {
  none: 'py-0',
  xs: 'py-1',
  sm: 'py-2',
  md: 'py-4',
  lg: 'py-6',
  xl: 'py-8',
  '2xl': 'py-12',
};

const alignMap: Record<string, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const justifyMap: Record<string, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
};

export function GroupWidget({ props, children }: WidgetProps) {
  const direction = (props.direction as 'row' | 'column') ?? 'column';
  const gap = (props.gap as SpacingToken) ?? 'md';
  const align = props.align as string | undefined;
  const justify = props.justify as string | undefined;
  const wrap = props.wrap as boolean | undefined;
  const padding = props.padding as SpacingToken | undefined;
  const paddingX = props.paddingX as SpacingToken | undefined;
  const paddingY = props.paddingY as SpacingToken | undefined;

  return (
    <div
      className={cn(
        'flex',
        direction === 'row' ? 'flex-row' : 'flex-col',
        gapMap[gap],
        align && alignMap[align],
        justify && justifyMap[justify],
        wrap && 'flex-wrap',
        padding && paddingMap[padding],
        paddingX && paddingXMap[paddingX],
        paddingY && paddingYMap[paddingY],
      )}
    >
      {children}
    </div>
  );
}

GroupWidget.widgetMeta = {
  name: 'group',
  label: 'Group',
  category: 'layout' as const,
  schema: {
    direction: { type: 'enum' as const, options: ['row', 'column'], default: 'column' },
    align: { type: 'enum' as const, options: ['start', 'center', 'end', 'stretch'] },
    justify: { type: 'enum' as const, options: ['start', 'center', 'end', 'between', 'around'] },
    gap: {
      type: 'enum' as const,
      options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'],
      default: 'md',
    },
    wrap: { type: 'boolean' as const, default: false },
    padding: { type: 'enum' as const, options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] },
    paddingX: { type: 'enum' as const, options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] },
    paddingY: { type: 'enum' as const, options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] },
  },
  binding: 'none' as const,
  triggers: [],
  container: true,
};
