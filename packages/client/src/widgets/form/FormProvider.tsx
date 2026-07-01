import React, { useCallback, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useModelRecord } from '../data/useModelRecord.js';
import { useModelMeta } from '../../data/useModelMeta.js';
import { FormContextProvider } from './FormContext.js';
import { useFormState } from './useFormState.js';
import { useFormValidation } from './useFormValidation.js';
import { useFormSubmit } from './useFormSubmit.js';
import { formRef } from './form-ref.js';
import { apiClient } from '../../api/client.js';
import { modelToPath } from '../../api/paths.js';
import type { FormContextValue } from './FormContext.js';
import type { FieldMeta } from '../binding/resolver.js';

export interface FormProviderProps {
  model: string;
  id?: string | null;
  mode?: 'create' | 'record';
  onSuccess?: (record: Record<string, unknown>, mode: 'create' | 'record') => void;
  onError?: (errors: Record<string, string>, message: string) => void;
  children: React.ReactNode;
}

export function FormProvider({
  model,
  id,
  mode: modeProp,
  onSuccess,
  onError,
  children,
}: FormProviderProps) {
  const mode: 'create' | 'record' = modeProp ?? (id ? 'record' : 'create');

  const queryClient = useQueryClient();
  const { modelMeta } = useModelMeta(model);
  const { data: record } = useModelRecord({
    model,
    id,
    enabled: mode === 'record',
  });

  const validation = useFormValidation(model);
  const formState = useFormState(validation.validateField);
  const { submit } = useFormSubmit({
    model,
    mode,
    id,
    formState,
    validation,
    onSuccess,
    onError,
  });

  useEffect(() => {
    if (mode === 'record' && record) {
      formState.initValues(record);
    }
  }, [record, mode]);

  const reset = useCallback(() => {
    formState.reset(mode);
  }, [formState, mode]);

  const saveField = useCallback(
    async (field: string, value: unknown) => {
      if (mode !== 'record' || !id) return;

      formState.setValue(field, value);

      try {
        const basePath = modelToPath(model);
        const response = await apiClient(`${basePath}/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ [field]: value }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({ message: 'Save failed' }));
          const serverErrors: Record<string, string> = body.errors ?? {};
          const message: string = body.message ?? 'Save failed';
          formState.setErrors(serverErrors);
          onError?.(serverErrors, message);
          return;
        }

        queryClient.invalidateQueries({ queryKey: ['model', model] });
      } catch {
        formState.setErrors({ [field]: 'Save failed' });
      }
    },
    [model, mode, id, formState, queryClient, onError],
  );

  const getFieldMeta = useCallback(
    (field: string): FieldMeta | undefined => {
      if (!modelMeta) return undefined;
      const fieldDef = modelMeta.fields.find((f) => f.name === field);
      if (!fieldDef) return undefined;
      return {
        type: fieldDef.type,
        label: fieldDef.label ?? field,
        required: fieldDef.required ?? false,
        readOnly: false,
        options: fieldDef.options as unknown[] | undefined,
      };
    },
    [modelMeta],
  );

  useEffect(() => {
    formRef.current = { submit, reset };
    return () => {
      formRef.current = null;
    };
  }, [submit, reset]);

  const contextValue: FormContextValue = useMemo(
    () => ({
      mode,
      values: formState.state.values,
      errors: formState.state.errors,
      dirty: formState.getDirtyFields(),
      touched: formState.state.touched,
      submitting: formState.state.submitting,
      getValue: formState.getValue,
      setValue: formState.setValue,
      getError: formState.getError,
      getFieldMeta,
      setTouched: formState.setTouched,
      submit,
      reset,
      isDirty: formState.isDirty,
      saveField,
    }),
    [formState.state, formState, getFieldMeta, submit, reset, mode, saveField],
  );

  return <FormContextProvider value={contextValue}>{children}</FormContextProvider>;
}
