import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

const gridVariants = cva('grid', {
  variants: {
    columns: {
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
    },
    gap: {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
      '2xl': 'gap-12',
    },
    rowGap: {
      none: 'gap-y-0',
      xs: 'gap-y-1',
      sm: 'gap-y-2',
      md: 'gap-y-4',
      lg: 'gap-y-6',
      xl: 'gap-y-8',
      '2xl': 'gap-y-12',
    },
    colGap: {
      none: 'gap-x-0',
      xs: 'gap-x-1',
      sm: 'gap-x-2',
      md: 'gap-x-4',
      lg: 'gap-x-6',
      xl: 'gap-x-8',
      '2xl': 'gap-x-12',
    },
    autoFlow: {
      row: 'grid-flow-row',
      column: 'grid-flow-col',
      dense: 'grid-flow-dense',
    },
    padding: {
      none: 'p-0',
      xs: 'p-1',
      sm: 'p-2',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
      '2xl': 'p-12',
    },
    paddingX: {
      none: 'px-0',
      xs: 'px-1',
      sm: 'px-2',
      md: 'px-4',
      lg: 'px-6',
      xl: 'px-8',
      '2xl': 'px-12',
    },
    paddingY: {
      none: 'py-0',
      xs: 'py-1',
      sm: 'py-2',
      md: 'py-4',
      lg: 'py-6',
      xl: 'py-8',
      '2xl': 'py-12',
    },
  },
  defaultVariants: {
    columns: 3,
    gap: 'md',
    autoFlow: 'row',
  },
});

export type GridProps = ComponentProps<'div'> &
  VariantProps<typeof gridVariants> & {
    /** Responsive column overrides per breakpoint */
    responsive?: { sm?: number; md?: number; lg?: number };
  };

export const Grid = forwardRef<HTMLDivElement, GridProps>(
  (
    { className, columns, gap, rowGap, colGap, autoFlow, padding, paddingX, paddingY, responsive, ...props },
    ref,
  ) => {
    const responsiveClasses: string[] = [];
    if (responsive) {
      if (responsive.sm) responsiveClasses.push(`max-sm:grid-cols-${responsive.sm}`);
      if (responsive.md) responsiveClasses.push(`max-md:grid-cols-${responsive.md}`);
      if (responsive.lg) responsiveClasses.push(`max-lg:grid-cols-${responsive.lg}`);
    } else {
      const cols = columns ?? 3;
      if (cols >= 3) {
        responsiveClasses.push('max-md:grid-cols-2', 'max-sm:grid-cols-1');
      } else if (cols === 2) {
        responsiveClasses.push('max-sm:grid-cols-1');
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          gridVariants({
            columns,
            gap: rowGap || colGap ? undefined : gap,
            rowGap,
            colGap,
            autoFlow,
            padding,
            paddingX,
            paddingY,
            className,
          }),
          ...responsiveClasses,
        )}
        {...props}
      />
    );
  },
);

Grid.displayName = 'Grid';
export { gridVariants };
