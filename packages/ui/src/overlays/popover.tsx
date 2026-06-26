import { Popover as BasePopover } from '@base-ui/react/popover';
import { forwardRef, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export type PopoverProps = {
  /** Whether the popover is open (controlled) */
  open?: boolean;
  /** Whether the popover is initially open */
  defaultOpen?: boolean;
  /** Called when open state changes */
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
};

export type PopoverTriggerProps = ComponentProps<'button'>;

export type PopoverContentProps = ComponentProps<'div'> & {
  /** Preferred side for popover placement */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Alignment along the side axis */
  align?: 'start' | 'center' | 'end';
};

export type PopoverArrowProps = ComponentProps<'div'>;

export type PopoverCloseProps = ComponentProps<'button'>;

export type PopoverTitleProps = ComponentProps<'h3'>;

export type PopoverDescriptionProps = ComponentProps<'p'>;

const PopoverRoot = ({ open, defaultOpen, onOpenChange, children }: PopoverProps) => {
  return (
    <BasePopover.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange ? (o) => onOpenChange(o) : undefined}
    >
      {children}
    </BasePopover.Root>
  );
};

const PopoverTrigger = forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <BasePopover.Trigger ref={ref} className={cn(className)} {...props}>
        {children}
      </BasePopover.Trigger>
    );
  },
);
PopoverTrigger.displayName = 'Popover.Trigger';

const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, side = 'bottom', align = 'center', children, ...props }, ref) => {
    return (
      <BasePopover.Portal>
        <BasePopover.Positioner side={side} align={align}>
          <BasePopover.Popup
            ref={ref}
            className={cn(
              'z-50 w-72 rounded-md border border-[var(--color-border)] bg-[var(--color-popover)] p-4 text-[var(--color-popover-foreground)] shadow-md outline-none',
              className,
            )}
            {...props}
          >
            {children}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    );
  },
);
PopoverContent.displayName = 'Popover.Content';

const PopoverArrow = forwardRef<HTMLDivElement, PopoverArrowProps>(
  ({ className, ...props }, ref) => {
    return (
      <BasePopover.Arrow
        ref={ref}
        className={cn(
          'h-2 w-4 fill-[var(--color-popover)] stroke-[var(--color-border)]',
          className,
        )}
        {...props}
      />
    );
  },
);
PopoverArrow.displayName = 'Popover.Arrow';

const PopoverClose = forwardRef<HTMLButtonElement, PopoverCloseProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <BasePopover.Close ref={ref} className={cn(className)} {...props}>
        {children}
      </BasePopover.Close>
    );
  },
);
PopoverClose.displayName = 'Popover.Close';

const PopoverTitle = forwardRef<HTMLHeadingElement, PopoverTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <BasePopover.Title
        ref={ref}
        className={cn('text-sm font-medium leading-none', className)}
        {...props}
      />
    );
  },
);
PopoverTitle.displayName = 'Popover.Title';

const PopoverDescription = forwardRef<HTMLParagraphElement, PopoverDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <BasePopover.Description
        ref={ref}
        className={cn('text-sm text-[var(--color-muted-foreground)]', className)}
        {...props}
      />
    );
  },
);
PopoverDescription.displayName = 'Popover.Description';

export const Popover = Object.assign(PopoverRoot, {
  Trigger: PopoverTrigger,
  Content: PopoverContent,
  Arrow: PopoverArrow,
  Close: PopoverClose,
  Title: PopoverTitle,
  Description: PopoverDescription,
});
