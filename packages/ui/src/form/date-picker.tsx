import { forwardRef, useState, type ComponentProps } from 'react';
import { Popover } from '@base-ui/react/popover';
import {
  CalendarIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import { Icon } from '../primitives/icon';
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
              'flex h-9 w-full items-center gap-2 rounded-md border border-border bg-transparent px-3 text-sm transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50',
            )}
          >
            <Icon icon={CalendarIcon} size="sm" className="text-muted-foreground" />
            {dateValue ? (
              <span>{format(dateValue, 'MMM dd, yyyy')}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner sideOffset={4}>
              <Popover.Popup className="z-50 rounded-md border border-border bg-card p-3 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={() => setViewMonth(subMonths(viewMonth, 1))}
                    className="rounded-sm p-1 hover:bg-accent"
                  >
                    <ChevronLeft />
                  </button>
                  <span className="text-sm font-medium">{format(viewMonth, 'MMMM yyyy')}</span>
                  <button
                    type="button"
                    onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                    className="rounded-sm p-1 hover:bg-accent"
                  >
                    <ChevronRight />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-0">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <div
                      key={d}
                      className="flex h-8 w-8 items-center justify-center text-xs text-muted-foreground"
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
                          'flex h-8 w-8 items-center justify-center rounded-sm text-sm transition-colors hover:bg-accent',
                          isSelected && 'bg-primary text-primary-foreground hover:bg-primary',
                          isToday && !isSelected && 'border border-primary',
                          !isSameMonth(day, viewMonth) && 'text-muted-foreground',
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
  return <Icon icon={ChevronLeftIcon} size="sm" />;
}

function ChevronRight() {
  return <Icon icon={ChevronRightIcon} size="sm" />;
}

export const DatePicker = DatePickerRoot;
