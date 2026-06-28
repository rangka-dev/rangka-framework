import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
} from 'react';
import { cn } from '../lib/cn';

type CommandContextValue = {
  search: string;
  setSearch: (value: string) => void;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  items: React.RefObject<string[]>;
  filter: (value: string, search: string) => boolean;
};

const CommandContext = createContext<CommandContextValue | null>(null);

const useCommand = () => {
  const ctx = useContext(CommandContext);
  if (!ctx) throw new Error('Command sub-components must be used within Command');
  return ctx;
};

const defaultFilter = (value: string, search: string) =>
  value.toLowerCase().includes(search.toLowerCase());

export type CommandProps = ComponentProps<'div'> & {
  /** Custom filter function for items */
  filter?: (value: string, search: string) => boolean;
};

export type CommandInputProps = ComponentProps<'input'> & {
  /** Placeholder text */
  placeholder?: string;
};

export type CommandListProps = ComponentProps<'div'>;

export type CommandGroupProps = ComponentProps<'div'> & {
  /** Group heading label */
  heading?: string;
};

export type CommandItemProps = ComponentProps<'div'> & {
  /** The value used for filtering */
  value?: string;
  /** Whether this item is disabled */
  disabled?: boolean;
  /** Called when the item is selected */
  onSelect?: () => void;
};

export type CommandEmptyProps = ComponentProps<'div'>;

const CommandRoot = forwardRef<HTMLDivElement, CommandProps>(
  ({ className, filter, children, ...props }, ref) => {
    const [search, setSearch] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const items = useRef<string[]>([]);

    const contextValue = useMemo(
      () => ({
        search,
        setSearch,
        activeIndex,
        setActiveIndex,
        items,
        filter: filter ?? defaultFilter,
      }),
      [search, activeIndex, filter],
    );

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, items.current.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      }
    }, []);

    return (
      <CommandContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn(
            'flex flex-col overflow-hidden rounded-md bg-popover text-popover-foreground',
            className,
          )}
          onKeyDown={handleKeyDown}
          {...props}
        >
          {children}
        </div>
      </CommandContext.Provider>
    );
  },
);
CommandRoot.displayName = 'Command';

const CommandInput = forwardRef<HTMLInputElement, CommandInputProps>(
  ({ className, placeholder, ...props }, ref) => {
    const { search, setSearch, setActiveIndex } = useCommand();

    return (
      <input
        ref={ref}
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setActiveIndex(0);
        }}
        placeholder={placeholder}
        className={cn(
          'flex h-10 w-full border-b border-border bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground',
          className,
        )}
        {...props}
      />
    );
  },
);
CommandInput.displayName = 'Command.Input';

const CommandList = forwardRef<HTMLDivElement, CommandListProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('max-h-[300px] overflow-y-auto p-1', className)} {...props}>
        {children}
      </div>
    );
  },
);
CommandList.displayName = 'Command.List';

const CommandGroup = forwardRef<HTMLDivElement, CommandGroupProps>(
  ({ className, heading, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('overflow-hidden', className)} {...props}>
        {heading && (
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{heading}</div>
        )}
        {children}
      </div>
    );
  },
);
CommandGroup.displayName = 'Command.Group';

const CommandItem = forwardRef<HTMLDivElement, CommandItemProps>(
  ({ className, value, disabled, onSelect, children, ...props }, ref) => {
    const { search, filter, activeIndex, items, setActiveIndex } = useCommand();
    const itemRef = useRef<HTMLDivElement | null>(null);
    const textValue = value ?? (typeof children === 'string' ? children : '');

    const visible = !search || filter(textValue, search);

    const [index, setIndex] = useState(-1);

    useEffect(() => {
      if (visible && !disabled) {
        const arr = items.current;
        const idx = arr.length;
        arr.push(textValue);
        setIndex(idx);
        return () => {
          const i = arr.indexOf(textValue);
          if (i !== -1) arr.splice(i, 1);
        };
      }
      return undefined;
    }, [visible, disabled, textValue, items]);

    if (!visible) return null;

    const isActive = index === activeIndex;

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' && isActive && !disabled && onSelect) {
        e.preventDefault();
        onSelect();
      }
    };

    return (
      <div
        ref={(node) => {
          itemRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn(
          'relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent',
          isActive && 'bg-accent',
          disabled && 'pointer-events-none opacity-50',
          className,
        )}
        data-active={isActive ? '' : undefined}
        onClick={() => !disabled && onSelect?.()}
        onMouseEnter={() => !disabled && setActiveIndex(index)}
        onKeyDown={handleKeyDown}
        role="option"
        aria-selected={isActive}
        aria-disabled={disabled}
        {...props}
      >
        {children}
      </div>
    );
  },
);
CommandItem.displayName = 'Command.Item';

const CommandEmpty = forwardRef<HTMLDivElement, CommandEmptyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('py-6 text-center text-sm text-muted-foreground', className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
CommandEmpty.displayName = 'Command.Empty';

export const Command = Object.assign(CommandRoot, {
  Input: CommandInput,
  List: CommandList,
  Group: CommandGroup,
  Item: CommandItem,
  Empty: CommandEmpty,
});
