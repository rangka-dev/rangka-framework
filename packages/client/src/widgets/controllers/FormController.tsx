import { useCallback, useMemo } from 'react';
import type { WidgetProps } from '../types.js';
import { useWidgetContext } from '../hooks/useWidgetContext.js';
import { useWidgetComponent } from '../../ui/UIProvider.js';
import { usePageState, useStateVersion } from '../hooks/usePageState.js';
import { FormProvider } from '../form/FormProvider.js';

export function FormController({ props, bind, on, children }: WidgetProps) {
  const ctx = useWidgetContext();
  const modelName = ctx.model;
  const id = bind.id ?? undefined;
  const UIForm = useWidgetComponent('form');
  const state = usePageState();
  const stateVersion = useStateVersion();

  const resolvedMode = useMemo((): 'create' | 'record' | undefined => {
    const modeValue = props.mode as string | undefined;
    if (!modeValue) return undefined;

    if (modeValue.startsWith('$state.')) {
      const key = modeValue.slice(7);
      const stateVal = state.get(key);
      return stateVal ? 'record' : 'record';
    }

    if (modeValue === 'create') return 'create';
    if (modeValue === 'record' || modeValue === 'edit' || modeValue === 'view') return 'record';

    return undefined;
  }, [props.mode, state, stateVersion]);

  const handleSuccess = useCallback(
    (record: Record<string, unknown>, mode: 'create' | 'record') => {
      on.success?.({ record, mode });
    },
    [on],
  );

  const handleError = useCallback(
    (errors: Record<string, string>, message: string) => {
      on.error?.({ errors, message });
    },
    [on],
  );

  if (!modelName) return null;

  const content = UIForm ? (
    <UIForm props={{}} bind={{ value: null }} on={{}} context={ctx}>
      {children}
    </UIForm>
  ) : (
    children
  );

  return (
    <FormProvider
      model={modelName}
      id={id}
      mode={resolvedMode}
      onSuccess={handleSuccess}
      onError={handleError}
    >
      {content}
    </FormProvider>
  );
}
