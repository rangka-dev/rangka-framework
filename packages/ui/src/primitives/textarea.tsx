import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

const textareaVariants = cva(
  'flex min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive',
);

export type TextareaProps = ComponentProps<'textarea'> & VariantProps<typeof textareaVariants>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea className={cn(textareaVariants({ className }))} ref={ref} {...props} />
  ),
);

Textarea.displayName = 'Textarea';

export { textareaVariants };
