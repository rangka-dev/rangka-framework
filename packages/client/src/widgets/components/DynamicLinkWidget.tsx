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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Field, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import type { WidgetProps } from '../types.js';

export function DynamicLinkWidget({ props, bind, on, context }: WidgetProps) {
  const label = (props.label as string) ?? bind.meta?.label ?? '';
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly ?? false;
  const models = (props.models as string[]) ?? [];
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const options = (bind.meta?.options ?? []) as { label: string; value: string }[];
  const currentValue = bind.value as string | null | undefined;
  const selectedOption = options.find((o) => o.value === currentValue);

  // The model type field name from the dynamicLink config
  const modelField = (props.modelField as string) ?? '';
  const currentModel = (context.record[modelField] as string) ?? '';

  const handleModelChange = (model: string) => {
    // Update the model type field on the record
    on.change?.({ model, value: null });
  };

  const handleRecordSelect = (value: string) => {
    bind.setValue?.(value);
    on.change?.({ model: currentModel, value });
    setOpen(false);
    setSearch('');
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    on.search?.(value);
  };

  return (
    <Field>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="flex gap-2">
        <Select value={currentModel} onValueChange={handleModelChange} disabled={disabled}>
          <SelectTrigger className="w-40 h-7 text-xs">
            <SelectValue placeholder="Model..." />
          </SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled || !currentModel}
              className="flex-1 justify-between font-normal h-7 text-xs"
            >
              {selectedOption ? (
                selectedOption.label
              ) : (
                <span className="text-muted-foreground">Select record...</span>
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
                  {options.map((opt) => (
                    <CommandItem
                      key={opt.value}
                      value={opt.value}
                      onSelect={() => handleRecordSelect(opt.value)}
                      className={cn(opt.value === currentValue && 'bg-accent')}
                    >
                      {opt.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </Field>
  );
}

DynamicLinkWidget.widgetMeta = {
  name: 'dynamic-link',
  label: 'Dynamic Link',
  category: 'input' as const,
  schema: {
    label: { type: 'string' as const },
    modelField: { type: 'string' as const },
    models: { type: 'array' as const },
    disabled: { type: 'boolean' as const, default: false },
  },
  binding: 'field' as const,
  triggers: ['change', 'search'],
  container: false,
};
