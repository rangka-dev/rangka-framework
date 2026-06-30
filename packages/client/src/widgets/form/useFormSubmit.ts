import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client.js';
import { modelToPath } from '../../api/paths.js';
import type { UseFormStateResult } from './useFormState.js';
import type { UseFormValidationResult } from './useFormValidation.js';

export interface UseFormSubmitOptions {
  model: string;
  mode: 'create' | 'record';
  id: string | null | undefined;
  formState: UseFormStateResult;
  validation: UseFormValidationResult;
  onSuccess?: (record: Record<string, unknown>, mode: 'create' | 'record') => void;
  onError?: (errors: Record<string, string>, message: string) => void;
}

export interface UseFormSubmitResult {
  submit(): Promise<void>;
}

export function useFormSubmit(options: UseFormSubmitOptions): UseFormSubmitResult {
  const { model, mode, id, formState, validation, onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const submit = useCallback(async () => {
    const { state, setErrors, setSubmitting, getDirtyFields, initValues } = formState;
    const { values } = state;

    const errors = validation.validateAll(values);
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      for (const field of Object.keys(errors)) {
        formState.setTouched(field);
      }
      return;
    }

    setSubmitting(true);

    try {
      const basePath = modelToPath(model);
      let payload: Record<string, unknown>;

      if (mode === 'record') {
        const dirty = getDirtyFields();
        payload = {};
        for (const field of dirty) {
          payload[field] = values[field];
        }
      } else {
        payload = {};
        for (const [key, value] of Object.entries(values)) {
          if (value !== null && value !== undefined && value !== '') {
            payload[key] = value;
          }
        }
      }

      const url = mode === 'record' ? `${basePath}/${id}` : basePath;
      const method = mode === 'record' ? 'PUT' : 'POST';

      const response = await apiClient(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: 'Submit failed' }));
        const serverErrors: Record<string, string> = body.errors ?? {};
        const message: string = body.message ?? 'Submit failed';
        setErrors(serverErrors);
        onError?.(serverErrors, message);
        return;
      }

      const body = await response.json();
      const record = body.data ?? body;
      queryClient.invalidateQueries({ queryKey: ['model', model] });
      initValues(record);
      onSuccess?.(record, mode);
    } finally {
      setSubmitting(false);
    }
  }, [model, mode, id, formState, validation, onSuccess, onError, queryClient]);

  return { submit };
}
