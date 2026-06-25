import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ComponentProps, type ReactNode } from 'react';
import { InfoIcon, CheckCircleIcon, AlertTriangleIcon, AlertCircleIcon, XIcon } from 'lucide-react';
import { cn } from '../lib/cn';

const toastVariants = cva(
  'pointer-events-auto flex items-center gap-2 rounded-md border px-3 py-2 text-sm shadow-sm',
  {
    variants: {
      variant: {
        info: 'border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info-foreground)]',
        success:
          'border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success-foreground)]',
        warning:
          'border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning-foreground)]',
        error:
          'border-[var(--color-error-border)] bg-[var(--color-error-bg)] text-[var(--color-error-foreground)]',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  },
);

const toastContainerVariants = cva('fixed z-[100] flex flex-col gap-2 pointer-events-none', {
  variants: {
    position: {
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'top-center': 'top-4 left-1/2 -translate-x-1/2',
      'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    },
  },
  defaultVariants: {
    position: 'bottom-right',
  },
});

const iconMap = {
  info: InfoIcon,
  success: CheckCircleIcon,
  warning: AlertTriangleIcon,
  error: AlertCircleIcon,
};

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export type ToastProps = ComponentProps<'div'> &
  VariantProps<typeof toastVariants> & {
    children?: ReactNode;
  };

export type ToastIconProps = ComponentProps<'span'> & {
  /** Override the default icon for the variant */
  icon?: ReactNode;
};

export type ToastMessageProps = ComponentProps<'span'>;

export type ToastDismissProps = ComponentProps<'button'>;

export type ToastContainerProps = ComponentProps<'div'> &
  VariantProps<typeof toastContainerVariants>;

const ToastRoot = forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(toastVariants({ variant, className }))}
        data-variant={variant ?? 'info'}
        {...props}
      >
        {children}
      </div>
    );
  },
);
ToastRoot.displayName = 'Toast';

const ToastIcon = forwardRef<HTMLSpanElement, ToastIconProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <span ref={ref} className={cn('shrink-0', className)} {...props}>
        {icon ?? <InfoIcon className="size-4" />}
      </span>
    );
  },
);
ToastIcon.displayName = 'Toast.Icon';

const ToastMessage = forwardRef<HTMLSpanElement, ToastMessageProps>(
  ({ className, ...props }, ref) => {
    return <span ref={ref} className={cn('flex-1', className)} {...props} />;
  },
);
ToastMessage.displayName = 'Toast.Message';

const ToastDismiss = forwardRef<HTMLButtonElement, ToastDismissProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn('shrink-0 rounded-sm p-0.5 opacity-70 hover:opacity-100', className)}
        aria-label="Dismiss"
        {...props}
      >
        {children ?? <XIcon className="size-3.5" />}
      </button>
    );
  },
);
ToastDismiss.displayName = 'Toast.Dismiss';

const ToastContainer = forwardRef<HTMLDivElement, ToastContainerProps>(
  ({ className, position, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        aria-live="polite"
        role="status"
        className={cn(toastContainerVariants({ position, className }))}
        {...props}
      >
        {children}
      </div>
    );
  },
);
ToastContainer.displayName = 'Toast.Container';

export const Toast = Object.assign(ToastRoot, {
  Icon: ToastIcon,
  Message: ToastMessage,
  Dismiss: ToastDismiss,
  Container: ToastContainer,
});

export { toastVariants, toastContainerVariants, iconMap as toastIconMap };
