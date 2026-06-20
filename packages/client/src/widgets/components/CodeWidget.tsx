import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel } from '@/components/ui/field';
import type { WidgetProps } from '../types.js';

export function CodeWidget({ props, bind, on }: WidgetProps) {
  const label = (props.label as string) ?? bind.meta?.label ?? '';
  const rows = (props.rows as number) ?? 6;
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly ?? false;

  return (
    <Field>
      {label && <FieldLabel>{label}</FieldLabel>}
      <Textarea
        value={(bind.value as string) ?? ''}
        onChange={(e) => {
          bind.setValue?.(e.target.value);
          on.change?.(e.target.value);
        }}
        onFocus={() => on.focus?.()}
        onBlur={() => on.blur?.()}
        rows={rows}
        disabled={disabled}
        className="font-mono text-xs"
        spellCheck={false}
      />
    </Field>
  );
}

CodeWidget.widgetMeta = {
  name: 'code',
  label: 'Code',
  category: 'input' as const,
  schema: {
    label: { type: 'string' as const },
    language: { type: 'string' as const },
    rows: { type: 'number' as const, default: 6 },
    disabled: { type: 'boolean' as const, default: false },
  },
  binding: 'field' as const,
  triggers: ['change', 'focus', 'blur'],
  container: false,
};
