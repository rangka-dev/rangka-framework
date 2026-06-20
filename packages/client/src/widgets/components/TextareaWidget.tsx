import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel } from '@/components/ui/field';
import type { WidgetProps } from '../types.js';

export function TextareaWidget({ props, bind, on }: WidgetProps) {
  const label = (props.label as string) ?? bind.meta?.label ?? '';
  const placeholder = (props.placeholder as string) ?? '';
  const rows = (props.rows as number) ?? 4;
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly ?? false;
  const readOnly = (props.readOnly as boolean) ?? bind.meta?.readOnly ?? false;
  const error = bind.error;

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
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        readOnly={readOnly}
      />
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </Field>
  );
}

TextareaWidget.widgetMeta = {
  name: 'textarea',
  label: 'Textarea',
  category: 'input' as const,
  schema: {
    label: { type: 'string' as const },
    placeholder: { type: 'string' as const },
    rows: { type: 'number' as const, default: 4 },
    disabled: { type: 'boolean' as const, default: false },
    readOnly: { type: 'boolean' as const, default: false },
  },
  binding: 'field' as const,
  triggers: ['change', 'focus', 'blur'],
  container: false,
};
