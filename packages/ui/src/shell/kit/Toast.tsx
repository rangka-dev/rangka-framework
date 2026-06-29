import type { ToastProps } from '@rangka/shared';
import { Alert } from '../../feedback/alert';

export function ShellToast({ message, type, onDismiss }: ToastProps) {
  return (
    <Alert variant={type}>
      <Alert.Icon />
      <Alert.Title>{message}</Alert.Title>
      <Alert.Dismiss onClick={onDismiss} />
    </Alert>
  );
}

ShellToast.displayName = 'ShellToast';
