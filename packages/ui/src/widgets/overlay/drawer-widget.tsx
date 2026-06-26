import { Sheet } from '../../overlays/sheet';
import type { WidgetComponentProps } from '../types';

export function DrawerWidget({ props, bind, on, children }: WidgetComponentProps) {
  const title = (props.title as string) ?? '';
  const width = (props.width as 'sm' | 'md' | 'lg') ?? 'md';
  const closable = (props.closable as boolean) ?? true;

  const open = bind.value as boolean;

  const handleOpenChange = (next: boolean) => {
    bind.setValue?.(next);
    if (!next) on.close?.();
  };

  const widthClasses: Record<string, string> = {
    sm: 'w-80',
    md: 'w-[480px]',
    lg: 'w-[640px]',
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <Sheet.Overlay />
      <Sheet.Content side="right" className={widthClasses[width]}>
        {title && (
          <Sheet.Header>
            <Sheet.Title>{title}</Sheet.Title>
          </Sheet.Header>
        )}
        <div className="flex-1 overflow-auto p-4">{children}</div>
        {closable && <Sheet.Close />}
      </Sheet.Content>
    </Sheet>
  );
}

DrawerWidget.displayName = 'DrawerWidget';
