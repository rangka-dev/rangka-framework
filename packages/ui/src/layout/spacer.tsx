import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

const spacerVariants = cva('', {
  variants: {
    size: {
      xs: 'h-1',
      sm: 'h-2',
      md: 'h-4',
      lg: 'h-6',
      xl: 'h-8',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export type SpacerProps = Omit<ComponentProps<'div'>, 'children'> &
  VariantProps<typeof spacerVariants>;

export const Spacer = forwardRef<HTMLDivElement, SpacerProps>(
  ({ className, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn(spacerVariants({ size, className }))}
        {...props}
      />
    );
  },
);

Spacer.displayName = 'Spacer';
export { spacerVariants };
