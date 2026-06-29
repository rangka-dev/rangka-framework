import { useState } from 'react';
import { Textarea } from '../../primitives/textarea';
import { Field } from '../../form/field';
import type { WidgetComponentProps } from '../types';

export function JsonWidget({ props, bind, on }: WidgetComponentProps) {
  const label = (props.label as string) ?? bind.meta?.label;
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly;
  const required = bind.meta?.required;
  const rows = (props.rows as number) ?? 8;

  const [text, setText] = useState(() =>
    bind.value != null ? JSON.stringify(bind.value, null, 2) : '',
  );
  const [parseError, setParseError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setParseError(null);
  };

  const handleBlur = () => {
    if (text.trim() === '') {
      bind.setValue?.(null);
      on.change?.(null);
      return;
    }
    try {
      const parsed = JSON.parse(text);
      setText(JSON.stringify(parsed, null, 2));
      bind.setValue?.(parsed);
      on.change?.(parsed);
      setParseError(null);
    } catch {
      setParseError('Invalid JSON');
    }
  };

  return (
    <Field data-invalid={!!(bind.error || parseError) || undefined}>
      {label && <Field.Label required={required}>{label}</Field.Label>}
      <Textarea
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        rows={rows}
        spellCheck={false}
        className="font-mono text-2xs"
      />
      {(bind.error || parseError) && <Field.Error>{bind.error || parseError}</Field.Error>}
    </Field>
  );
}

JsonWidget.displayName = 'JsonWidget';
