import { useState, useRef, useEffect } from 'react';
import { DollarSign, Pencil } from 'lucide-react';
import { MoneyInput } from '../../form/money-input';
import { Input } from '../../primitives/input';
import { Field } from '../../form/field';
import { Icon } from '../../primitives/icon';
import { cn } from '../../lib/cn';
import type { WidgetComponentProps } from '../types';

export function MoneyWidget({ props, bind, on, context }: WidgetComponentProps) {
  const label = (props.label as string) ?? bind.meta?.label;
  const currency = (props.currency as string) ?? '$';
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly;
  const required = bind.meta?.required;

  if (context.mode === 'record') {
    return (
      <RecordFieldMoney
        label={label}
        value={bind.value as number | null}
        currency={currency}
        readOnly={disabled}
        onSave={(value) => on.saveField?.(value)}
      />
    );
  }

  const handleChange = (value: number | null) => {
    bind.setValue?.(value);
    on.change?.(value);
  };

  return (
    <Field data-invalid={!!bind.error || undefined}>
      {label && <Field.Label required={required}>{label}</Field.Label>}
      <MoneyInput
        value={bind.value as number | null | undefined}
        onChange={handleChange}
        currency={currency}
        disabled={disabled}
      />
      {bind.error && <Field.Error>{bind.error}</Field.Error>}
    </Field>
  );
}

function RecordFieldMoney({
  label,
  value,
  currency,
  readOnly,
  onSave,
}: {
  label?: string;
  value: number | null;
  currency: string;
  readOnly?: boolean;
  onSave: (value: unknown) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value != null ? String(value) : '');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleClick = () => {
    if (readOnly) return;
    setEditValue(value != null ? String(value) : '');
    setEditing(true);
  };

  const handleSave = () => {
    const num = editValue === '' ? null : parseFloat(editValue);
    if (num !== value) {
      setSaving(true);
      onSave(num);
      setTimeout(() => setSaving(false), 600);
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value != null ? String(value) : '');
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
        <Icon icon={DollarSign} size="sm" className="text-muted-foreground/70 shrink-0" />
        <span className="text-2xs text-muted-foreground truncate">{label}</span>
      </div>
      <div className="flex-1 min-w-0 relative">
        {editing ? (
          <div className="flex items-center gap-1">
            <span className="text-2xs text-muted-foreground">{currency}</span>
            <Input
              ref={inputRef}
              type="number"
              step="0.01"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
              className="h-6 text-2xs border-0 shadow-none p-0 focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [appearance:textfield]"
            />
          </div>
        ) : (
          <span
            className={cn(
              'text-2xs block truncate font-medium tabular-nums',
              saving && 'opacity-50',
              readOnly && 'text-foreground/70',
            )}
          >
            {value != null ? (
              `${currency}${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
            ) : (
              <span className="text-foreground/30 italic">Empty</span>
            )}
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

MoneyWidget.displayName = 'MoneyWidget';
