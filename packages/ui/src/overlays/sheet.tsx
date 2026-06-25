import { Drawer as BaseDrawer } from '@base-ui/react/drawer';
import { forwardRef, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export type SheetProps = {
  /** Whether the sheet is open (controlled) */
  open?: boolean;
  /** Whether the sheet is initially open */
  defaultOpen?: boolean;
  /** Called when open state changes */
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
};

export type SheetTriggerProps = ComponentProps<'button'>;

export type SheetContentProps = ComponentProps<'div'> & {
  /** Which side the sheet slides in from */
  side?: 'top' | 'right' | 'bottom' | 'left';
};

export type SheetHeaderProps = ComponentProps<'div'>;

export type SheetTitleProps = ComponentProps<'h2'>;

export type SheetDescriptionProps = ComponentProps<'p'>;

export type SheetCloseProps = ComponentProps<'button'>;

export type SheetOverlayProps = ComponentProps<'div'>;

const sideStyles = {
  left: 'fixed inset-y-0 left-0 w-72 border-r',
  right: 'fixed inset-y-0 right-0 w-72 border-l',
  top: 'fixed inset-x-0 top-0 h-auto border-b',
  bottom: 'fixed inset-x-0 bottom-0 h-auto border-t',
} as const;

const SheetRoot = ({ open, defaultOpen, onOpenChange, children }: SheetProps) => {
  return (
    <BaseDrawer.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange ? (o) => onOpenChange(o) : undefined}
    >
      {children}
    </BaseDrawer.Root>
  );
};

const SheetTrigger = forwardRef<HTMLButtonElement, SheetTriggerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <BaseDrawer.Trigger
        ref={ref}
        className={typeof className === 'string' ? className : undefined}
        {...props}
      >
        {children}
      </BaseDrawer.Trigger>
    );
  },
);
SheetTrigger.displayName = 'Sheet.Trigger';

const SheetOverlay = forwardRef<HTMLDivElement, SheetOverlayProps>(
  ({ className, ...props }, ref) => {
    return (
      <BaseDrawer.Backdrop
        ref={ref}
        className={cn('fixed inset-0 z-50 bg-black/50', className)}
        {...props}
      />
    );
  },
);
SheetOverlay.displayName = 'Sheet.Overlay';

const SheetContent = forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className, side = 'right', children, ...props }, ref) => {
    return (
      <BaseDrawer.Portal>
        <BaseDrawer.Backdrop className="fixed inset-0 z-50 bg-black/50" />
        <BaseDrawer.Popup
          ref={ref}
          className={cn(
            'z-50 border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-lg',
            sideStyles[side],
            className,
          )}
          {...props}
        >
          {children}
        </BaseDrawer.Popup>
      </BaseDrawer.Portal>
    );
  },
);
SheetContent.displayName = 'Sheet.Content';

const SheetHeader = forwardRef<HTMLDivElement, SheetHeaderProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn('flex flex-col gap-1.5 pb-4', className)} {...props} />;
});
SheetHeader.displayName = 'Sheet.Header';

const SheetTitle = forwardRef<HTMLHeadingElement, SheetTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <BaseDrawer.Title
        ref={ref}
        className={cn('text-lg font-semibold leading-none tracking-tight', className)}
        {...props}
      />
    );
  },
);
SheetTitle.displayName = 'Sheet.Title';

const SheetDescription = forwardRef<HTMLParagraphElement, SheetDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <BaseDrawer.Description
        ref={ref}
        className={cn('text-sm text-[var(--color-muted-foreground)]', className)}
        {...props}
      />
    );
  },
);
SheetDescription.displayName = 'Sheet.Description';

const SheetClose = forwardRef<HTMLButtonElement, SheetCloseProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <BaseDrawer.Close
        ref={ref}
        className={typeof className === 'string' ? className : undefined}
        {...props}
      >
        {children}
      </BaseDrawer.Close>
    );
  },
);
SheetClose.displayName = 'Sheet.Close';

export const Sheet = Object.assign(SheetRoot, {
  Trigger: SheetTrigger,
  Content: SheetContent,
  Header: SheetHeader,
  Title: SheetTitle,
  Description: SheetDescription,
  Close: SheetClose,
  Overlay: SheetOverlay,
});
