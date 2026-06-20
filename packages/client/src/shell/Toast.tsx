import { useEffect, useRef, type ElementType } from 'react';
import { InfoIcon, CheckCircleIcon, AlertTriangleIcon, AlertCircleIcon, XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastProps {
  message: string;
  type: ToastType;
  onDismiss: () => void;
}

const iconMap: Record<ToastType, ElementType> = {
  info: InfoIcon,
  success: CheckCircleIcon,
  warning: AlertTriangleIcon,
  error: AlertCircleIcon,
};

const colorMap: Record<ToastType, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100',
  success:
    'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100',
  warning:
    'border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100',
  error:
    'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100',
};

export function Toast({ message, type, onDismiss }: ToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const IconComp = iconMap[type];

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timerRef.current);
  }, [onDismiss]);

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-2 rounded-md border px-3 py-2 text-sm shadow-sm',
        colorMap[type],
      )}
      role="alert"
    >
      <IconComp className="size-4 shrink-0" />
      <span className="flex-1">{message}</span>
      <button
        onClick={onDismiss}
        className="shrink-0 rounded-sm p-0.5 opacity-70 hover:opacity-100"
        aria-label="Dismiss"
      >
        <XIcon className="size-3.5" />
      </button>
    </div>
  );
}
