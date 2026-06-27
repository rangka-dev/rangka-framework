import {
  forwardRef,
  useState,
  useRef,
  useEffect,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn';

export type CellJsonProps = Omit<ComponentProps<'div'>, 'value' | 'onChange'> & {
  /** Current value as object or string */
  value?: unknown;
  /** Called with parsed JSON value */
  onChange?: (value: unknown) => void;
  /** Start open */
  defaultOpen?: boolean;
};

export const CellJson = forwardRef<HTMLDivElement, CellJsonProps>(
  ({ className, value, onChange, defaultOpen = true, ...props }, ref) => {
    const [open, setOpen] = useState(defaultOpen);
    const [text, setText] = useState(() => (value != null ? JSON.stringify(value, null, 2) : ''));
    const [error, setError] = useState<string | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    const handleSave = () => {
      try {
        const parsed = JSON.parse(text);
        setError(null);
        onChange?.(parsed);
        setOpen(false);
      } catch {
        setError('Invalid JSON');
      }
    };

    return (
      <div ref={ref} className={cn('flex items-center h-full w-full', className)} {...props}>
        <div
          ref={triggerRef}
          onClick={() => setOpen(!open)}
          className="flex items-center h-full w-full text-2xs text-foreground font-mono truncate cursor-pointer outline-none"
        >
          {value != null ? JSON.stringify(value) : '—'}
        </div>
        {open && (
          <CellJsonDropdown anchorRef={triggerRef}>
            <div className="flex flex-col gap-2 p-3 w-72">
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setError(null);
                }}
                className="h-40 w-full rounded border border-border bg-transparent px-2 py-1.5 font-mono text-2xs text-foreground outline-none resize-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
              {error && <span className="text-2xs text-destructive">{error}</span>}
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded px-2 py-1 text-2xs hover:bg-foreground/6"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded bg-primary px-2 py-1 text-2xs text-primary-foreground hover:bg-primary/90"
                >
                  Save
                </button>
              </div>
            </div>
          </CellJsonDropdown>
        )}
      </div>
    );
  },
);

CellJson.displayName = 'CellJson';

// --- Portal dropdown ---

function CellJsonDropdown({
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
