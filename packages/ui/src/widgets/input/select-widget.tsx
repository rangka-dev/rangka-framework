import { useState, useCallback, useMemo } from 'react';
import { ChevronDown, List, Pencil } from 'lucide-react';
import { Icon } from '../../primitives/icon';
import { Field } from '../../form/field';
import { Badge } from '../../primitives/badge';
import { Listbox } from '../../form/listbox';
import { useClickOutside } from '../../lib/use-click-outside';
import { cn } from '../../lib/cn';
import type { WidgetComponentProps } from '../types';

export function SelectWidget({ props, bind, on, context }: WidgetComponentProps) {
  const label = (props.label as string) ?? bind.meta?.label;
  const placeholder = (props.placeholder as string) ?? 'Select...';
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly;
  const required = bind.meta?.required;
  const rawOptions =
    (props.options as Array<string | { value: string; label: string }>) ?? bind.meta?.options ?? [];
  const options = useMemo(
    () => rawOptions.map((opt) => (typeof opt === 'string' ? { value: opt, label: opt } : opt)),
    [rawOptions],
  );

  if (context.mode === 'record') {
    return (
      <RecordFieldSelect
        label={label}
        value={bind.value as string}
        options={options}
        readOnly={disabled}
        onSave={(value) => on.saveField?.(value)}
      />
    );
  }

  const [open, setOpen] = useState(false);
  const containerRef = useClickOutside<HTMLDivElement>(
    useCallback(() => setOpen(false), []),
    open,
  );

  const selected = options.find((opt) => opt.value === bind.value);

  const handleSelect = (value: string) => {
    bind.setValue?.(value);
    on.change?.(value);
    setOpen(false);
  };

  return (
    <Field data-invalid={!!bind.error || undefined}>
      {label && <Field.Label required={required}>{label}</Field.Label>}
      <Listbox ref={containerRef}>
        <Listbox.Trigger
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
          placeholder={!selected}
        >
          <Listbox.TriggerValue>{selected ? selected.label : placeholder}</Listbox.TriggerValue>
          <Listbox.TriggerIcon>
            <Icon icon={ChevronDown} size="sm" />
          </Listbox.TriggerIcon>
        </Listbox.Trigger>
        {open && (
          <Listbox.Content>
            <Listbox.Items>
              {options.length === 0 && <Listbox.Empty>No options</Listbox.Empty>}
              {options.map((opt) => (
                <Listbox.Item
                  key={opt.value}
                  active={opt.value === bind.value}
                  onClick={() => handleSelect(opt.value)}
                >
                  {opt.label}
                </Listbox.Item>
              ))}
            </Listbox.Items>
          </Listbox.Content>
        )}
      </Listbox>
      {bind.error && <Field.Error>{bind.error}</Field.Error>}
    </Field>
  );
}

function RecordFieldSelect({
  label,
  value,
  options,
  readOnly,
  onSave,
}: {
  label?: string;
  value: string;
  options: { value: string; label: string }[];
  readOnly?: boolean;
  onSave: (value: unknown) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const containerRef = useClickOutside<HTMLDivElement>(
    useCallback(() => setEditing(false), []),
    editing,
  );

  const handleClick = () => {
    if (readOnly) return;
    setEditing(true);
  };

  const handleSelect = (optValue: string) => {
    if (optValue !== value) {
      setSaving(true);
      onSave(optValue);
      setTimeout(() => setSaving(false), 600);
    }
    setEditing(false);
  };

  const selected = options.find((opt) => opt.value === value);

  return (
    <div
      ref={containerRef}
      className={cn(
        'group relative flex items-center gap-3 px-3 rounded-md transition-all h-[36px]',
        !readOnly && !editing && 'hover:bg-accent/50 cursor-pointer',
        editing && 'bg-accent ring-1 ring-border',
      )}
      onClick={!editing ? handleClick : undefined}
    >
      <div className="flex items-center gap-2 w-[140px] shrink-0">
        <Icon icon={List} size="sm" className="text-muted-foreground/70 shrink-0" />
        <span className="text-2xs text-muted-foreground truncate">{label}</span>
      </div>
      <div className="flex-1 min-w-0 relative">
        <span
          className={cn(
            'text-2xs block truncate font-medium',
            saving && 'opacity-50',
            readOnly && 'text-foreground/70',
          )}
        >
          {selected ? (
            <Badge variant="secondary" className="text-2xs">
              {selected.label}
            </Badge>
          ) : (
            <span className="text-foreground/30 italic">Empty</span>
          )}
        </span>
        {editing && (
          <div className="absolute top-full left-0 mt-1 z-50">
            <div className="min-w-[180px] shadow-md border border-border rounded-md bg-popover py-1">
              {options.map((opt) => (
                <div
                  key={opt.value}
                  className={cn(
                    'px-3 py-1.5 text-2xs cursor-pointer transition-colors hover:bg-accent',
                    opt.value === value && 'bg-accent font-medium',
                  )}
                  onClick={() => handleSelect(opt.value)}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </div>
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

SelectWidget.displayName = 'SelectWidget';
