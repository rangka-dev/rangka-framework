import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

const pageContainerVariants = cva(
  'w-full h-full flex flex-col animate-[fade-in_var(--duration-normal)_var(--ease-out)]',
  {
    variants: {
      layout: {
        default: 'px-6 py-4 gap-6',
        full: '',
      },
    },
    defaultVariants: { layout: 'default' },
  },
);

export type PageContainerProps = ComponentProps<'div'> & VariantProps<typeof pageContainerVariants>;

export const PageContainer = forwardRef<HTMLDivElement, PageContainerProps>(
  ({ className, layout, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="page-container"
      className={cn(pageContainerVariants({ layout, className }))}
      {...props}
    />
  ),
);

PageContainer.displayName = 'PageContainer';

export { pageContainerVariants };
