import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { forwardRef, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export type DialogProps = {
  /** Whether the dialog is open (controlled) */
  open?: boolean;
  /** Whether the dialog is initially open */
  defaultOpen?: boolean;
  /** Called when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Whether the dialog is modal */
  modal?: boolean | 'trap-focus';
  children?: ReactNode;
};

export type DialogTriggerProps = ComponentProps<'button'>;

export type DialogContentProps = ComponentProps<'div'>;

export type DialogHeaderProps = ComponentProps<'div'>;

export type DialogTitleProps = ComponentProps<'h2'>;

export type DialogDescriptionProps = ComponentProps<'p'>;

export type DialogFooterProps = ComponentProps<'div'>;

export type DialogCloseProps = ComponentProps<'button'>;

export type DialogOverlayProps = ComponentProps<'div'>;

const DialogRoot = ({ open, defaultOpen, onOpenChange, modal, children }: DialogProps) => {
  return (
    <BaseDialog.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange ? (o) => onOpenChange(o) : undefined}
      modal={modal}
    >
      {children}
    </BaseDialog.Root>
  );
};

const DialogTrigger = forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <BaseDialog.Trigger
        ref={ref}
        className={typeof className === 'string' ? className : undefined}
        {...props}
      >
        {children}
      </BaseDialog.Trigger>
    );
  },
);
DialogTrigger.displayName = 'Dialog.Trigger';

const DialogOverlay = forwardRef<HTMLDivElement, DialogOverlayProps>(
  ({ className, ...props }, ref) => {
    return (
      <BaseDialog.Backdrop
        ref={ref}
        className={cn('fixed inset-0 z-50 bg-backdrop', className)}
        {...props}
      />
    );
  },
);
DialogOverlay.displayName = 'Dialog.Overlay';

const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-backdrop" />
        <BaseDialog.Popup
          ref={ref}
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-0 shadow-lg',
            className,
          )}
          {...props}
        >
          {children}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    );
  },
);
DialogContent.displayName = 'Dialog.Content';

const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('flex flex-col gap-1.5 p-6 pb-0', className)} {...props} />;
  },
);
DialogHeader.displayName = 'Dialog.Header';

const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <BaseDialog.Title
        ref={ref}
        className={cn('text-lg font-semibold leading-none tracking-tight', className)}
        {...props}
      />
    );
  },
);
DialogTitle.displayName = 'Dialog.Title';

const DialogDescription = forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <BaseDialog.Description
        ref={ref}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
      />
    );
  },
);
DialogDescription.displayName = 'Dialog.Description';

export type DialogBodyProps = ComponentProps<'div'>;

const DialogBody = forwardRef<HTMLDivElement, DialogBodyProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn('px-6 py-4', className)} {...props} />;
});
DialogBody.displayName = 'Dialog.Body';

const DialogFooter = forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-end gap-2 p-6 pt-0', className)}
        {...props}
      />
    );
  },
);
DialogFooter.displayName = 'Dialog.Footer';

const DialogClose = forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <BaseDialog.Close
        ref={ref}
        className={typeof className === 'string' ? className : undefined}
        {...props}
      >
        {children}
      </BaseDialog.Close>
    );
  },
);
DialogClose.displayName = 'Dialog.Close';

export const Dialog = Object.assign(DialogRoot, {
  Trigger: DialogTrigger,
  Content: DialogContent,
  Header: DialogHeader,
  Title: DialogTitle,
  Description: DialogDescription,
  Body: DialogBody,
  Footer: DialogFooter,
  Close: DialogClose,
  Overlay: DialogOverlay,
});
