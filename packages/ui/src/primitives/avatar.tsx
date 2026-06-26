import { Avatar as BaseAvatar } from '@base-ui/react/avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

const avatarVariants = cva('relative flex shrink-0 overflow-hidden rounded-full', {
  variants: {
    size: {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export type AvatarProps = ComponentProps<'span'> & VariantProps<typeof avatarVariants>;

export type AvatarImageProps = ComponentProps<'img'> & {
  /** Called when loading status changes */
  onLoadingStatusChange?: (status: 'idle' | 'loading' | 'loaded' | 'error') => void;
};

export type AvatarFallbackProps = ComponentProps<'span'> & {
  /** Delay in ms before showing fallback */
  delay?: number;
};

const Root = forwardRef<HTMLSpanElement, AvatarProps>(({ className, size, ...props }, ref) => (
  <BaseAvatar.Root ref={ref} className={cn(avatarVariants({ size, className }))} {...props} />
));
Root.displayName = 'Avatar';

const Image = forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, onLoadingStatusChange, ...props }, ref) => (
    <BaseAvatar.Image
      ref={ref}
      onLoadingStatusChange={onLoadingStatusChange}
      className={cn(
        'aspect-square h-full w-full',
        typeof className === 'string' ? className : undefined,
      )}
      {...props}
    />
  ),
);
Image.displayName = 'Avatar.Image';

const Fallback = forwardRef<HTMLSpanElement, AvatarFallbackProps>(
  ({ className, delay, ...props }, ref) => (
    <BaseAvatar.Fallback
      ref={ref}
      delay={delay}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground',
        typeof className === 'string' ? className : undefined,
      )}
      {...props}
    />
  ),
);
Fallback.displayName = 'Avatar.Fallback';

export const Avatar = Object.assign(Root, { Image, Fallback });
export { avatarVariants };
