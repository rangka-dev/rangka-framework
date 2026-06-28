import { DatePicker } from '../../form/date-picker';
import { Field } from '../../form/field';
import type { WidgetComponentProps } from '../types';

export function DatePickerWidget({ props, bind, on }: WidgetComponentProps) {
  const label = (props.label as string) ?? bind.meta?.label;
  const placeholder = (props.placeholder as string) ?? 'Pick a date...';
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly;
  const required = bind.meta?.required;

  const handleChange = (value: string) => {
    bind.setValue?.(value);
    on.change?.(value);
  };

  return (
    <Field data-invalid={!!bind.error || undefined}>
      {label && <Field.Label required={required}>{label}</Field.Label>}
      <DatePicker
        value={(bind.value as string | null) ?? null}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
      />
      {bind.error && <Field.Error>{bind.error}</Field.Error>}
    </Field>
  );
}

DatePickerWidget.displayName = 'DatePickerWidget';
