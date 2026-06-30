import type { WidgetProps } from '../types.js';
import { useWidgetComponent } from '../../ui/UIProvider.js';
import { usePageState } from '../hooks/usePageState.js';

export function DrawerController({ props, on, children }: WidgetProps) {
  const Drawer = useWidgetComponent('drawer');
  const visibleField = props._visibleField as string | undefined;
  const state = usePageState();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (visibleField && visibleField.startsWith('$state.')) {
        const key = visibleField.slice(7);
        state.set(key, null);
      }
      on.close?.();
    }
  };

  if (!Drawer) return null;

  return (
    <Drawer
      props={props}
      bind={{
        value: true,
        setValue: (val) => handleOpenChange(val as boolean),
      }}
      on={{ close: () => handleOpenChange(false) }}
      context={{ record: {}, model: '', mode: 'record' }}
    >
      {children}
    </Drawer>
  );
}
