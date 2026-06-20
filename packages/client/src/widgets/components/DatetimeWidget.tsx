import React, { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldLabel } from '@/components/ui/field';
import { CalendarIcon } from 'lucide-react';
import { format, parseISO, setHours, setMinutes } from 'date-fns';
import type { WidgetProps } from '../types.js';

const HOURS = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i).toString());
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
const PERIODS = ['AM', 'PM'] as const;

export function DatetimeWidget({ props, bind, on }: WidgetProps) {
  const label = (props.label as string) ?? bind.meta?.label ?? '';
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly ?? false;
  const [open, setOpen] = useState(false);

  const rawValue = bind.value as string | null | undefined;
  const dateValue = rawValue ? parseISO(rawValue) : undefined;

  const hours = dateValue ? dateValue.getHours() : 0;
  const minutes = dateValue ? dateValue.getMinutes() : 0;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;

  const updateValue = (day: Date | undefined, h: number, m: number) => {
    if (!day) return;
    let d = setHours(day, h);
    d = setMinutes(d, m);
    const iso = d.toISOString();
    bind.setValue?.(iso);
    on.change?.(iso);
  };

  const handleSelect = (day: Date | undefined) => {
    if (day) {
      updateValue(day, hours, minutes);
    }
  };

  const handleHourChange = (value: string) => {
    const h12 = parseInt(value);
    const h24 = period === 'AM' ? (h12 === 12 ? 0 : h12) : h12 === 12 ? 12 : h12 + 12;
    const day = dateValue ?? new Date();
    updateValue(day, h24, minutes);
  };

  const handleMinuteChange = (value: string) => {
    const m = parseInt(value);
    const day = dateValue ?? new Date();
    updateValue(day, hours, m);
  };

  const handlePeriodChange = (value: string) => {
    const h12 = displayHour;
    const h24 = value === 'AM' ? (h12 === 12 ? 0 : h12) : h12 === 12 ? 12 : h12 + 12;
    const day = dateValue ?? new Date();
    updateValue(day, h24, minutes);
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
              format(dateValue, 'PPP hh:mm a')
            ) : (
              <span className="text-muted-foreground">Pick date and time</span>
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
          <div className="flex items-center gap-2 border-t border-border px-3 py-2">
            <Select
              value={displayHour.toString()}
              onValueChange={handleHourChange}
              disabled={disabled}
            >
              <SelectTrigger className="w-16 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-48">
                {HOURS.map((h) => (
                  <SelectItem key={h} value={h} className="text-xs">
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">:</span>
            <Select
              value={minutes.toString().padStart(2, '0')}
              onValueChange={handleMinuteChange}
              disabled={disabled}
            >
              <SelectTrigger className="w-16 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-48">
                {MINUTES.map((m) => (
                  <SelectItem key={m} value={m} className="text-xs">
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={handlePeriodChange} disabled={disabled}>
              <SelectTrigger className="w-16 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p} value={p} className="text-xs">
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </PopoverContent>
      </Popover>
    </Field>
  );
}

DatetimeWidget.widgetMeta = {
  name: 'datetime',
  label: 'Date & Time',
  category: 'input' as const,
  schema: {
    label: { type: 'string' as const },
    disabled: { type: 'boolean' as const, default: false },
  },
  binding: 'field' as const,
  triggers: ['change'],
  container: false,
};
