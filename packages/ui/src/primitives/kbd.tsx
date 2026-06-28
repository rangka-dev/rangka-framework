import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

const kbdVariants = cva(
  'inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground',
);

export type KbdProps = ComponentProps<'kbd'> & VariantProps<typeof kbdVariants>;

export const Kbd = forwardRef<HTMLElement, KbdProps>(({ className, ...props }, ref) => (
  <kbd className={cn(kbdVariants({ className }))} ref={ref} {...props} />
));

Kbd.displayName = 'Kbd';

export { kbdVariants };
