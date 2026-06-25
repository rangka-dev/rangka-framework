import { forwardRef, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Dialog } from '../overlays/dialog';

export type ConfirmDialogProps = {
  /** Whether the dialog is open (controlled) */
  open: boolean;
  /** Called when open state changes */
  onOpenChange: (open: boolean) => void;
  children?: ReactNode;
};

export type ConfirmDialogTitleProps = ComponentProps<'h2'>;

export type ConfirmDialogDescriptionProps = ComponentProps<'p'>;

export type ConfirmDialogActionsProps = ComponentProps<'div'>;

export type ConfirmDialogCancelProps = ComponentProps<'button'>;

export type ConfirmDialogConfirmProps = ComponentProps<'button'> & {
  /** Use destructive styling */
  destructive?: boolean;
};

const ConfirmDialogRoot = ({ open, onOpenChange, children }: ConfirmDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <Dialog.Content className="sm:max-w-sm">{children}</Dialog.Content>
    </Dialog>
  );
};

const ConfirmDialogTitle = forwardRef<HTMLHeadingElement, ConfirmDialogTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <Dialog.Header>
        <Dialog.Title ref={ref} className={className} {...props} />
      </Dialog.Header>
    );
  },
);
ConfirmDialogTitle.displayName = 'ConfirmDialog.Title';

const ConfirmDialogDescription = forwardRef<HTMLParagraphElement, ConfirmDialogDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="px-6 py-3">
        <p
          ref={ref}
          className={cn('text-sm text-[var(--color-muted-foreground)]', className)}
          {...props}
        />
      </div>
    );
  },
);
ConfirmDialogDescription.displayName = 'ConfirmDialog.Description';

const ConfirmDialogActions = forwardRef<HTMLDivElement, ConfirmDialogActionsProps>(
  ({ className, ...props }, ref) => {
    return <Dialog.Footer ref={ref} className={className} {...props} />;
  },
);
ConfirmDialogActions.displayName = 'ConfirmDialog.Actions';

const ConfirmDialogCancel = forwardRef<HTMLButtonElement, ConfirmDialogCancelProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Dialog.Close
        ref={ref}
        className={cn(
          'inline-flex h-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-transparent px-4 text-sm font-medium hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]',
          className,
        )}
        {...props}
      >
        {children ?? 'Cancel'}
      </Dialog.Close>
    );
  },
);
ConfirmDialogCancel.displayName = 'ConfirmDialog.Cancel';

const ConfirmDialogConfirm = forwardRef<HTMLButtonElement, ConfirmDialogConfirmProps>(
  ({ className, destructive, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          destructive
            ? 'bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] hover:bg-[var(--color-destructive)]/90'
            : 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary)]/90',
          className,
        )}
        {...props}
      >
        {children ?? 'Confirm'}
      </button>
    );
  },
);
ConfirmDialogConfirm.displayName = 'ConfirmDialog.Confirm';

export const ConfirmDialog = Object.assign(ConfirmDialogRoot, {
  Title: ConfirmDialogTitle,
  Description: ConfirmDialogDescription,
  Actions: ConfirmDialogActions,
  Cancel: ConfirmDialogCancel,
  Confirm: ConfirmDialogConfirm,
});
