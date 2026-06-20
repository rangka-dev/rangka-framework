import type { WidgetBinding } from '@rangka/shared';
import type { WidgetContext } from '../context/types.js';
import type { StateStore } from '../state/store.js';
import { parse, evaluate } from '../expression/index.js';
import { flattenContext } from '../context/types.js';

export interface FieldMeta {
  type: string;
  label: string;
  required: boolean;
  options?: unknown[];
  readOnly: boolean;
}

export interface BindingResult {
  value: unknown;
  setValue?: (val: unknown) => void;
  meta?: FieldMeta;
  error?: string;
  query?: { name: string; filters?: Record<string, unknown>; limit?: number };
}

export function resolveBinding(
  bind: WidgetBinding | undefined,
  context: WidgetContext,
  fieldMeta?: Record<string, FieldMeta>,
  setValue?: (field: string, val: unknown) => void,
  state?: StateStore,
): BindingResult | null {
  if (!bind) return null;

  if (bind.field) {
    const value = context.record[bind.field];
    const meta = fieldMeta?.[bind.field];
    return {
      value,
      setValue: setValue ? (val: unknown) => setValue(bind.field!, val) : undefined,
      meta,
    };
  }

  if (bind.expression) {
    const flat = flattenContext(context);
    const merged: Record<string, unknown> = { ...flat };
    if (state) {
      merged['$state'] = Object.fromEntries(state.keys().map((k) => [k, state.get(k)]));
    }
    const ast = parse(bind.expression);
    const value = evaluate(ast, merged);
    return { value };
  }

  if (bind.model) {
    return {
      value: null,
      query: bind.model,
    };
  }

  return null;
}
