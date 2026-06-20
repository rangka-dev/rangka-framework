import { useCallback, useRef, useState } from 'react';

export interface FormState {
  values: Record<string, unknown>;
  original: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Set<string>;
  submitting: boolean;
}

export interface UseFormStateResult {
  state: FormState;
  getValue(field: string): unknown;
  setValue(field: string, value: unknown): void;
  getError(field: string): string | undefined;
  setTouched(field: string): void;
  setErrors(errors: Record<string, string>): void;
  setSubmitting(submitting: boolean): void;
  isDirty(): boolean;
  getDirtyFields(): Set<string>;
  reset(mode: 'create' | 'edit'): void;
  initValues(record: Record<string, unknown>): void;
}

export function useFormState(
  onValidateField?: (field: string, value: unknown) => string | undefined,
): UseFormStateResult {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [original, setOriginal] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const valuesRef = useRef(values);
  valuesRef.current = values;
  const originalRef = useRef(original);
  originalRef.current = original;

  const getValue = useCallback((field: string): unknown => {
    return valuesRef.current[field];
  }, []);

  const setValue = useCallback(
    (field: string, value: unknown) => {
      setValues((prev) => ({ ...prev, [field]: value }));

      if (onValidateField) {
        const error = onValidateField(field, value);
        setErrors((prev) => {
          if (error) return { ...prev, [field]: error };
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [onValidateField],
  );

  const getError = useCallback(
    (field: string): string | undefined => {
      return errors[field];
    },
    [errors],
  );

  const markTouched = useCallback((field: string) => {
    setTouched((prev) => {
      if (prev.has(field)) return prev;
      const next = new Set(prev);
      next.add(field);
      return next;
    });
  }, []);

  const setErrorsBatch = useCallback((errs: Record<string, string>) => {
    setErrors(errs);
  }, []);

  const isDirty = useCallback((): boolean => {
    for (const key of Object.keys(valuesRef.current)) {
      if (valuesRef.current[key] !== originalRef.current[key]) return true;
    }
    return false;
  }, []);

  const getDirtyFields = useCallback((): Set<string> => {
    const dirty = new Set<string>();
    for (const key of Object.keys(valuesRef.current)) {
      if (valuesRef.current[key] !== originalRef.current[key]) {
        dirty.add(key);
      }
    }
    return dirty;
  }, []);

  const reset = useCallback((mode: 'create' | 'edit') => {
    if (mode === 'edit') {
      setValues({ ...originalRef.current });
    } else {
      setValues({});
    }
    setErrors({});
    setTouched(new Set());
  }, []);

  const initValues = useCallback((record: Record<string, unknown>) => {
    setValues({ ...record });
    setOriginal({ ...record });
    setErrors({});
    setTouched(new Set());
  }, []);

  return {
    state: { values, original, errors, touched, submitting },
    getValue,
    setValue,
    getError,
    setTouched: markTouched,
    setErrors: setErrorsBatch,
    setSubmitting,
    isDirty,
    getDirtyFields,
    reset,
    initValues,
  };
}
