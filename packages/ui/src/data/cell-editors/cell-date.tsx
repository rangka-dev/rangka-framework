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
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';

export type CellDateProps = Omit<ComponentProps<'div'>, 'value' | 'onChange'> & {
  /** Current value as ISO date string (yyyy-MM-dd) */
  value?: string | null;
  /** Called with ISO date string when a date is selected */
  onChange?: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Start open */
  defaultOpen?: boolean;
};

export const CellDate = forwardRef<HTMLDivElement, CellDateProps>(
  (
    { className, value, onChange, placeholder = 'Pick date', defaultOpen = true, ...props },
    ref,
  ) => {
    const [open, setOpen] = useState(defaultOpen);
    const dateValue = value ? parseISO(value) : undefined;
    const [viewMonth, setViewMonth] = useState(() => dateValue ?? new Date());
    const triggerRef = useRef<HTMLButtonElement>(null);

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
      <div ref={ref} className={cn('flex items-center h-full w-full', className)} {...props}>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center h-full w-full text-2xs text-foreground outline-none"
        >
          <span className={cn('flex-1 text-left truncate', !dateValue && 'text-muted-foreground')}>
            {dateValue ? format(dateValue, 'MMM dd, yyyy') : placeholder}
          </span>
        </button>
        {open && (
          <CellDateDropdown anchorRef={triggerRef}>
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
                      onClick={() => handleSelect(day)}
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
            </div>
          </CellDateDropdown>
        )}
      </div>
    );
  },
);

CellDate.displayName = 'CellDate';

// --- Portal dropdown ---

function CellDateDropdown({
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
