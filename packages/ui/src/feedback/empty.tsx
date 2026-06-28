import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

export type EmptyProps = ComponentProps<'div'>;

export type EmptyHeaderProps = ComponentProps<'div'>;

const emptyMediaVariants = cva(
  'mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        icon: "flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export type EmptyMediaProps = ComponentProps<'div'> & VariantProps<typeof emptyMediaVariants>;

export type EmptyTitleProps = ComponentProps<'div'>;

export type EmptyDescriptionProps = ComponentProps<'p'>;

export type EmptyContentProps = ComponentProps<'div'>;

const EmptyRoot = forwardRef<HTMLDivElement, EmptyProps>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-4 rounded-md border-dashed p-6 text-center text-balance',
        className,
      )}
      {...props}
    />
  );
});
EmptyRoot.displayName = 'Empty';

const EmptyHeader = forwardRef<HTMLDivElement, EmptyHeaderProps>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex max-w-sm flex-col items-center gap-2', className)}
      {...props}
    />
  );
});
EmptyHeader.displayName = 'Empty.Header';

const EmptyMedia = forwardRef<HTMLDivElement, EmptyMediaProps>(
  ({ className, variant, ...props }, ref) => {
    return <div ref={ref} className={cn(emptyMediaVariants({ variant, className }))} {...props} />;
  },
);
EmptyMedia.displayName = 'Empty.Media';

const EmptyTitle = forwardRef<HTMLDivElement, EmptyTitleProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn('text-sm font-medium', className)} {...props} />;
});
EmptyTitle.displayName = 'Empty.Title';

const EmptyDescription = forwardRef<HTMLParagraphElement, EmptyDescriptionProps>(
  ({ className, ...props }, ref) => {
    return <p ref={ref} className={cn('text-xs text-muted-foreground', className)} {...props} />;
  },
);
EmptyDescription.displayName = 'Empty.Description';

const EmptyContent = forwardRef<HTMLDivElement, EmptyContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex w-full max-w-sm min-w-0 flex-col items-center gap-2.5 text-xs',
          className,
        )}
        {...props}
      />
    );
  },
);
EmptyContent.displayName = 'Empty.Content';

export const Empty = Object.assign(EmptyRoot, {
  Header: EmptyHeader,
  Media: EmptyMedia,
  Title: EmptyTitle,
  Description: EmptyDescription,
  Content: EmptyContent,
});

export { emptyMediaVariants };
