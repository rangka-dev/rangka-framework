import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../../lib/cn';

export type CellCheckboxProps = Omit<ComponentProps<'input'>, 'type' | 'size'>;

export const CellCheckbox = forwardRef<HTMLInputElement, CellCheckboxProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        'size-3.5 cursor-pointer rounded-sm border border-border accent-primary',
        className,
      )}
      {...props}
    />
  ),
);

CellCheckbox.displayName = 'CellCheckbox';
