import { useState, type ChangeEvent } from 'react';
import { Search } from 'lucide-react';
import { Icon } from '../../primitives/icon';
import { Field } from '../../form/field';
import { cn } from '../../lib/cn';
import type { WidgetComponentProps } from '../types';

export function LinkWidget({ props, bind, on }: WidgetComponentProps) {
  const label = (props.label as string) ?? bind.meta?.label;
  const placeholder = (props.placeholder as string) ?? 'Search...';
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly;
  const required = bind.meta?.required;
  const options =
    (props.options as Array<{ value: string; label: string }>) ?? bind.meta?.options ?? [];

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

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
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
          className={cn(
            'flex h-9 w-full items-center rounded-md border border-border bg-transparent px-3 text-body',
            'focus-visible:outline-none',
            disabled && 'cursor-not-allowed opacity-50',
            !selected && 'text-muted-foreground',
          )}
        >
          <span className="flex-1 text-left truncate">
            {selected ? selected.label : placeholder}
          </span>
          <Icon icon={Search} size="sm" className="text-muted-foreground" />
        </button>
        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-surface shadow-md">
            <div className="p-2">
              <input
                value={search}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                placeholder="Search..."
                autoFocus
                className="flex h-8 w-full rounded-md border border-border bg-transparent px-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
              />
            </div>
            <div className="max-h-48 overflow-auto p-1">
              {filtered.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">No results</div>
              )}
              {filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    'flex w-full items-center rounded-sm px-3 py-1.5 text-body cursor-pointer',
                    'hover:bg-foreground/6',
                    opt.value === bind.value && 'bg-foreground/6 font-medium',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {bind.error && <Field.Error>{bind.error}</Field.Error>}
    </Field>
  );
}

LinkWidget.displayName = 'LinkWidget';
