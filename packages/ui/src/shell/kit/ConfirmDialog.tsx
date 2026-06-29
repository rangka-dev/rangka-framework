import type { ConfirmDialogProps as ShellConfirmDialogProps } from '@rangka/shared';
import { ConfirmDialog } from '../../feedback/confirm-dialog';

export function ShellConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: ShellConfirmDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onCancel();
      }}
    >
      <ConfirmDialog.Title>{title ?? 'Confirm'}</ConfirmDialog.Title>
      <ConfirmDialog.Description>{message}</ConfirmDialog.Description>
      <ConfirmDialog.Actions>
        <ConfirmDialog.Cancel onClick={onCancel}>Cancel</ConfirmDialog.Cancel>
        <ConfirmDialog.Confirm onClick={onConfirm}>Confirm</ConfirmDialog.Confirm>
      </ConfirmDialog.Actions>
    </ConfirmDialog>
  );
}

ShellConfirmDialog.displayName = 'ShellConfirmDialog';
