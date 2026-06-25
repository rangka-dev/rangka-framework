import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

export type CardProps = ComponentProps<'div'>;

export type CardHeaderProps = ComponentProps<'div'>;

export type CardTitleProps = ComponentProps<'h3'>;

export type CardDescriptionProps = ComponentProps<'p'>;

export type CardActionProps = ComponentProps<'div'>;

export type CardContentProps = ComponentProps<'div'>;

export type CardFooterProps = ComponentProps<'div'>;

const CardRoot = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-card-foreground)]',
        className,
      )}
      {...props}
    />
  );
});
CardRoot.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex items-center justify-between gap-4 p-4', className)}
      {...props}
    />
  );
});
CardHeader.displayName = 'Card.Header';

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(({ className, ...props }, ref) => {
  return <h3 ref={ref} className={cn('font-semibold tracking-tight', className)} {...props} />;
});
CardTitle.displayName = 'Card.Title';

const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-[var(--color-muted-foreground)]', className)}
        {...props}
      />
    );
  },
);
CardDescription.displayName = 'Card.Description';

const CardAction = forwardRef<HTMLDivElement, CardActionProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn('flex items-center gap-2', className)} {...props} />;
});
CardAction.displayName = 'Card.Action';

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn('p-4 pt-0', className)} {...props} />;
});
CardContent.displayName = 'Card.Content';

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex items-center gap-2 border-t border-[var(--color-border)] p-4', className)}
      {...props}
    />
  );
});
CardFooter.displayName = 'Card.Footer';

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Action: CardAction,
  Content: CardContent,
  Footer: CardFooter,
});
