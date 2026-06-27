import { useState, useCallback, type ChangeEvent } from 'react';
import { Search, X } from 'lucide-react';
import { Badge } from '../../primitives/badge';
import { Icon } from '../../primitives/icon';
import { Field } from '../../form/field';
import { Listbox } from '../../form/listbox';
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
      <Listbox ref={containerRef}>
        <Listbox.Trigger
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
          placeholder={selectedItems.length === 0}
          className="h-auto min-h-9 flex-wrap gap-1 py-1"
        >
          {selectedItems.map((item) => (
            <Badge key={item.value} variant="secondary" className="gap-1 pr-1">
              {item.label}
              {!disabled && (
                <Icon
                  icon={X}
                  size="sm"
                  className="h-3 w-3 cursor-pointer rounded-full hover:bg-foreground/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(item.value);
                  }}
                />
              )}
            </Badge>
          ))}
          {selectedItems.length === 0 && <Listbox.TriggerValue>{placeholder}</Listbox.TriggerValue>}
          <Listbox.TriggerIcon className="ml-auto">
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
                <Listbox.Item key={opt.value} onClick={() => handleToggle(opt.value)}>
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

ManyToManyWidget.displayName = 'ManyToManyWidget';
