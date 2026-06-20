import React from 'react';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import type { WidgetProps } from '../types.js';

export function InputWidget({ props, bind, on }: WidgetProps) {
  const fieldType = bind.meta?.type ?? 'string';
  const label = (props.label as string) ?? bind.meta?.label ?? '';
  const placeholder = (props.placeholder as string) ?? '';
  const readOnly = (props.readOnly as boolean) ?? bind.meta?.readOnly ?? false;
  const disabled = (props.disabled as boolean) ?? false;
  const min = props.min as number | undefined;
  const max = props.max as number | undefined;
  const step = props.step as number | undefined;
  const pattern = props.pattern as string | undefined;
  const error = bind.error;

  const inputType =
    fieldType === 'int' || fieldType === 'decimal' || fieldType === 'money'
      ? 'number'
      : fieldType === 'date'
        ? 'date'
        : 'text';

  return (
    <Field>
      {label && <FieldLabel>{label}</FieldLabel>}
      <Input
        type={inputType}
        value={(bind.value as string) ?? ''}
        onChange={(e) => {
          bind.setValue?.(e.target.value);
          on.change?.(e.target.value);
        }}
        onFocus={() => on.focus?.()}
        onBlur={() => on.blur?.()}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        pattern={pattern}
      />
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </Field>
  );
}

InputWidget.widgetMeta = {
  name: 'input',
  label: 'Input',
  category: 'input' as const,
  schema: {
    label: { type: 'string' as const },
    placeholder: { type: 'string' as const },
    readOnly: { type: 'boolean' as const, default: false },
    disabled: { type: 'boolean' as const, default: false },
    error: { type: 'string' as const },
    prefix: { type: 'string' as const },
    suffix: { type: 'string' as const },
    min: { type: 'number' as const },
    max: { type: 'number' as const },
    step: { type: 'number' as const },
    pattern: { type: 'string' as const },
  },
  binding: 'field' as const,
  triggers: ['change', 'focus', 'blur'],
  container: false,
};
