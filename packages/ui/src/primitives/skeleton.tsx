import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

const skeletonVariants = cva('animate-pulse rounded-md bg-muted');

export type SkeletonProps = ComponentProps<'div'> &
  VariantProps<typeof skeletonVariants> & {
    /** Width of the skeleton element */
    width?: string | number;
    /** Height of the skeleton element */
    height?: string | number;
  };

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, width, height, style, ...props }, ref) => (
    <div
      className={cn(skeletonVariants({ className }))}
      ref={ref}
      style={{ width, height, ...style }}
      {...props}
    />
  ),
);

Skeleton.displayName = 'Skeleton';

export { skeletonVariants };
