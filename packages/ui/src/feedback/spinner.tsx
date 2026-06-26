import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ComponentProps } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/cn';

const spinnerVariants = cva('animate-spin', {
  variants: {
    size: {
      xs: 'size-3',
      sm: 'size-4',
      md: 'size-5',
      lg: 'size-6',
      xl: 'size-8',
    },
  },
  defaultVariants: {
    size: 'sm',
  },
});

export type SpinnerProps = Omit<ComponentProps<'svg'>, 'children'> &
  VariantProps<typeof spinnerVariants>;

export const Spinner = forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size, ...props }, ref) => {
    return (
      <Loader2
        ref={ref}
        role="status"
        aria-label="Loading"
        className={cn(spinnerVariants({ size, className }))}
        {...props}
      />
    );
  },
);

Spinner.displayName = 'Spinner';
export { spinnerVariants };
