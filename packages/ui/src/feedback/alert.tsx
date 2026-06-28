import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ComponentProps, type ReactNode } from 'react';
import { InfoIcon, CheckCircleIcon, AlertTriangleIcon, AlertCircleIcon, XIcon } from 'lucide-react';
import { cn } from '../lib/cn';
import { Icon } from '../primitives/icon';

const alertVariants = cva('relative flex items-start gap-3 rounded-md border px-4 py-3 text-sm', {
  variants: {
    variant: {
      info: 'border-info-border bg-info-bg text-info-foreground',
      success: 'border-success-border bg-success-bg text-success-foreground',
      warning: 'border-warning-border bg-warning-bg text-warning-foreground',
      error: 'border-error-border bg-error-bg text-error-foreground',
    },
  },
  defaultVariants: {
    variant: 'info',
  },
});

const iconMap = {
  info: InfoIcon,
  success: CheckCircleIcon,
  warning: AlertTriangleIcon,
  error: AlertCircleIcon,
};

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export type AlertProps = ComponentProps<'div'> &
  VariantProps<typeof alertVariants> & {
    children?: ReactNode;
  };

export type AlertIconProps = ComponentProps<'span'> & {
  /** Override the default icon for the variant */
  icon?: ReactNode;
};

export type AlertTitleProps = ComponentProps<'h5'>;

export type AlertDescriptionProps = ComponentProps<'p'>;

export type AlertDismissProps = ComponentProps<'button'>;

const AlertRoot = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant, className }))}
        data-variant={variant ?? 'info'}
        {...props}
      >
        {children}
      </div>
    );
  },
);
AlertRoot.displayName = 'Alert';

const AlertIcon = forwardRef<HTMLSpanElement, AlertIconProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <span ref={ref} className={cn('mt-0.5 shrink-0', className)} {...props}>
        {icon ?? <DefaultAlertIcon />}
      </span>
    );
  },
);
AlertIcon.displayName = 'Alert.Icon';

function DefaultAlertIcon() {
  return <Icon icon={InfoIcon} size="sm" />;
}

const AlertTitle = forwardRef<HTMLHeadingElement, AlertTitleProps>(
  ({ className, ...props }, ref) => {
    return <h5 ref={ref} className={cn('font-medium leading-none', className)} {...props} />;
  },
);
AlertTitle.displayName = 'Alert.Title';

const AlertDescription = forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ className, ...props }, ref) => {
    return <p ref={ref} className={cn('text-sm opacity-90', className)} {...props} />;
  },
);
AlertDescription.displayName = 'Alert.Description';

const AlertDismiss = forwardRef<HTMLButtonElement, AlertDismissProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'absolute right-2 top-2 shrink-0 rounded-sm p-0.5 opacity-70 hover:opacity-100',
          className,
        )}
        aria-label="Dismiss"
        {...props}
      >
        {children ?? <Icon icon={XIcon} size="sm" className="size-3.5" />}
      </button>
    );
  },
);
AlertDismiss.displayName = 'Alert.Dismiss';

export const Alert = Object.assign(AlertRoot, {
  Icon: AlertIcon,
  Title: AlertTitle,
  Description: AlertDescription,
  Dismiss: AlertDismiss,
});

export { alertVariants, iconMap as alertIconMap };
