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

const colsMap: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
  10: 'grid-cols-10',
  11: 'grid-cols-11',
  12: 'grid-cols-12',
};

const autoFlowMap: Record<string, string> = {
  row: 'grid-flow-row',
  column: 'grid-flow-col',
  dense: 'grid-flow-dense',
};

export function GridWidget({ props, children }: WidgetProps) {
  const columns = (props.columns as number) ?? 3;
  const gap = (props.gap as SpacingToken) ?? 'md';
  const rowGap = props.rowGap as SpacingToken | undefined;
  const colGap = props.colGap as SpacingToken | undefined;
  const autoFlow = props.autoFlow as string | undefined;
  const padding = props.padding as SpacingToken | undefined;
  const paddingX = props.paddingX as SpacingToken | undefined;
  const paddingY = props.paddingY as SpacingToken | undefined;
  const responsive = props.responsive as Record<string, number> | undefined;

  const responsiveClasses: string[] = [];
  if (responsive) {
    if (responsive.sm) responsiveClasses.push(`max-sm:grid-cols-${responsive.sm}`);
    if (responsive.md) responsiveClasses.push(`max-md:grid-cols-${responsive.md}`);
    if (responsive.lg) responsiveClasses.push(`max-lg:grid-cols-${responsive.lg}`);
  } else {
    // Default responsive: collapse columns on smaller viewports
    if (columns >= 3) {
      responsiveClasses.push('max-md:grid-cols-2', 'max-sm:grid-cols-1');
    } else if (columns === 2) {
      responsiveClasses.push('max-sm:grid-cols-1');
    }
  }

  return (
    <div
      className={cn(
        'grid',
        colsMap[columns] ?? `grid-cols-[repeat(${columns},minmax(0,1fr))]`,
        !rowGap && !colGap && gapMap[gap],
        rowGap && `row-gap-${gapMap[rowGap]?.replace('gap-', '')}`,
        colGap && `column-gap-${gapMap[colGap]?.replace('gap-', '')}`,
        autoFlow && autoFlowMap[autoFlow],
        padding && paddingMap[padding],
        paddingX && paddingXMap[paddingX],
        paddingY && paddingYMap[paddingY],
        ...responsiveClasses,
      )}
    >
      {children}
    </div>
  );
}

GridWidget.widgetMeta = {
  name: 'grid',
  label: 'Grid',
  category: 'layout' as const,
  schema: {
    columns: { type: 'number' as const, default: 3 },
    gap: {
      type: 'enum' as const,
      options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'],
      default: 'md',
    },
    rowGap: { type: 'enum' as const, options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] },
    colGap: { type: 'enum' as const, options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] },
    autoFlow: { type: 'enum' as const, options: ['row', 'column', 'dense'], default: 'row' },
    responsive: { type: 'object' as const },
    padding: { type: 'enum' as const, options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] },
    paddingX: { type: 'enum' as const, options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] },
    paddingY: { type: 'enum' as const, options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] },
  },
  binding: 'none' as const,
  triggers: [],
  container: true,
};
