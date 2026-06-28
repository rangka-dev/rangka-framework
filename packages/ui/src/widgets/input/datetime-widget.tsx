import { DateTimePicker } from '../../form/date-time-picker';
import { Field } from '../../form/field';
import type { WidgetComponentProps } from '../types';

export function DateTimeWidget({ props, bind, on }: WidgetComponentProps) {
  const label = (props.label as string) ?? bind.meta?.label;
  const placeholder = (props.placeholder as string) ?? 'Pick date and time...';
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly;
  const required = bind.meta?.required;

  const handleChange = (value: string) => {
    bind.setValue?.(value);
    on.change?.(value);
  };

  return (
    <Field data-invalid={!!bind.error || undefined}>
      {label && <Field.Label required={required}>{label}</Field.Label>}
      <DateTimePicker
        value={(bind.value as string | null) ?? null}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
      />
      {bind.error && <Field.Error>{bind.error}</Field.Error>}
    </Field>
  );
}

DateTimeWidget.displayName = 'DateTimeWidget';
