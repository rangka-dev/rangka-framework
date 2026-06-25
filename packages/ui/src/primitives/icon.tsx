import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ComponentProps } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';

const iconVariants = cva('inline-flex shrink-0', {
  variants: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export type IconProps = Omit<ComponentProps<'svg'>, 'ref'> &
  VariantProps<typeof iconVariants> & {
    /** Lucide icon component to render */
    icon: LucideIcon;
  };

export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ className, icon: IconComponent, size, ...props }, ref) => (
    <IconComponent className={cn(iconVariants({ size, className }))} ref={ref} {...props} />
  ),
);

Icon.displayName = 'Icon';

export { iconVariants };
