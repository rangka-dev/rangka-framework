import { useCallback } from 'react';
import type { WidgetProps } from '../types.js';
import { useWidgetContext } from '../hooks/useWidgetContext.js';
import { useWidgetComponent } from '../../ui/UIProvider.js';
import { FormProvider } from '../form/FormProvider.js';

export function FormController({ bind, on, children }: WidgetProps) {
  const ctx = useWidgetContext();
  const modelName = ctx.model;
  const id = bind.id ?? undefined;
  const UIForm = useWidgetComponent('form');

  const handleSuccess = useCallback(
    (record: Record<string, unknown>, mode: 'create' | 'edit') => {
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
    <FormProvider model={modelName} id={id} onSuccess={handleSuccess} onError={handleError}>
      {content}
    </FormProvider>
  );
}
