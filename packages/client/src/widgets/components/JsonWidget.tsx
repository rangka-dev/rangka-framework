import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import type { WidgetProps } from '../types.js';

export function JsonWidget({ props, bind, on }: WidgetProps) {
  const label = (props.label as string) ?? bind.meta?.label ?? '';
  const rows = (props.rows as number) ?? 6;
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly ?? false;
  const [error, setError] = useState<string | null>(null);

  const rawValue = bind.value;
  const stringValue =
    typeof rawValue === 'string'
      ? rawValue
      : rawValue != null
        ? JSON.stringify(rawValue, null, 2)
        : '';
  const [localValue, setLocalValue] = useState(stringValue);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setLocalValue(text);
    setError(null);
    on.change?.(text);
  };

  const handleBlur = () => {
    try {
      const parsed = JSON.parse(localValue);
      const formatted = JSON.stringify(parsed, null, 2);
      setLocalValue(formatted);
      bind.setValue?.(parsed);
      setError(null);
    } catch {
      if (localValue.trim() !== '') {
        setError('Invalid JSON');
      }
    }
    on.blur?.();
  };

  return (
    <Field>
      {label && <FieldLabel>{label}</FieldLabel>}
      <Textarea
        value={localValue}
        onChange={handleChange}
        onFocus={() => on.focus?.()}
        onBlur={handleBlur}
        rows={rows}
        disabled={disabled}
        className={cn('font-mono text-xs', error && 'border-destructive')}
        spellCheck={false}
      />
      {error && (
        <p className="text-xs text-destructive mt-1" role="alert">
          {error}
        </p>
      )}
    </Field>
  );
}

JsonWidget.widgetMeta = {
  name: 'json',
  label: 'JSON',
  category: 'input' as const,
  schema: {
    label: { type: 'string' as const },
    rows: { type: 'number' as const, default: 6 },
    disabled: { type: 'boolean' as const, default: false },
  },
  binding: 'field' as const,
  triggers: ['change', 'focus', 'blur'],
  container: false,
};
