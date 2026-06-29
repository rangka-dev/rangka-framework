import React, { useCallback, useEffect, useMemo } from 'react';
import { useModelRecord } from '../data/useModelRecord.js';
import { useModelMeta } from '../../data/useModelMeta.js';
import { FormContextProvider } from './FormContext.js';
import { useFormState } from './useFormState.js';
import { useFormValidation } from './useFormValidation.js';
import { useFormSubmit } from './useFormSubmit.js';
import { formRef } from './form-ref.js';
import type { FormContextValue } from './FormContext.js';
import type { FieldMeta } from '../binding/resolver.js';

export interface FormProviderProps {
  model: string;
  id?: string | null;
  mode?: 'create' | 'edit' | 'view';
  onSuccess?: (record: Record<string, unknown>, mode: 'create' | 'edit') => void;
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
  const mode: 'create' | 'edit' | 'view' = modeProp ?? (id ? 'edit' : 'create');

  const { modelMeta } = useModelMeta(model);
  const { data: record } = useModelRecord({
    model,
    id,
    enabled: mode === 'edit' || mode === 'view',
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
    if ((mode === 'edit' || mode === 'view') && record) {
      formState.initValues(record);
    }
  }, [record, mode]);

  const reset = useCallback(() => {
    formState.reset(mode === 'view' ? 'edit' : mode);
  }, [formState, mode]);

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
    [modelMeta, mode],
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
    }),
    [formState.state, formState, getFieldMeta, submit, reset, mode],
  );

  return <FormContextProvider value={contextValue}>{children}</FormContextProvider>;
}
