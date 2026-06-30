import { useState, useCallback } from 'react';
import { Link2, Search, Pencil } from 'lucide-react';
import { Icon } from '../../primitives/icon';
import { Field } from '../../form/field';
import { Listbox } from '../../form/listbox';
import { useClickOutside } from '../../lib/use-click-outside';
import { cn } from '../../lib/cn';
import type { WidgetComponentProps } from '../types';
import type { ChangeEvent } from 'react';

export function LinkWidget({ props, bind, on, context }: WidgetComponentProps) {
  const label = (props.label as string) ?? bind.meta?.label;
  const placeholder = (props.placeholder as string) ?? 'Search...';
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly;
  const required = bind.meta?.required;
  const options =
    (props.options as Array<{ value: string; label: string }>) ?? bind.meta?.options ?? [];

  if (context.mode === 'record') {
    return (
      <RecordFieldLink
        label={label}
        value={bind.value as string}
        options={options}
        readOnly={disabled}
        onSave={(value) => on.saveField?.(value)}
      />
    );
  }

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useClickOutside<HTMLDivElement>(
    useCallback(() => setOpen(false), []),
    open,
  );

  const filtered = options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()));

  const selected = options.find((opt) => opt.value === bind.value);

  const handleSelect = (value: string) => {
    bind.setValue?.(value);
    on.change?.(value);
    setOpen(false);
    setSearch('');
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
            <Icon icon={Search} size="sm" />
          </Listbox.TriggerIcon>
        </Listbox.Trigger>
        {open && (
          <Listbox.Content>
            <Listbox.Search
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Search..."
            />
            <Listbox.Items>
              {filtered.length === 0 && <Listbox.Empty />}
              {filtered.map((opt) => (
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

function RecordFieldLink({
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
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const containerRef = useClickOutside<HTMLDivElement>(
    useCallback(() => setEditing(false), []),
    editing,
  );

  const handleClick = () => {
    if (readOnly) return;
    setSearch('');
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
  const filtered = options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()));

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
        <Icon icon={Link2} size="sm" className="text-muted-foreground/70 shrink-0" />
        <span className="text-2xs text-muted-foreground truncate">{label}</span>
      </div>
      <div className="flex-1 min-w-0 relative">
        <span
          className={cn(
            'text-2xs block truncate font-medium text-primary',
            saving && 'opacity-50',
            readOnly && 'text-foreground/70',
          )}
        >
          {selected?.label ?? (value || <span className="text-foreground/30 italic">Empty</span>)}
        </span>
        {editing && (
          <div className="absolute top-full left-0 mt-1 z-50" onClick={(e) => e.stopPropagation()}>
            <div className="min-w-[220px] shadow-md border border-border rounded-md bg-popover">
              <div className="px-2 py-1.5 border-b border-border">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-accent/50">
                  <Icon icon={Search} size="sm" className="text-muted-foreground shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setEditing(false);
                    }}
                    placeholder="Search..."
                    className="flex-1 bg-transparent text-2xs outline-none placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>
              <div className="py-1 max-h-[200px] overflow-y-auto">
                {filtered.length === 0 && (
                  <div className="px-3 py-2 text-2xs text-muted-foreground">No results</div>
                )}
                {filtered.map((opt) => (
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

LinkWidget.displayName = 'LinkWidget';
