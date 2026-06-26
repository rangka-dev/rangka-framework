import { MoneyInput } from '../../form/money-input';
import { Field } from '../../form/field';
import type { WidgetComponentProps } from '../types';

export function MoneyWidget({ props, bind, on }: WidgetComponentProps) {
  const label = (props.label as string) ?? bind.meta?.label;
  const currency = (props.currency as string) ?? '$';
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly;
  const required = bind.meta?.required;

  const handleChange = (value: number | null) => {
    bind.setValue?.(value);
    on.change?.(value);
  };

  return (
    <Field data-invalid={!!bind.error || undefined}>
      {label && <Field.Label required={required}>{label}</Field.Label>}
      <MoneyInput
        value={bind.value as number | null | undefined}
        onChange={handleChange}
        currency={currency}
        disabled={disabled}
      />
      {bind.error && <Field.Error>{bind.error}</Field.Error>}
    </Field>
  );
}

MoneyWidget.displayName = 'MoneyWidget';
