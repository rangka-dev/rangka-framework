import { forwardRef, useState, type ComponentProps } from 'react';
import { Popover } from '@base-ui/react/popover';
import { CalendarIcon } from 'lucide-react';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  setHours,
  setMinutes,
} from 'date-fns';
import { cn } from '../lib/cn';

const HOURS = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i));
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS = ['AM', 'PM'] as const;

export type DateTimePickerProps = Omit<ComponentProps<'div'>, 'value' | 'onChange'> & {
  /** Current value as ISO datetime string */
  value?: string | null;
  /** Called with ISO datetime string when value changes */
  onChange?: (value: string) => void;
  /** Placeholder text when no date is selected */
  placeholder?: string;
  /** Disable the picker */
  disabled?: boolean;
};

const DateTimePickerRoot = forwardRef<HTMLDivElement, DateTimePickerProps>(
  (
    { className, value, onChange, placeholder = 'Pick a date and time', disabled, ...props },
    ref,
  ) => {
    const [open, setOpen] = useState(false);
    const dateValue = value ? parseISO(value) : undefined;
    const [viewMonth, setViewMonth] = useState(() => dateValue ?? new Date());

    const currentHours = dateValue ? dateValue.getHours() : 0;
    const currentMinutes = dateValue ? dateValue.getMinutes() : 0;
    const currentPeriod: 'AM' | 'PM' = currentHours >= 12 ? 'PM' : 'AM';
    const displayHour = currentHours % 12 === 0 ? 12 : currentHours % 12;

    const emitChange = (date: Date) => {
      onChange?.(date.toISOString());
    };

    const handleDaySelect = (day: Date) => {
      let d = setHours(day, currentHours);
      d = setMinutes(d, currentMinutes);
      emitChange(d);
    };

    const handleHourChange = (h: number) => {
      if (!dateValue) return;
      const hour24 = currentPeriod === 'PM' ? (h === 12 ? 12 : h + 12) : h === 12 ? 0 : h;
      const d = setHours(dateValue, hour24);
      emitChange(d);
    };

    const handleMinuteChange = (m: number) => {
      if (!dateValue) return;
      const d = setMinutes(dateValue, m);
      emitChange(d);
    };

    const handlePeriodChange = (period: 'AM' | 'PM') => {
      if (!dateValue) return;
      let h = currentHours;
      if (period === 'AM' && h >= 12) h -= 12;
      if (period === 'PM' && h < 12) h += 12;
      const d = setHours(dateValue, h);
      emitChange(d);
    };

    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOfWeek = getDay(monthStart);

    return (
      <div ref={ref} className={cn('relative', className)} {...props}>
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger
            disabled={disabled}
            className={cn(
              'flex h-9 w-full items-center gap-2 rounded-md border border-[var(--color-border)] bg-transparent px-3 text-sm transition-colors hover:bg-[var(--color-accent)] disabled:pointer-events-none disabled:opacity-50',
            )}
          >
            <CalendarIcon className="size-4 text-[var(--color-muted-foreground)]" />
            {dateValue ? (
              <span>{format(dateValue, 'PPP h:mm a')}</span>
            ) : (
              <span className="text-[var(--color-muted-foreground)]">{placeholder}</span>
            )}
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner sideOffset={4}>
              <Popover.Popup className="z-50 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={() => setViewMonth(subMonths(viewMonth, 1))}
                    className="rounded-sm p-1 hover:bg-[var(--color-accent)]"
                  >
                    <ChevronLeft />
                  </button>
                  <span className="text-sm font-medium">{format(viewMonth, 'MMMM yyyy')}</span>
                  <button
                    type="button"
                    onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                    className="rounded-sm p-1 hover:bg-[var(--color-accent)]"
                  >
                    <ChevronRight />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-0">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <div
                      key={d}
                      className="flex h-8 w-8 items-center justify-center text-xs text-[var(--color-muted-foreground)]"
                    >
                      {d}
                    </div>
                  ))}
                  {Array.from({ length: startDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-8 w-8" />
                  ))}
                  {days.map((day) => {
                    const isSelected = dateValue && isSameDay(day, dateValue);
                    const isToday = isSameDay(day, new Date());
                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => handleDaySelect(day)}
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-sm text-sm transition-colors hover:bg-[var(--color-accent)]',
                          isSelected &&
                            'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary)]',
                          isToday && !isSelected && 'border border-[var(--color-primary)]',
                          !isSameMonth(day, viewMonth) && 'text-[var(--color-muted-foreground)]',
                        )}
                      >
                        {format(day, 'd')}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-[var(--color-border)] pt-3">
                  <select
                    value={displayHour}
                    onChange={(e) => handleHourChange(parseInt(e.target.value))}
                    className="h-8 rounded-md border border-[var(--color-border)] bg-transparent px-2 text-sm"
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm">:</span>
                  <select
                    value={currentMinutes}
                    onChange={(e) => handleMinuteChange(parseInt(e.target.value))}
                    className="h-8 rounded-md border border-[var(--color-border)] bg-transparent px-2 text-sm"
                  >
                    {MINUTES.map((m) => (
                      <option key={m} value={m}>
                        {String(m).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                  <select
                    value={currentPeriod}
                    onChange={(e) => handlePeriodChange(e.target.value as 'AM' | 'PM')}
                    className="h-8 rounded-md border border-[var(--color-border)] bg-transparent px-2 text-sm"
                  >
                    {PERIODS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </div>
    );
  },
);
DateTimePickerRoot.displayName = 'DateTimePicker';

function ChevronLeft() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18l6-6-6 6" />
    </svg>
  );
}

export const DateTimePicker = DateTimePickerRoot;
