import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

const labelVariants = cva(
  'text-body font-medium leading-none text-foreground/80 peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
);

export type LabelProps = ComponentProps<'label'> &
  VariantProps<typeof labelVariants> & {
    /** Show a required asterisk after the label text */
    required?: boolean;
  };

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, ...props }, ref) => (
    <label className={cn(labelVariants({ className }))} ref={ref} {...props}>
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  ),
);

Label.displayName = 'Label';

export { labelVariants };
