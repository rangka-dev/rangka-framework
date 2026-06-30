import { useState, useRef, useEffect } from 'react';
import { FileText, Pencil } from 'lucide-react';
import { Textarea } from '../../primitives/textarea';
import { Input } from '../../primitives/input';
import { Field } from '../../form/field';
import { Icon } from '../../primitives/icon';
import { cn } from '../../lib/cn';
import type { WidgetComponentProps } from '../types';

export function TextareaWidget({ props, bind, on, context }: WidgetComponentProps) {
  const label = (props.label as string) ?? bind.meta?.label;
  const placeholder = props.placeholder as string | undefined;
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly;
  const required = bind.meta?.required;
  const rows = (props.rows as number) ?? 3;

  if (context.mode === 'record') {
    return (
      <RecordFieldTextarea
        label={label}
        value={bind.value as string | null}
        readOnly={disabled}
        onSave={(value) => on.saveField?.(value)}
      />
    );
  }

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
      />
      {bind.error && <Field.Error>{bind.error}</Field.Error>}
    </Field>
  );
}

function RecordFieldTextarea({
  label,
  value,
  readOnly,
  onSave,
}: {
  label?: string;
  value: string | null;
  readOnly?: boolean;
  onSave: (value: unknown) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value ?? '');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleClick = () => {
    if (readOnly) return;
    setEditValue(value ?? '');
    setEditing(true);
  };

  const handleSave = () => {
    const saveVal = editValue || null;
    if (saveVal !== value) {
      setSaving(true);
      onSave(saveVal);
      setTimeout(() => setSaving(false), 600);
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value ?? '');
    setEditing(false);
  };

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
        <Icon icon={FileText} size="sm" className="text-muted-foreground/70 shrink-0" />
        <span className="text-2xs text-muted-foreground truncate">{label}</span>
      </div>
      <div className="flex-1 min-w-0 relative">
        {editing ? (
          <Input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            className="h-6 text-2xs border-0 shadow-none p-0 focus-visible:ring-0"
          />
        ) : (
          <span
            className={cn(
              'text-2xs block truncate font-medium',
              saving && 'opacity-50',
              readOnly && 'text-foreground/70',
            )}
          >
            {value ? String(value) : <span className="text-foreground/30 italic">Empty</span>}
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

TextareaWidget.displayName = 'TextareaWidget';
