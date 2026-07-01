import { useState, useCallback } from 'react';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Icon } from '../../primitives/icon';
import { Input } from '../../primitives/input';
import { InlineField } from '../../primitives/inline-field';
import { useClickOutside } from '../../lib/use-click-outside';
import { cn } from '../../lib/cn';

interface DateTimeEditorProps {
  label?: string;
  value: string | null;
  readOnly?: boolean;
  onSave: (value: unknown) => void;
}

export function DateTimeEditor({ label, value, readOnly, onSave }: DateTimeEditorProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [time, setTime] = useState('12:00');

  const containerRef = useClickOutside<HTMLDivElement>(
    useCallback(() => setEditing(false), []),
    editing,
  );

  const handleClick = () => {
    if (readOnly) return;
    if (value) {
      const d = new Date(value);
      setTime(
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
      );
    }
    setEditing(true);
  };

  const handleSelect = (day: Date) => {
    const [hours, minutes] = time.split(':').map(Number);
    day.setHours(hours, minutes, 0, 0);
    const iso = day.toISOString();
    if (iso !== value) {
      setSaving(true);
      onSave(iso);
      setTimeout(() => setSaving(false), 600);
    }
    setEditing(false);
  };

  const formatted = value
    ? new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : null;

  return (
    <div ref={containerRef}>
      <InlineField
        label={label}
        icon={Clock}
        readOnly={readOnly}
        editing={editing}
        onClick={!editing ? handleClick : undefined}
      >
        {editing ? (
          <>
            <InlineField.Value saving={saving}>
              {formatted ?? <InlineField.Empty />}
            </InlineField.Value>
            <div
              className="absolute top-full left-0 mt-1 z-50 rounded-md border border-border bg-card p-3 shadow-md"
              onClick={(e) => e.stopPropagation()}
            >
              <DateTimeCalendar
                value={value}
                time={time}
                onTimeChange={setTime}
                onSelect={handleSelect}
              />
            </div>
          </>
        ) : (
          <InlineField.Value saving={saving} readOnly={readOnly}>
            {formatted ?? <InlineField.Empty />}
          </InlineField.Value>
        )}
      </InlineField>
    </div>
  );
}

function DateTimeCalendar({
  value,
  time,
  onTimeChange,
  onSelect,
}: {
  value: string | null;
  time: string;
  onTimeChange: (time: string) => void;
  onSelect: (day: Date) => void;
}) {
  const dateValue = value ? new Date(value) : undefined;
  const [viewMonth, setViewMonth] = useState(() => dateValue ?? new Date());

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
    <>
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
              onClick={() => onSelect(day)}
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
      <div className="mt-2 pt-2 border-t border-border">
        <Input
          type="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          className="h-7 text-2xs"
        />
      </div>
    </>
  );
}
