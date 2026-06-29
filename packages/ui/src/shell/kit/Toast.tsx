import type { ToastProps } from '@rangka/shared';
import { Toast, toastIconMap } from '../../feedback/toast';
import { Icon } from '../../primitives/icon';

const iconColorMap = {
  info: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-amber-500',
  error: 'text-red-500',
};

export function ShellToast({ message, type, onDismiss }: ToastProps) {
  const IconComponent = toastIconMap[type] ?? toastIconMap.info;
  const iconColor = iconColorMap[type] ?? iconColorMap.info;

  return (
    <Toast variant={type} className="min-w-[320px]">
      <Toast.Icon icon={<Icon icon={IconComponent} size="sm" className={iconColor} />} />
      <Toast.Message>{message}</Toast.Message>
      <Toast.Dismiss onClick={onDismiss} />
    </Toast>
  );
}

ShellToast.displayName = 'ShellToast';
