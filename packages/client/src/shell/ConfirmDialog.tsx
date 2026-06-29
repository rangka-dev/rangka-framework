import { Dialog } from '@rangka/ui';
import { Button } from '@rangka/ui';

export interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Dialog open onOpenChange={(open: boolean) => !open && onCancel()} modal>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Confirm</Dialog.Title>
          <Dialog.Description>{message}</Dialog.Description>
        </Dialog.Header>
        <Dialog.Footer>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Confirm</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
