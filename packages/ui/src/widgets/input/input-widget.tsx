import { Input } from '../../primitives/input';
import { Field } from '../../form/field';
import type { WidgetComponentProps } from '../types';

export function InputWidget({ props, bind, on }: WidgetComponentProps) {
  const label = (props.label as string) ?? bind.meta?.label;
  const placeholder = props.placeholder as string | undefined;
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly;
  const required = bind.meta?.required;

  const inputType = resolveInputType(bind.meta?.type);
  const step = bind.meta?.type === 'decimal' || bind.meta?.type === 'money' ? '0.01' : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    let value: unknown = raw;

    if (bind.meta?.type === 'int') value = raw === '' ? null : parseInt(raw, 10);
    else if (bind.meta?.type === 'decimal' || bind.meta?.type === 'money')
      value = raw === '' ? null : parseFloat(raw);

    bind.setValue?.(value);
    on.change?.(value);
  };

  return (
    <Field data-invalid={!!bind.error || undefined}>
      {label && <Field.Label required={required}>{label}</Field.Label>}
      <Input
        type={inputType}
        step={step}
        value={bind.value != null ? String(bind.value) : ''}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={bind.meta?.readOnly}
        className={
          inputType === 'number'
            ? '[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]'
            : undefined
        }
      />
      {bind.error && <Field.Error>{bind.error}</Field.Error>}
    </Field>
  );
}

function resolveInputType(fieldType?: string): string {
  switch (fieldType) {
    case 'int':
    case 'decimal':
    case 'money':
      return 'number';
    case 'date':
      return 'date';
    default:
      return 'text';
  }
}

InputWidget.displayName = 'InputWidget';
