import { Checkbox } from '../../primitives/checkbox';
import { Field } from '../../form/field';
import type { WidgetComponentProps } from '../types';

export function CheckboxWidget({ props, bind, on }: WidgetComponentProps) {
  const label = (props.label as string) ?? bind.meta?.label;
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly;

  const handleChange = (checked: boolean) => {
    bind.setValue?.(checked);
    on.change?.(checked);
  };

  return (
    <Field orientation="horizontal" data-invalid={!!bind.error || undefined}>
      <Checkbox
        checked={bind.value as boolean | undefined}
        onCheckedChange={handleChange}
        aria-disabled={disabled}
      />
      {label && <Field.Label>{label}</Field.Label>}
      {bind.error && <Field.Error>{bind.error}</Field.Error>}
    </Field>
  );
}

CheckboxWidget.displayName = 'CheckboxWidget';
