import { Field } from '../../form/field';
import { cn } from '../../lib/cn';
import type { WidgetComponentProps } from '../types';

export function CheckboxWidget({ props, bind, on }: WidgetComponentProps) {
  const label = (props.label as string) ?? bind.meta?.label;
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    bind.setValue?.(e.target.checked);
    on.change?.(e.target.checked);
  };

  return (
    <Field orientation="horizontal" data-invalid={!!bind.error || undefined}>
      <input
        type="checkbox"
        checked={!!bind.value}
        onChange={disabled ? undefined : handleChange}
        disabled={disabled}
        className={cn(
          'size-3.5 cursor-pointer rounded-sm border border-border accent-primary',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      />
      {label && <Field.Label>{label}</Field.Label>}
      {bind.error && <Field.Error>{bind.error}</Field.Error>}
    </Field>
  );
}

CheckboxWidget.displayName = 'CheckboxWidget';
