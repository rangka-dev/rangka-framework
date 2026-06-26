import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

const dividerVariants = cva('shrink-0 bg-border', {
  variants: {
    orientation: {
      horizontal: 'h-px w-full',
      vertical: 'w-px h-full',
    },
    margin: {
      none: '',
      sm: '',
      md: '',
      lg: '',
      xl: '',
    },
  },
  compoundVariants: [
    { orientation: 'horizontal', margin: 'sm', className: 'my-2' },
    { orientation: 'horizontal', margin: 'md', className: 'my-4' },
    { orientation: 'horizontal', margin: 'lg', className: 'my-6' },
    { orientation: 'horizontal', margin: 'xl', className: 'my-8' },
    { orientation: 'vertical', margin: 'sm', className: 'mx-2' },
    { orientation: 'vertical', margin: 'md', className: 'mx-4' },
    { orientation: 'vertical', margin: 'lg', className: 'mx-6' },
    { orientation: 'vertical', margin: 'xl', className: 'mx-8' },
  ],
  defaultVariants: {
    orientation: 'horizontal',
    margin: 'md',
  },
});

export type DividerProps = Omit<ComponentProps<'div'>, 'children'> &
  VariantProps<typeof dividerVariants>;

export const Divider = forwardRef<HTMLDivElement, DividerProps>(
  ({ className, orientation, margin, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation={orientation ?? 'horizontal'}
        className={cn(dividerVariants({ orientation, margin, className }))}
        {...props}
      />
    );
  },
);

Divider.displayName = 'Divider';
export { dividerVariants };
