import {
  forwardRef,
  useState,
  useRef,
  useEffect,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Icon } from '../../primitives/icon';

// --- CellSelect (Root) ---

export type CellSelectProps = ComponentProps<'div'> & {
  /** Current value */
  value?: string | null;
  /** Display label for current value */
  displayValue?: string;
  /** Placeholder when no value */
  placeholder?: string;
  /** Called when value changes */
  onChange?: (value: string) => void;
  /** Options list */
  options?: Array<{ value: string; label: string }>;
  /** Show search input */
  searchable?: boolean;
  /** Start open */
  defaultOpen?: boolean;
};

export const CellSelect = forwardRef<HTMLDivElement, CellSelectProps>(
  (
    {
      className,
      value,
      displayValue,
      placeholder = 'Select...',
      onChange,
      options = [],
      searchable,
      defaultOpen = true,
      ...props
    },
    ref,
  ) => {
    const [open, setOpen] = useState(defaultOpen);
    const [search, setSearch] = useState('');
    const triggerRef = useRef<HTMLButtonElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const portalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!open) return;
      const handleMouseDown = (e: MouseEvent) => {
        const target = e.target as Node;
        if (containerRef.current?.contains(target)) return;
        if (portalRef.current?.contains(target)) return;
        setOpen(false);
      };
      document.addEventListener('mousedown', handleMouseDown);
      return () => document.removeEventListener('mousedown', handleMouseDown);
    }, [open]);

    const filtered = searchable
      ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
      : options;

    const selected = options.find((o) => o.value === value);
    const label = displayValue ?? selected?.label;

    return (
      <div
        ref={(node) => {
          containerRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn('relative flex items-center h-full w-full', className)}
        {...props}
      >
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center h-full w-full text-2xs text-foreground outline-none"
        >
          <span className={cn('flex-1 text-left truncate', !label && 'text-muted-foreground')}>
            {label ?? placeholder}
          </span>
          <Icon icon={ChevronDown} size="sm" className="shrink-0 text-muted-foreground" />
        </button>
        {open && (
          <CellSelectDropdown anchorRef={triggerRef} portalRef={portalRef}>
            {searchable && (
              <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2">
                <Icon icon={Search} size="sm" className="shrink-0 text-foreground/50" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="flex-1 bg-transparent text-2xs outline-none placeholder:text-muted-foreground"
                  autoFocus
                />
              </div>
            )}
            <div className="max-h-48 overflow-auto p-1">
              {filtered.length === 0 && (
                <div className="px-3 py-2 text-2xs text-muted-foreground">No results</div>
              )}
              {filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={cn(
                    'flex w-full items-center rounded-sm px-3 py-1.5 text-2xs cursor-pointer',
                    'hover:bg-foreground/6',
                    opt.value === value && 'bg-foreground/6 font-medium',
                  )}
                  onClick={() => {
                    onChange?.(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </CellSelectDropdown>
        )}
      </div>
    );
  },
);

CellSelect.displayName = 'CellSelect';

// --- Portal dropdown ---

function CellSelectDropdown({
  anchorRef,
  portalRef,
  children,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  portalRef: React.RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    if (!anchorRef.current) return;
    const cell = anchorRef.current.closest('[data-slot="datagrid-cell"]') as HTMLElement | null;
    const rect = cell ? cell.getBoundingClientRect() : anchorRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 2, left: rect.left, width: rect.width });
  }, [anchorRef]);

  if (!pos) return null;

  return createPortal(
    <div
      ref={portalRef}
      className="fixed z-50 rounded-md border border-border bg-surface shadow-md"
      style={{ top: pos.top, left: pos.left, width: Math.max(pos.width, 180) }}
    >
      {children}
    </div>,
    document.body,
  );
}
