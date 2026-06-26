import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

const textVariants = cva('', {
  variants: {
    variant: {
      heading: 'text-lg font-semibold',
      body: 'text-sm',
      caption: 'text-xs text-muted-foreground',
      bold: 'text-sm font-medium',
      muted: 'text-sm text-muted-foreground',
      mono: 'font-mono text-sm',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
  },
  defaultVariants: {
    variant: 'body',
  },
});

export type TextProps = ComponentProps<'p'> & VariantProps<typeof textVariants>;

export const Text = forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, variant, align, ...props }, ref) => {
    return <p ref={ref} className={cn(textVariants({ variant, align, className }))} {...props} />;
  },
);

Text.displayName = 'Text';
export { textVariants };
