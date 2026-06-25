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
} from 'date-fns';
import { cn } from '../lib/cn';

export type DatePickerProps = Omit<ComponentProps<'div'>, 'value' | 'onChange'> & {
  /** Current value as ISO date string (yyyy-MM-dd) */
  value?: string | null;
  /** Called with ISO date string when a date is selected */
  onChange?: (value: string) => void;
  /** Placeholder text when no date is selected */
  placeholder?: string;
  /** Disable the picker */
  disabled?: boolean;
};

export type DatePickerTriggerProps = ComponentProps<'button'>;

export type DatePickerCalendarProps = ComponentProps<'div'>;

const DatePickerRoot = forwardRef<HTMLDivElement, DatePickerProps>(
  ({ className, value, onChange, placeholder = 'Pick a date', disabled, ...props }, ref) => {
    const [open, setOpen] = useState(false);
    const dateValue = value ? parseISO(value) : undefined;
    const [viewMonth, setViewMonth] = useState(() => dateValue ?? new Date());

    const handleSelect = (day: Date) => {
      const iso = format(day, 'yyyy-MM-dd');
      onChange?.(iso);
      setOpen(false);
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
              <span>{format(dateValue, 'PPP')}</span>
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
                        onClick={() => handleSelect(day)}
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
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </div>
    );
  },
);
DatePickerRoot.displayName = 'DatePicker';

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

export const DatePicker = DatePickerRoot;
