import { useMemo } from 'react';
import { TextEditor } from './text-editor';
import { SelectEditor } from './select-editor';
import { CheckboxEditor } from './checkbox-editor';
import { DateEditor } from './date-editor';
import { DateTimeEditor } from './datetime-editor';
import { LinkEditor } from './link-editor';
import type { WidgetComponentProps } from '../types';

export function FieldWidget({ props, bind, on }: WidgetComponentProps) {
  const label = (props.label as string) ?? bind.meta?.label;
  const fieldType = bind.meta?.type;
  const readOnly = bind.meta?.readOnly;
  const onSave = (value: unknown) => on.saveField?.(value);

  const options = useMemo(() => {
    const raw = bind.meta?.options as Array<string | { value: string; label: string }> | undefined;
    if (!raw) return [];
    return raw.map((opt) => (typeof opt === 'string' ? { value: opt, label: opt } : opt));
  }, [bind.meta?.options]);

  switch (fieldType) {
    case 'boolean':
      return (
        <CheckboxEditor label={label} value={!!bind.value} readOnly={readOnly} onSave={onSave} />
      );

    case 'enum':
      return (
        <SelectEditor
          label={label}
          value={(bind.value as string) ?? ''}
          options={options}
          readOnly={readOnly}
          onSave={onSave}
        />
      );

    case 'date':
      return (
        <DateEditor
          label={label}
          value={(bind.value as string | null) ?? null}
          readOnly={readOnly}
          onSave={onSave}
        />
      );

    case 'datetime':
      return (
        <DateTimeEditor
          label={label}
          value={(bind.value as string | null) ?? null}
          readOnly={readOnly}
          onSave={onSave}
        />
      );

    case 'link':
      return (
        <LinkEditor
          label={label}
          value={bind.value}
          options={options}
          readOnly={readOnly}
          onSave={onSave}
        />
      );

    case 'string':
    case 'int':
    case 'decimal':
    case 'money':
    case 'text':
    default:
      return (
        <TextEditor
          label={label}
          value={bind.value}
          fieldType={fieldType}
          readOnly={readOnly}
          onSave={onSave}
        />
      );
  }
}

FieldWidget.displayName = 'FieldWidget';
