import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

const stackVariants = cva('flex flex-col', {
  variants: {
    gap: {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
      '2xl': 'gap-12',
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
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    },
  },
  defaultVariants: {
    gap: 'md',
    align: 'stretch',
  },
});

export type StackProps = ComponentProps<'div'> &
  VariantProps<typeof stackVariants> & {
    /** Fixed height value (e.g., '100%', '400px') */
    height?: string;
  };

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  ({ className, gap, padding, align, height, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(stackVariants({ gap, padding, align, className }))}
        style={height ? { ...style, height } : style}
        {...props}
      />
    );
  },
);

Stack.displayName = 'Stack';
export { stackVariants };
