import { createContext, useContext } from 'react';
import type { FieldMeta } from '../binding/resolver.js';

export interface FormContextValue {
  mode: 'create' | 'record';
  values: Record<string, unknown>;
  errors: Record<string, string>;
  dirty: Set<string>;
  touched: Set<string>;
  submitting: boolean;

  getValue(field: string): unknown;
  setValue(field: string, value: unknown): void;
  getError(field: string): string | undefined;
  getFieldMeta(field: string): FieldMeta | undefined;
  setTouched(field: string): void;

  submit(): Promise<void>;
  reset(): void;
  isDirty(): boolean;
  saveField(field: string, value: unknown): Promise<void>;
}

const FormContextReact = createContext<FormContextValue | null>(null);

export const FormContextProvider = FormContextReact.Provider;

export function useFormContext(): FormContextValue | null {
  return useContext(FormContextReact);
}
