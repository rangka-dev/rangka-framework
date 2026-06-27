import { useState, useCallback, type ChangeEvent } from 'react';
import { Search } from 'lucide-react';
import { Icon } from '../../primitives/icon';
import { Field } from '../../form/field';
import { Listbox } from '../../form/listbox';
import { useClickOutside } from '../../lib/use-click-outside';
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

LinkWidget.displayName = 'LinkWidget';
