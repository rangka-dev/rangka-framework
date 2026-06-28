import { useState, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { Icon } from '../../primitives/icon';
import { Field } from '../../form/field';
import { Listbox } from '../../form/listbox';
import { useClickOutside } from '../../lib/use-click-outside';
import type { WidgetComponentProps } from '../types';

export function SelectWidget({ props, bind, on }: WidgetComponentProps) {
  const label = (props.label as string) ?? bind.meta?.label;
  const placeholder = (props.placeholder as string) ?? 'Select...';
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly;
  const required = bind.meta?.required;
  const rawOptions =
    (props.options as Array<string | { value: string; label: string }>) ?? bind.meta?.options ?? [];
  const options = rawOptions.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt,
  );

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

SelectWidget.displayName = 'SelectWidget';
