import {
  forwardRef,
  useCallback,
  useEffect,
  useState,
  createContext,
  useContext,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { Command } from 'cmdk';
import { Search } from 'lucide-react';
import { cn } from '../lib/cn';
import { Icon } from '../primitives/icon';

// --- CommandPalette Context ---

type CommandPaletteContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error('useCommandPalette must be used within CommandPalette');
  return ctx;
}

// --- CommandPalette Root ---

export type CommandPaletteProps = {
  /** Controlled open state */
  open?: boolean;
  /** Default open state */
  defaultOpen?: boolean;
  /** Called when open state changes */
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
};

const CommandPaletteRoot = ({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
}: CommandPaletteProps) => {
  const [_open, _setOpen] = useState(defaultOpen);
  const open = openProp ?? _open;

  const setOpen = useCallback(
    (value: boolean) => {
      if (onOpenChange) {
        onOpenChange(value);
      } else {
        _setOpen(value);
      }
    },
    [onOpenChange],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
    </CommandPaletteContext.Provider>
  );
};
CommandPaletteRoot.displayName = 'CommandPalette';

// --- CommandPalette.Trigger ---

export type CommandPaletteTriggerProps = ComponentProps<'button'>;

const CommandPaletteTrigger = forwardRef<HTMLButtonElement, CommandPaletteTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { setOpen } = useCommandPalette();

    return (
      <button
        ref={ref}
        data-slot="command-palette-trigger"
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex h-7 cursor-pointer items-center gap-2 rounded-lg border border-border-subtle bg-surface p-2 text-2xs text-muted-foreground transition-colors hover:bg-foreground/4',
          className,
        )}
        {...props}
      >
        <Icon icon={Search} size="sm" className="size-3.5" />
        {children ?? <span>Search</span>}
      </button>
    );
  },
);
CommandPaletteTrigger.displayName = 'CommandPalette.Trigger';

// --- CommandPalette.Content ---

export type CommandPaletteContentProps = ComponentProps<'div'> & {
  /** Placeholder for the search input */
  placeholder?: string;
};

const CommandPaletteContent = forwardRef<HTMLDivElement, CommandPaletteContentProps>(
  ({ className, placeholder = 'Search...', children, ...props }, ref) => {
    const { open, setOpen } = useCommandPalette();

    useEffect(() => {
      if (!open) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          setOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, setOpen]);

    if (!open) return null;

    return (
      <div
        data-slot="command-palette-overlay"
        className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
        onClick={() => setOpen(false)}
      >
        <div data-slot="command-palette-backdrop" className="fixed inset-0 bg-foreground/20" />
        <div
          ref={ref}
          data-slot="command-palette-content"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'relative z-50 w-full max-w-lg overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-xl',
            className,
          )}
          {...props}
        >
          <Command className="flex flex-col">
            <div className="flex items-center gap-2 border-b border-border-subtle px-3">
              <Icon icon={Search} size="sm" className="shrink-0 text-muted-foreground" />
              <Command.Input
                placeholder={placeholder}
                className="h-11 w-full bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Command.List className="max-h-72 overflow-y-auto p-2">
              <Command.Empty className="px-3 py-6 text-center text-2xs text-muted-foreground">
                No results found.
              </Command.Empty>
              {children}
            </Command.List>
          </Command>
        </div>
      </div>
    );
  },
);
CommandPaletteContent.displayName = 'CommandPalette.Content';

// --- CommandPalette.Group ---

export type CommandPaletteGroupProps = ComponentProps<typeof Command.Group> & {
  heading?: string;
};

const CommandPaletteGroup = forwardRef<HTMLDivElement, CommandPaletteGroupProps>(
  ({ className, ...props }, ref) => (
    <Command.Group
      ref={ref}
      data-slot="command-palette-group"
      className={cn(
        '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground',
        className,
      )}
      {...props}
    />
  ),
);
CommandPaletteGroup.displayName = 'CommandPalette.Group';

// --- CommandPalette.Item ---

export type CommandPaletteItemProps = ComponentProps<typeof Command.Item>;

const CommandPaletteItem = forwardRef<HTMLDivElement, CommandPaletteItemProps>(
  ({ className, onSelect, ...props }, ref) => {
    const { setOpen } = useCommandPalette();
    return (
      <Command.Item
        ref={ref}
        data-slot="command-palette-item"
        className={cn(
          'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-2xs text-foreground/80 outline-none transition-colors',
          'data-[selected=true]:bg-foreground/6 data-[selected=true]:text-foreground',
          '[&>svg]:size-4 [&>svg]:shrink-0',
          className,
        )}
        onSelect={(value) => {
          onSelect?.(value);
          setOpen(false);
        }}
        {...props}
      />
    );
  },
);
CommandPaletteItem.displayName = 'CommandPalette.Item';

// --- CommandPalette.Separator ---

export type CommandPaletteSeparatorProps = ComponentProps<typeof Command.Separator>;

const CommandPaletteSeparator = forwardRef<HTMLDivElement, CommandPaletteSeparatorProps>(
  ({ className, ...props }, ref) => (
    <Command.Separator
      ref={ref}
      data-slot="command-palette-separator"
      className={cn('my-1 h-px bg-border-subtle', className)}
      {...props}
    />
  ),
);
CommandPaletteSeparator.displayName = 'CommandPalette.Separator';

export const CommandPalette = Object.assign(CommandPaletteRoot, {
  Trigger: CommandPaletteTrigger,
  Content: CommandPaletteContent,
  Group: CommandPaletteGroup,
  Item: CommandPaletteItem,
  Separator: CommandPaletteSeparator,
});

export { useCommandPalette };
