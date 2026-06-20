import React from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Field, FieldLabel } from '@/components/ui/field';
import type { WidgetProps } from '../types.js';

export function SelectWidget({ props, bind, on }: WidgetProps) {
  const label = (props.label as string) ?? bind.meta?.label ?? '';
  const placeholder = (props.placeholder as string) ?? '';
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly ?? false;
  const error = bind.error;

  const rawOptions = (bind.meta?.options ?? []) as (string | { label: string; value: string })[];
  const options = rawOptions.map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt,
  );

  return (
    <Field>
      {label && <FieldLabel>{label}</FieldLabel>}
      <Select
        value={(bind.value as string) ?? ''}
        onValueChange={(val) => {
          bind.setValue?.(val);
          on.change?.(val);
        }}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </Field>
  );
}

SelectWidget.widgetMeta = {
  name: 'select',
  label: 'Select',
  category: 'input' as const,
  schema: {
    label: { type: 'string' as const },
    placeholder: { type: 'string' as const },
    searchable: { type: 'boolean' as const, default: false },
    disabled: { type: 'boolean' as const, default: false },
  },
  binding: 'field' as const,
  triggers: ['change'],
  container: false,
};
