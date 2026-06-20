import { useCallback, useMemo } from 'react';
import { useModelMeta } from '../../data/useModelMeta.js';
import type { FieldMeta as BootFieldMeta } from '@rangka/shared';

export interface UseFormValidationResult {
  validateField(field: string, value: unknown): string | undefined;
  validateAll(values: Record<string, unknown>): Record<string, string>;
}

export function useFormValidation(model: string): UseFormValidationResult {
  const { modelMeta } = useModelMeta(model);

  const fieldMap = useMemo(() => {
    if (!modelMeta) return new Map<string, BootFieldMeta>();
    const map = new Map<string, BootFieldMeta>();
    for (const field of modelMeta.fields) {
      map.set(field.name, field);
    }
    return map;
  }, [modelMeta]);

  const validateField = useCallback(
    (field: string, value: unknown): string | undefined => {
      const meta = fieldMap.get(field);
      if (!meta) return undefined;

      if (meta.required && isEmpty(value)) {
        return `${meta.label ?? field} is required`;
      }

      if (meta.type === 'enum' && meta.options && value != null && value !== '') {
        if (!meta.options.includes(String(value))) {
          return `${meta.label ?? field} must be one of: ${meta.options.join(', ')}`;
        }
      }

      return undefined;
    },
    [fieldMap],
  );

  const validateAll = useCallback(
    (values: Record<string, unknown>): Record<string, string> => {
      const errors: Record<string, string> = {};
      for (const [name, meta] of fieldMap) {
        if (meta.relationship) continue;
        const error = validateField(name, values[name]);
        if (error) errors[name] = error;
      }
      return errors;
    },
    [fieldMap, validateField],
  );

  return { validateField, validateAll };
}

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  return false;
}
