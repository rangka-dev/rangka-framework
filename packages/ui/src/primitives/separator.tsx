import { Separator as BaseSeparator } from '@base-ui/react/separator';
import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

export type SeparatorProps = ComponentProps<'div'> & {
  /** The orientation of the separator */
  orientation?: 'horizontal' | 'vertical';
};

export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', ...props }, ref) => (
    <BaseSeparator
      ref={ref}
      orientation={orientation}
      className={cn(
        'shrink-0 bg-[var(--color-border)]',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      {...props}
    />
  ),
);

Separator.displayName = 'Separator';
