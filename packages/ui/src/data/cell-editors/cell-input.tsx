import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../../lib/cn';

export type CellInputProps = Omit<ComponentProps<'input'>, 'size'> & {
  /** Input type */
  type?: 'text' | 'number';
};

export const CellInput = forwardRef<HTMLInputElement, CellInputProps>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'h-full w-full bg-transparent text-2xs text-foreground outline-none placeholder:text-muted-foreground',
        '[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
        className,
      )}
      {...props}
    />
  ),
);

CellInput.displayName = 'CellInput';
