import {
  forwardRef,
  useState,
  useRef,
  useEffect,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';

const HOURS = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i));
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const PERIODS = ['AM', 'PM'] as const;

export type CellDateTimeProps = Omit<ComponentProps<'div'>, 'value' | 'onChange'> & {
  /** Current value as ISO datetime string */
  value?: string | null;
  /** Called with ISO datetime string when value changes */
  onChange?: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Start open */
  defaultOpen?: boolean;
};

export const CellDateTime = forwardRef<HTMLDivElement, CellDateTimeProps>(
  (
    { className, value, onChange, placeholder = 'Pick date & time', defaultOpen = true, ...props },
    ref,
  ) => {
    const [open, setOpen] = useState(defaultOpen);
    const dateValue = value ? parseISO(value) : undefined;
    const [viewMonth, setViewMonth] = useState(() => dateValue ?? new Date());
    const triggerRef = useRef<HTMLButtonElement>(null);

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
      <div ref={ref} className={cn('flex items-center h-full w-full', className)} {...props}>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center h-full w-full text-2xs text-foreground outline-none"
        >
          <span className={cn('flex-1 text-left truncate', !dateValue && 'text-muted-foreground')}>
            {dateValue ? format(dateValue, 'PPP p') : placeholder}
          </span>
        </button>
        {open && (
          <CellDateTimeDropdown anchorRef={triggerRef}>
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => setViewMonth(subMonths(viewMonth, 1))}
                  className="rounded-sm p-1 hover:bg-accent"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium">{format(viewMonth, 'MMMM yyyy')}</span>
                <button
                  type="button"
                  onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                  className="rounded-sm p-1 hover:bg-accent"
                >
                  <ChevronRight className="h-4 w-4" />
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
                  const isCurrentMonth = isSameMonth(day, viewMonth);
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => handleDaySelect(day)}
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-sm text-xs transition-colors',
                        isCurrentMonth ? 'text-foreground' : 'text-muted-foreground',
                        isSelected && 'bg-primary text-primary-foreground',
                        !isSelected && 'hover:bg-accent',
                      )}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                <select
                  value={displayHour}
                  onChange={(e) => handleHourChange(Number(e.target.value))}
                  className="h-7 rounded border border-border bg-transparent px-1.5 text-xs outline-none"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-muted-foreground">:</span>
                <select
                  value={currentMinutes}
                  onChange={(e) => handleMinuteChange(Number(e.target.value))}
                  className="h-7 rounded border border-border bg-transparent px-1.5 text-xs outline-none"
                >
                  {MINUTES.map((m) => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <div className="flex rounded border border-border overflow-hidden">
                  {PERIODS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePeriodChange(p)}
                      className={cn(
                        'px-2 py-1 text-xs',
                        currentPeriod === p
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent',
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CellDateTimeDropdown>
        )}
      </div>
    );
  },
);

CellDateTime.displayName = 'CellDateTime';

// --- Portal dropdown ---

function CellDateTimeDropdown({
  anchorRef,
  children,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!anchorRef.current) return;
    const cell = anchorRef.current.closest('[data-slot="datagrid-cell"]') as HTMLElement | null;
    const rect = cell ? cell.getBoundingClientRect() : anchorRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 2, left: rect.left });
  }, [anchorRef]);

  if (!pos) return null;

  return createPortal(
    <div
      className="fixed z-50 rounded-md border border-border bg-card shadow-md"
      style={{ top: pos.top, left: pos.left }}
    >
      {children}
    </div>,
    document.body,
  );
}
