import React, { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import type { WidgetProps } from '../types.js';

export function TreeWidget({ props, bind, on }: WidgetProps) {
  const label = (props.label as string) ?? bind.meta?.label ?? '';
  const placeholder = (props.placeholder as string) ?? 'Select parent...';
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly ?? false;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const options = (bind.meta?.options ?? []) as { label: string; value: string; path?: string }[];
  const currentValue = bind.value as string | null | undefined;
  const selectedOption = options.find((o) => o.value === currentValue);

  const handleSelect = (value: string) => {
    bind.setValue?.(value);
    on.change?.(value);
    setOpen(false);
    setSearch('');
  };

  const handleClear = () => {
    bind.setValue?.(null);
    on.change?.(null);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    on.search?.(value);
  };

  return (
    <Field>
      {label && <FieldLabel>{label}</FieldLabel>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal h-7 text-xs"
          >
            {selectedOption ? (
              <span className="truncate">{selectedOption.path ?? selectedOption.label}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search..."
              value={search}
              onValueChange={handleSearchChange}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {currentValue && (
                  <CommandItem value="" onSelect={handleClear} className="text-muted-foreground">
                    Clear selection
                  </CommandItem>
                )}
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={() => handleSelect(opt.value)}
                    className={cn(opt.value === currentValue && 'bg-accent')}
                  >
                    <span className="truncate">{opt.path ?? opt.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </Field>
  );
}

TreeWidget.widgetMeta = {
  name: 'tree',
  label: 'Tree',
  category: 'input' as const,
  schema: {
    label: { type: 'string' as const },
    placeholder: { type: 'string' as const },
    disabled: { type: 'boolean' as const, default: false },
  },
  binding: 'field' as const,
  triggers: ['change', 'search'],
  container: false,
};
