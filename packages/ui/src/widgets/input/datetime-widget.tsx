import { useState, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { DateTimePicker } from '../../form/date-time-picker';
import { Field } from '../../form/field';
import { Icon } from '../../primitives/icon';
import { useClickOutside } from '../../lib/use-click-outside';
import { cn } from '../../lib/cn';
import type { WidgetComponentProps } from '../types';

export function DateTimeWidget({ props, bind, on, context }: WidgetComponentProps) {
  const label = (props.label as string) ?? bind.meta?.label;
  const placeholder = (props.placeholder as string) ?? 'Pick date and time...';
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly;
  const required = bind.meta?.required;

  if (context.mode === 'record') {
    return (
      <RecordFieldDateTime
        label={label}
        value={bind.value as string | null}
        readOnly={disabled}
        onSave={(value) => on.saveField?.(value)}
      />
    );
  }

  const handleChange = (value: string) => {
    bind.setValue?.(value);
    on.change?.(value);
  };

  return (
    <Field data-invalid={!!bind.error || undefined}>
      {label && <Field.Label required={required}>{label}</Field.Label>}
      <DateTimePicker
        value={(bind.value as string | null) ?? null}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
      />
      {bind.error && <Field.Error>{bind.error}</Field.Error>}
    </Field>
  );
}

function RecordFieldDateTime({
  label,
  value,
  readOnly,
  onSave,
}: {
  label?: string;
  value: string | null;
  readOnly?: boolean;
  onSave: (value: unknown) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const containerRef = useClickOutside<HTMLDivElement>(
    useCallback(() => setEditing(false), []),
    editing,
  );

  const handleClick = () => {
    if (readOnly) return;
    setEditing(true);
  };

  const handleSelect = (day: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    day.setHours(hours, minutes);
    const iso = day.toISOString();
    if (iso !== value) {
      setSaving(true);
      onSave(iso);
      setTimeout(() => setSaving(false), 600);
    }
    setEditing(false);
  };

  const formatted = value
    ? new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

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
        <Icon icon={Calendar} size="sm" className="text-muted-foreground/70 shrink-0" />
        <span className="text-2xs text-muted-foreground truncate">{label}</span>
      </div>
      <div className="flex-1 min-w-0 relative">
        <span
          className={cn(
            'text-2xs block truncate font-medium',
            saving && 'opacity-50',
            readOnly && 'text-foreground/70',
          )}
        >
          {formatted ?? <span className="text-foreground/30 italic">Empty</span>}
        </span>
        {editing && <DateTimeCalendarPopover value={value} onSelect={handleSelect} />}
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

function DateTimeCalendarPopover({
  value,
  onSelect,
}: {
  value: string | null;
  onSelect: (day: Date, time: string) => void;
}) {
  const dateValue = value ? new Date(value) : undefined;
  const [viewMonth, setViewMonth] = useState(() => dateValue ?? new Date());
  const [time, setTime] = useState(() => {
    if (!dateValue) return '12:00';
    return `${String(dateValue.getHours()).padStart(2, '0')}:${String(dateValue.getMinutes()).padStart(2, '0')}`;
  });

  const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const monthEnd = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
  const days: Date[] = [];
  for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  const startDayOfWeek = monthStart.getDay();

  const prevMonth = () =>
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  const nextMonth = () =>
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div
      className="absolute top-full left-0 mt-1 z-50 rounded-md border border-border bg-card p-3 shadow-md"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded-sm p-1 hover:bg-accent text-muted-foreground"
        >
          <Icon icon={ChevronLeft} size="sm" />
        </button>
        <span className="text-xs font-medium">{monthLabel}</span>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded-sm p-1 hover:bg-accent text-muted-foreground"
        >
          <Icon icon={ChevronRight} size="sm" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div
            key={d}
            className="flex h-7 w-7 items-center justify-center text-2xs text-muted-foreground"
          >
            {d}
          </div>
        ))}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`e-${i}`} className="h-7 w-7" />
        ))}
        {days.map((day) => {
          const isSelected = dateValue && day.toDateString() === dateValue.toDateString();
          const isToday = day.toDateString() === new Date().toDateString();
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect(new Date(day), time)}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-sm text-2xs transition-colors hover:bg-accent',
                isSelected && 'bg-primary text-primary-foreground hover:bg-primary',
                isToday && !isSelected && 'border border-primary',
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
      <div className="mt-2 pt-2 border-t border-border flex items-center gap-2">
        <span className="text-2xs text-muted-foreground">Time</span>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="text-2xs bg-transparent border border-border rounded-sm px-2 py-0.5 outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
    </div>
  );
}

DateTimeWidget.displayName = 'DateTimeWidget';
