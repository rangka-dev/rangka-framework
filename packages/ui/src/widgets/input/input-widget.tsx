import { useState, useRef, useEffect } from 'react';
import { Input } from '../../primitives/input';
import { Field } from '../../form/field';
import { Icon } from '../../primitives/icon';
import { Type, Hash, Pencil } from 'lucide-react';
import { cn } from '../../lib/cn';
import type { WidgetComponentProps } from '../types';

export function InputWidget({ props, bind, on, context }: WidgetComponentProps) {
  const label = (props.label as string) ?? bind.meta?.label;
  const placeholder = props.placeholder as string | undefined;
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly;
  const required = bind.meta?.required;

  const inputType = resolveInputType(bind.meta?.type);
  const step = bind.meta?.type === 'decimal' || bind.meta?.type === 'money' ? '0.01' : undefined;

  if (context.mode === 'record') {
    return (
      <RecordFieldInput
        label={label}
        value={bind.value}
        fieldType={bind.meta?.type}
        readOnly={disabled}
        onSave={(value) => on.saveField?.(value)}
      />
    );
  }

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

function RecordFieldInput({
  label,
  value,
  fieldType,
  readOnly,
  onSave,
}: {
  label?: string;
  value: unknown;
  fieldType?: string;
  readOnly?: boolean;
  onSave: (value: unknown) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleClick = () => {
    if (readOnly) return;
    setEditValue(value);
    setEditing(true);
  };

  const handleSave = () => {
    if (editValue !== value) {
      setSaving(true);
      onSave(parseValue(editValue, fieldType));
      setTimeout(() => setSaving(false), 600);
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  const fieldIcon = getFieldIcon(fieldType);

  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 px-3 rounded-md transition-all h-[36px]',
        !readOnly && !editing && 'hover:bg-accent/50 cursor-pointer',
        editing && 'bg-accent ring-1 ring-border',
      )}
      onClick={!editing ? handleClick : undefined}
    >
      <div className="flex items-center gap-2 w-[140px] shrink-0">
        <Icon icon={fieldIcon} size="sm" className="text-muted-foreground/70 shrink-0" />
        <span className="text-2xs text-muted-foreground truncate">{label}</span>
      </div>
      <div className="flex-1 min-w-0 relative">
        {editing ? (
          <Input
            ref={inputRef}
            type={resolveInputType(fieldType)}
            step={fieldType === 'decimal' ? '0.01' : undefined}
            value={editValue != null ? String(editValue) : ''}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="h-6 text-2xs border-0 shadow-none p-0 focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [appearance:textfield]"
          />
        ) : (
          <span
            className={cn(
              'text-2xs block truncate font-medium',
              saving && 'opacity-50',
              readOnly && 'text-foreground/70',
            )}
          >
            {formatValue(value, fieldType)}
          </span>
        )}
      </div>
      {!readOnly && !editing && (
        <Icon
          icon={Pencil}
          size="sm"
          className="absolute right-2 opacity-0 group-hover:opacity-50 transition-opacity text-muted-foreground"
        />
      )}
    </div>
  );
}

function formatValue(value: unknown, fieldType?: string): React.ReactNode {
  if (value == null || value === '')
    return <span className="text-foreground/30 italic">Empty</span>;
  switch (fieldType) {
    case 'int':
      return <span className="tabular-nums">{Number(value).toLocaleString()}</span>;
    case 'decimal':
      return (
        <span className="tabular-nums">
          {Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      );
    default:
      return String(value);
  }
}

function parseValue(value: unknown, fieldType?: string): unknown {
  if (value === '' || value == null) return null;
  const str = String(value);
  if (fieldType === 'int') return parseInt(str, 10);
  if (fieldType === 'decimal') return parseFloat(str);
  return str;
}

function getFieldIcon(fieldType?: string) {
  switch (fieldType) {
    case 'int':
    case 'decimal':
      return Hash;
    default:
      return Type;
  }
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
