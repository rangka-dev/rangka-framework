import { Dialog } from '../../overlays/dialog';
import type { WidgetComponentProps } from '../types';

export function ModalWidget({ props, bind, on, children }: WidgetComponentProps) {
  const title = (props.title as string) ?? '';
  const description = props.description as string | undefined;
  const size = (props.size as 'sm' | 'md' | 'lg') ?? 'md';

  const open = bind.value as boolean;

  const handleOpenChange = (next: boolean) => {
    bind.setValue?.(next);
    if (!next) on.close?.();
  };

  const sizeClasses: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-3xl',
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content className={sizeClasses[size]}>
        {title && (
          <Dialog.Header>
            <Dialog.Title>{title}</Dialog.Title>
            {description && <Dialog.Description>{description}</Dialog.Description>}
          </Dialog.Header>
        )}
        <Dialog.Body>{children}</Dialog.Body>
      </Dialog.Content>
    </Dialog>
  );
}

ModalWidget.displayName = 'ModalWidget';
