import { forwardRef, type ComponentProps } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../lib/cn';
import { Icon } from '../primitives/icon';

// --- Listbox (Root) ---

export type ListboxProps = ComponentProps<'div'>;

const ListboxRoot = forwardRef<HTMLDivElement, ListboxProps>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="listbox" className={cn('relative', className)} {...props} />
));
ListboxRoot.displayName = 'Listbox';

// --- Listbox.Trigger ---

export type ListboxTriggerProps = ComponentProps<'button'> & {
  /** Whether trigger appears as placeholder (no selection) */
  placeholder?: boolean;
};

const ListboxTrigger = forwardRef<HTMLButtonElement, ListboxTriggerProps>(
  ({ className, placeholder, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      data-slot="listbox-trigger"
      className={cn(
        'flex h-9 w-full items-center rounded-md border border-border bg-transparent px-3 text-2xs',
        'focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        placeholder && 'text-muted-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);
ListboxTrigger.displayName = 'Listbox.Trigger';

// --- Listbox.TriggerValue ---

export type ListboxTriggerValueProps = ComponentProps<'span'>;

const ListboxTriggerValue = forwardRef<HTMLSpanElement, ListboxTriggerValueProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="listbox-trigger-value"
      className={cn('flex-1 text-left truncate', className)}
      {...props}
    />
  ),
);
ListboxTriggerValue.displayName = 'Listbox.TriggerValue';

// --- Listbox.TriggerIcon ---

export type ListboxTriggerIconProps = ComponentProps<'span'>;

const ListboxTriggerIcon = forwardRef<HTMLSpanElement, ListboxTriggerIconProps>(
  ({ className, children, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="listbox-trigger-icon"
      className={cn('text-muted-foreground', className)}
      {...props}
    >
      {children}
    </span>
  ),
);
ListboxTriggerIcon.displayName = 'Listbox.TriggerIcon';

// --- Listbox.Content ---

export type ListboxContentProps = ComponentProps<'div'>;

const ListboxContent = forwardRef<HTMLDivElement, ListboxContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="listbox-content"
      className={cn(
        'absolute z-50 mt-1 w-full rounded-md border border-border bg-surface shadow-md',
        className,
      )}
      {...props}
    />
  ),
);
ListboxContent.displayName = 'Listbox.Content';

// --- Listbox.Search ---

export type ListboxSearchProps = Omit<ComponentProps<'input'>, 'type'>;

const ListboxSearch = forwardRef<HTMLInputElement, ListboxSearchProps>(
  ({ className, ...props }, ref) => (
    <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2">
      <Icon icon={Search} size="sm" className="shrink-0 text-foreground/50" />
      <input
        ref={ref}
        type="text"
        data-slot="listbox-search"
        className={cn(
          'flex-1 bg-transparent text-2xs outline-none placeholder:text-muted-foreground',
          className,
        )}
        autoFocus
        {...props}
      />
    </div>
  ),
);
ListboxSearch.displayName = 'Listbox.Search';

// --- Listbox.Items ---

export type ListboxItemsProps = ComponentProps<'div'>;

const ListboxItems = forwardRef<HTMLDivElement, ListboxItemsProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="listbox-items"
      className={cn('max-h-48 overflow-auto p-1', className)}
      {...props}
    />
  ),
);
ListboxItems.displayName = 'Listbox.Items';

// --- Listbox.Item ---

export type ListboxItemProps = ComponentProps<'button'> & {
  /** Whether this item is currently selected */
  active?: boolean;
};

const ListboxItem = forwardRef<HTMLButtonElement, ListboxItemProps>(
  ({ className, active, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      data-slot="listbox-item"
      className={cn(
        'flex w-full items-center rounded-sm px-3 py-1.5 text-2xs cursor-pointer',
        'hover:bg-foreground/6',
        active && 'bg-foreground/6 font-medium',
        className,
      )}
      {...props}
    />
  ),
);
ListboxItem.displayName = 'Listbox.Item';

// --- Listbox.Empty ---

export type ListboxEmptyProps = ComponentProps<'div'>;

const ListboxEmpty = forwardRef<HTMLDivElement, ListboxEmptyProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="listbox-empty"
      className={cn('px-3 py-2 text-2xs text-muted-foreground', className)}
      {...props}
    >
      {children ?? 'No results'}
    </div>
  ),
);
ListboxEmpty.displayName = 'Listbox.Empty';

// --- Compose ---

export const Listbox = Object.assign(ListboxRoot, {
  Trigger: ListboxTrigger,
  TriggerValue: ListboxTriggerValue,
  TriggerIcon: ListboxTriggerIcon,
  Content: ListboxContent,
  Search: ListboxSearch,
  Items: ListboxItems,
  Item: ListboxItem,
  Empty: ListboxEmpty,
});
