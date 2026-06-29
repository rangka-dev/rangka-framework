import { useMemo } from 'react';
import { useWidgetContext } from './useWidgetContext.js';
import { usePageState, useStateVersion } from './usePageState.js';
import { useFormContext } from '../form/FormContext.js';
import { resolveBinding } from '../binding/resolver.js';
import type { WidgetBinding } from '@rangka/shared';
import type { BindingResult, FieldMeta } from '../binding/resolver.js';

export function useBind(
  bind: WidgetBinding | undefined,
  fieldMeta?: Record<string, FieldMeta>,
  setValue?: (field: string, val: unknown) => void,
): BindingResult | null {
  const ctx = useWidgetContext();
  const state = usePageState();
  const stateVersion = useStateVersion();
  const form = useFormContext();

  return useMemo(() => {
    const result = resolveBinding(bind, ctx, fieldMeta, setValue, state);
    if (!result) return result;

    const isViewMode = (ctx.mode === 'view' && !form) || form?.mode === 'view';

    if (bind?.field && form && !isViewMode) {
      const error = form.getError(bind.field);
      return {
        value: form.getValue(bind.field),
        setValue: (val: unknown) => {
          form.setValue(bind.field!, val);
          form.setTouched(bind.field!);
        },
        meta: result.meta ?? form.getFieldMeta(bind.field),
        error,
      };
    }

    if (bind?.field && form && isViewMode) {
      return {
        value: form.getValue(bind.field),
        setValue: undefined,
        meta: {
          ...(result.meta ??
            form.getFieldMeta(bind.field) ?? {
              type: 'string',
              label: '',
              required: false,
              readOnly: true,
            }),
          readOnly: true,
        },
        error: undefined,
      };
    }

    if (isViewMode) {
      const meta = result.meta ?? { type: 'string', label: '', required: false, readOnly: true };
      return { ...result, meta: { ...meta, readOnly: true } };
    }

    return result;
  }, [bind, ctx, fieldMeta, setValue, state, stateVersion, form, form?.errors, form?.touched]);
}
