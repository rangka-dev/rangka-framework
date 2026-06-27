import {
  forwardRef,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { X, Search } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Icon } from '../../primitives/icon';
import { useClickOutside } from '../../lib/use-click-outside';

export type CellMultiSelectProps = Omit<ComponentProps<'div'>, 'value' | 'onChange'> & {
  /** Current selected values */
  value?: string[];
  /** Called when selection changes */
  onChange?: (values: string[]) => void;
  /** Options list */
  options?: Array<{ value: string; label: string }>;
  /** Show search input */
  searchable?: boolean;
  /** Start open */
  defaultOpen?: boolean;
};

export const CellMultiSelect = forwardRef<HTMLDivElement, CellMultiSelectProps>(
  (
    {
      className,
      value = [],
      onChange,
      options = [],
      searchable = true,
      defaultOpen = true,
      ...props
    },
    ref,
  ) => {
    const [open, setOpen] = useState(defaultOpen);
    const [search, setSearch] = useState('');
    const triggerRef = useRef<HTMLDivElement>(null);
    const containerRef = useClickOutside<HTMLDivElement>(
      useCallback(() => setOpen(false), []),
      open,
    );

    const filtered = searchable
      ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
      : options;

    const handleToggle = (optValue: string) => {
      const next = value.includes(optValue)
        ? value.filter((v) => v !== optValue)
        : [...value, optValue];
      onChange?.(next);
    };

    const handleRemove = (optValue: string) => {
      onChange?.(value.filter((v) => v !== optValue));
    };

    const getLabel = (v: string) => options.find((o) => o.value === v)?.label ?? v;

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
        <div
          ref={triggerRef}
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 h-full w-full text-2xs text-foreground outline-none cursor-pointer overflow-hidden"
        >
          {value.length === 0 && <span className="text-muted-foreground">Select...</span>}
          {value.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-0.5 rounded bg-foreground/8 px-1.5 py-0.5 text-2xs shrink-0"
            >
              {getLabel(v)}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(v);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <Icon icon={X} size="sm" className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        {open && (
          <CellMultiSelectDropdown anchorRef={triggerRef}>
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
              {filtered.map((opt) => {
                const isSelected = value.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-2xs cursor-pointer',
                      'hover:bg-foreground/6',
                      isSelected && 'bg-foreground/6',
                    )}
                    onClick={() => handleToggle(opt.value)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="size-3 rounded-sm border border-border accent-primary pointer-events-none"
                    />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </CellMultiSelectDropdown>
        )}
      </div>
    );
  },
);

CellMultiSelect.displayName = 'CellMultiSelect';

// --- Portal dropdown ---

function CellMultiSelectDropdown({
  anchorRef,
  children,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
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
      className="fixed z-50 rounded-md border border-border bg-surface shadow-md"
      style={{ top: pos.top, left: pos.left, width: Math.max(pos.width, 200) }}
    >
      {children}
    </div>,
    document.body,
  );
}
