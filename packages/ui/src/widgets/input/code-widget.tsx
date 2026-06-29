import { Textarea } from '../../primitives/textarea';
import { Field } from '../../form/field';
import type { WidgetComponentProps } from '../types';

export function CodeWidget({ props, bind, on }: WidgetComponentProps) {
  const label = (props.label as string) ?? bind.meta?.label;
  const placeholder = props.placeholder as string | undefined;
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly;
  const required = bind.meta?.required;
  const rows = (props.rows as number) ?? 8;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    bind.setValue?.(e.target.value);
    on.change?.(e.target.value);
  };

  return (
    <Field data-invalid={!!bind.error || undefined}>
      {label && <Field.Label required={required}>{label}</Field.Label>}
      <Textarea
        value={bind.value != null ? String(bind.value) : ''}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        spellCheck={false}
        className="font-mono text-2xs"
      />
      {bind.error && <Field.Error>{bind.error}</Field.Error>}
    </Field>
  );
}

CodeWidget.displayName = 'CodeWidget';
