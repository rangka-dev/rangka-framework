import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import type { WidgetProps } from '../types.js';

export function MoneyWidget({ props, bind, on }: WidgetProps) {
  const label = (props.label as string) ?? bind.meta?.label ?? '';
  const currency = (props.currency as string) ?? '$';
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly ?? false;
  const readOnly = (props.readOnly as boolean) ?? bind.meta?.readOnly ?? false;
  const error = bind.error;

  const rawValue = bind.value as number | null | undefined;
  const [displayValue, setDisplayValue] = useState<string>(
    rawValue != null ? rawValue.toFixed(2) : '',
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setDisplayValue(text);
    const num = parseFloat(text);
    if (!isNaN(num)) {
      bind.setValue?.(num);
      on.change?.(num);
    } else if (text === '') {
      bind.setValue?.(null);
      on.change?.(null);
    }
  };

  const handleFocus = () => {
    on.focus?.();
  };

  const handleBlur = () => {
    const num = parseFloat(displayValue);
    if (!isNaN(num)) {
      setDisplayValue(num.toFixed(2));
    }
    on.blur?.();
  };

  return (
    <Field>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="flex items-center">
        <span className="inline-flex h-8 items-center border border-r-0 border-input bg-muted px-2 text-xs text-muted-foreground">
          {currency}
        </span>
        <Input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          readOnly={readOnly}
          placeholder="0.00"
        />
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </Field>
  );
}

MoneyWidget.widgetMeta = {
  name: 'money',
  label: 'Money',
  category: 'input' as const,
  schema: {
    label: { type: 'string' as const },
    currency: { type: 'string' as const, default: '$' },
    disabled: { type: 'boolean' as const, default: false },
    readOnly: { type: 'boolean' as const, default: false },
  },
  binding: 'field' as const,
  triggers: ['change', 'focus', 'blur'],
  container: false,
};
