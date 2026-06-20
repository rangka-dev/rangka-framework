import React, { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldLabel } from '@/components/ui/field';
import { CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { WidgetProps } from '../types.js';

export function DatePickerWidget({ props, bind, on }: WidgetProps) {
  const label = (props.label as string) ?? bind.meta?.label ?? '';
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly ?? false;
  const [open, setOpen] = useState(false);
  const error = bind.error;

  const rawValue = bind.value as string | null | undefined;
  const dateValue = rawValue ? parseISO(rawValue) : undefined;

  const handleSelect = (day: Date | undefined) => {
    if (day) {
      const iso = format(day, 'yyyy-MM-dd');
      bind.setValue?.(iso);
      on.change?.(iso);
    }
    setOpen(false);
  };

  return (
    <Field>
      {label && <FieldLabel>{label}</FieldLabel>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className="w-full justify-start text-left font-normal h-8 text-xs"
          >
            <CalendarIcon className="mr-2 size-3.5 text-muted-foreground" />
            {dateValue ? (
              format(dateValue, 'PPP')
            ) : (
              <span className="text-muted-foreground">Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={handleSelect}
            captionLayout="dropdown"
            startMonth={new Date(1900, 0)}
            endMonth={new Date(2100, 11)}
          />
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </Field>
  );
}

DatePickerWidget.widgetMeta = {
  name: 'datepicker',
  label: 'Date Picker',
  category: 'input' as const,
  schema: {
    label: { type: 'string' as const },
    disabled: { type: 'boolean' as const, default: false },
  },
  binding: 'field' as const,
  triggers: ['change'],
  container: false,
};
