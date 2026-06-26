import { Dialog } from '../../overlays/dialog';
import type { WidgetComponentProps } from '../types';

export function ModalWidget({ props, bind, on, children }: WidgetComponentProps) {
  const title = (props.title as string) ?? '';
  const size = (props.size as 'sm' | 'md' | 'lg') ?? 'md';
  const closable = (props.closable as boolean) ?? true;

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
      <Dialog.Overlay />
      <Dialog.Content className={sizeClasses[size]}>
        {title && (
          <Dialog.Header>
            <Dialog.Title>{title}</Dialog.Title>
          </Dialog.Header>
        )}
        <div className="p-4">{children}</div>
        {closable && <Dialog.Close />}
      </Dialog.Content>
    </Dialog>
  );
}

ModalWidget.displayName = 'ModalWidget';
