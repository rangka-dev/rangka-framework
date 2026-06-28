import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

const imageVariants = cva('max-w-full', {
  variants: {
    rounded: {
      none: '',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      full: 'rounded-full',
    },
    fit: {
      contain: 'object-contain',
      cover: 'object-cover',
      fill: 'object-fill',
      none: 'object-none',
    },
  },
  defaultVariants: {
    rounded: 'sm',
  },
});

export type ImageProps = ComponentProps<'img'> & VariantProps<typeof imageVariants>;

export const Image = forwardRef<HTMLImageElement, ImageProps>(
  ({ className, rounded, fit, ...props }, ref) => {
    return <img ref={ref} className={cn(imageVariants({ rounded, fit, className }))} {...props} />;
  },
);

Image.displayName = 'Image';
export { imageVariants };
