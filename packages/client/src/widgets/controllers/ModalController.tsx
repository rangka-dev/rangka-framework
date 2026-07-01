import type { WidgetProps } from '../types.js';
import { useWidgetComponent } from '../../ui/UIProvider.js';
import { usePageState } from '../hooks/usePageState.js';

export function ModalController({ props, children }: WidgetProps) {
  const Modal = useWidgetComponent('modal');
  const visibleField = props._visibleField as string | undefined;
  const state = usePageState();

  const handleOpenChange = (open: boolean) => {
    if (!open && visibleField && visibleField.startsWith('$state.')) {
      const key = visibleField.slice(7);
      state.set(key, false);
    }
  };

  if (!Modal) return null;

  return (
    <Modal
      props={props}
      bind={{
        value: true,
        setValue: (val) => handleOpenChange(val as boolean),
      }}
      on={{ close: () => handleOpenChange(false) }}
      context={{ record: {}, model: '', mode: 'record' }}
    >
      {children}
    </Modal>
  );
}
