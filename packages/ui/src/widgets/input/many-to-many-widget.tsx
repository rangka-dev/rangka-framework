import { useState, useCallback, type ChangeEvent } from 'react';
import { Search, X } from 'lucide-react';
import { Badge } from '../../primitives/badge';
import { Icon } from '../../primitives/icon';
import { Field } from '../../form/field';
import { cn } from '../../lib/cn';
import { useClickOutside } from '../../lib/use-click-outside';
import type { WidgetComponentProps } from '../types';

export function ManyToManyWidget({ props, bind, on }: WidgetComponentProps) {
  const label = (props.label as string) ?? bind.meta?.label;
  const placeholder = (props.placeholder as string) ?? 'Select items...';
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly;
  const required = bind.meta?.required;
  const options =
    (props.options as Array<{ value: string; label: string }>) ?? bind.meta?.options ?? [];

  const selectedValues = (bind.value as string[]) ?? [];
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useClickOutside<HTMLDivElement>(
    useCallback(() => setOpen(false), []),
    open,
  );

  const filtered = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) && !selectedValues.includes(opt.value),
  );

  const selectedItems = options.filter((opt) => selectedValues.includes(opt.value));

  const handleToggle = (value: string) => {
    const next = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    bind.setValue?.(next);
    on.change?.(next);
  };

  const handleRemove = (value: string) => {
    const next = selectedValues.filter((v) => v !== value);
    bind.setValue?.(next);
    on.change?.(next);
  };

  return (
    <Field data-invalid={!!bind.error || undefined}>
      {label && <Field.Label required={required}>{label}</Field.Label>}
      <div className="relative" ref={containerRef}>
        <div
          className={cn(
            'flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border border-border bg-transparent px-2 py-1',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          {selectedItems.map((item) => (
            <Badge key={item.value} variant="secondary" className="gap-1 pr-1">
              {item.label}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(item.value)}
                  className="rounded-full p-0.5 hover:bg-foreground/10"
                >
                  <Icon icon={X} size="sm" />
                </button>
              )}
            </Badge>
          ))}
          {!disabled && (
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="flex h-7 flex-1 items-center gap-1 px-1 text-2xs text-muted-foreground"
            >
              {selectedItems.length === 0 && <span>{placeholder}</span>}
              <Icon icon={Search} size="sm" className="ml-auto" />
            </button>
          )}
        </div>
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
                  onClick={() => handleToggle(opt.value)}
                  className="flex w-full items-center rounded-sm px-3 py-1.5 text-2xs cursor-pointer hover:bg-foreground/6"
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

ManyToManyWidget.displayName = 'ManyToManyWidget';
