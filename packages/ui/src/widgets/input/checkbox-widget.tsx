import { useState } from 'react';
import { ToggleLeft, Check } from 'lucide-react';
import { Field } from '../../form/field';
import { Icon } from '../../primitives/icon';
import { cn } from '../../lib/cn';
import type { WidgetComponentProps } from '../types';

export function CheckboxWidget({ props, bind, on, context }: WidgetComponentProps) {
  const label = (props.label as string) ?? bind.meta?.label;
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly;

  if (context.mode === 'record') {
    return (
      <RecordFieldCheckbox
        label={label}
        value={!!bind.value}
        readOnly={disabled}
        onSave={(value) => on.saveField?.(value)}
      />
    );
  }

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

function RecordFieldCheckbox({
  label,
  value,
  readOnly,
  onSave,
}: {
  label?: string;
  value: boolean;
  readOnly?: boolean;
  onSave: (value: unknown) => void;
}) {
  const [saving, setSaving] = useState(false);

  const handleClick = () => {
    if (readOnly) return;
    const next = !value;
    setSaving(true);
    onSave(next);
    setTimeout(() => setSaving(false), 600);
  };

  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 px-3 rounded-md transition-all h-[36px]',
        !readOnly && 'hover:bg-accent/50 cursor-pointer',
      )}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2 w-[140px] shrink-0">
        <Icon icon={ToggleLeft} size="sm" className="text-muted-foreground/70 shrink-0" />
        <span className="text-2xs text-muted-foreground truncate">{label}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'size-4 rounded-sm border transition-colors',
            value ? 'bg-primary border-primary' : 'border-border bg-background',
            saving && 'opacity-50',
            readOnly && 'opacity-70',
          )}
        >
          {value && <Icon icon={Check} size="sm" className="text-primary-foreground" />}
        </div>
      </div>
    </div>
  );
}

CheckboxWidget.displayName = 'CheckboxWidget';
