import { Drawer } from '../../overlays/drawer';
import type { WidgetComponentProps } from '../types';

export function DrawerWidget({ props, bind, on, children }: WidgetComponentProps) {
  const title = (props.title as string) ?? '';
  const width = (props.width as 'sm' | 'md' | 'lg') ?? 'md';

  const open = bind.value as boolean;

  const handleOpenChange = (next: boolean) => {
    bind.setValue?.(next);
    if (!next) on.close?.();
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <Drawer.Content width={width}>
        <Drawer.Header onClose={() => handleOpenChange(false)}>
          <Drawer.Title>{title}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>{children}</Drawer.Body>
      </Drawer.Content>
    </Drawer>
  );
}

DrawerWidget.displayName = 'DrawerWidget';
