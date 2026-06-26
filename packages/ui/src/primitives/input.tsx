import { Input as BaseInput } from '@base-ui/react/input';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

const inputVariants = cva(
  'flex w-full rounded-md border border-border bg-transparent px-3 py-2 text-body text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-8 text-xs',
        md: 'h-9 text-sm',
        lg: 'h-10 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export type InputProps = ComponentProps<'input'> & VariantProps<typeof inputVariants>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, ...props }, ref) => (
    <BaseInput
      ref={ref as React.Ref<HTMLElement>}
      className={cn(inputVariants({ size, className }))}
      {...props}
    />
  ),
);

Input.displayName = 'Input';

export { inputVariants };
