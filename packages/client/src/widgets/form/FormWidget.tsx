import React, { useCallback } from 'react';
import type { WidgetProps } from '../types.js';
import { useWidgetContext } from '../hooks/useWidgetContext.js';
import { FormProvider } from './FormProvider.js';

export function FormWidget({ bind, on, children }: WidgetProps) {
  const ctx = useWidgetContext();
  const modelName = ctx.model;
  const id = bind.id ?? undefined;

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

  return (
    <FormProvider model={modelName} id={id} onSuccess={handleSuccess} onError={handleError}>
      {children}
    </FormProvider>
  );
}

FormWidget.widgetMeta = {
  name: 'form',
  label: 'Form',
  category: 'data' as const,
  schema: {},
  binding: 'model' as const,
  triggers: ['success', 'error'],
  container: true,
};
