import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

const groupVariants = cva('flex', {
  variants: {
    direction: {
      row: 'flex-row',
      column: 'flex-col',
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
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
    },
    wrap: {
      true: 'flex-wrap',
      false: '',
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
    direction: 'column',
    gap: 'md',
    wrap: false,
  },
});

export type GroupProps = ComponentProps<'div'> & VariantProps<typeof groupVariants>;

export const Group = forwardRef<HTMLDivElement, GroupProps>(
  (
    { className, direction, gap, align, justify, wrap, padding, paddingX, paddingY, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          groupVariants({ direction, gap, align, justify, wrap, padding, paddingX, paddingY, className }),
        )}
        {...props}
      />
    );
  },
);

Group.displayName = 'Group';
export { groupVariants };
