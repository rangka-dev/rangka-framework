import React from 'react';
import { Field, FieldLabel } from '@/components/ui/field';
import type { WidgetProps } from '../types.js';

export function ComputedWidget({ props, bind }: WidgetProps) {
  const label = (props.label as string) ?? bind.meta?.label ?? '';
  const format = (props.format as string) ?? 'text';
  const value = bind.value;

  const formatValue = (val: unknown): string => {
    if (val == null) return '—';
    if (format === 'number' && typeof val === 'number') {
      return val.toLocaleString();
    }
    if (format === 'currency' && typeof val === 'number') {
      return val.toFixed(2);
    }
    if (format === 'date' && typeof val === 'string') {
      return new Date(val).toLocaleDateString();
    }
    return String(val);
  };

  return (
    <Field>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="flex items-center h-7 text-sm" data-testid="computed-value">
        {formatValue(value)}
      </div>
    </Field>
  );
}

ComputedWidget.widgetMeta = {
  name: 'computed',
  label: 'Computed',
  category: 'display' as const,
  schema: {
    label: { type: 'string' as const },
    format: {
      type: 'enum' as const,
      options: ['text', 'number', 'currency', 'date'],
      default: 'text',
    },
  },
  binding: 'field' as const,
  triggers: [],
  container: false,
};
