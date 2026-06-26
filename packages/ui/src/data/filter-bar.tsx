import { forwardRef, useEffect, useRef, type ComponentProps } from 'react';
import { Filter, X, Search } from 'lucide-react';
import { cn } from '../lib/cn';
import { Button } from '../primitives/button';
import { Icon } from '../primitives/icon';

// --- FilterBar (Root) ---

export type FilterBarProps = ComponentProps<'div'> & {
  /** Whether the filter row is expanded */
  open?: boolean;
  /** Called when expanded state changes */
  onOpenChange?: (open: boolean) => void;
};

const FilterBarRoot = forwardRef<HTMLDivElement, FilterBarProps>(
  ({ className, open: _open, onOpenChange: _onOpenChange, children, ...props }, ref) => (
    <div ref={ref} data-slot="filter-bar" className={cn('flex flex-col', className)} {...props}>
      {children}
    </div>
  ),
);
FilterBarRoot.displayName = 'FilterBar';

// --- FilterBar.Trigger ---

export type FilterBarTriggerProps = ComponentProps<'button'> & {
  /** Number of active filters (shows badge when > 0) */
  count?: number;
  /** Whether the filter panel is open */
  active?: boolean;
  /** Toggle handler */
  onToggle?: () => void;
};

const FilterBarTrigger = forwardRef<HTMLButtonElement, FilterBarTriggerProps>(
  ({ className, count, active: _active, onToggle, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      data-slot="filter-bar-trigger"
      onClick={onToggle}
      className={cn(
        'inline-flex h-7 items-center gap-1 rounded-md border border-border bg-surface px-2 text-xs font-medium shadow-sm transition-colors',
        'hover:bg-foreground/6',
        className,
      )}
      {...props}
    >
      <Icon icon={Filter} size="sm" />
      <span>Filter</span>
      {count != null && count > 0 && (
        <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
          {count}
        </span>
      )}
    </button>
  ),
);
FilterBarTrigger.displayName = 'FilterBar.Trigger';

// --- FilterBar.Content ---

export type FilterBarContentProps = ComponentProps<'div'>;

const FilterBarContent = forwardRef<HTMLDivElement, FilterBarContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="filter-bar-content"
      className={cn(
        'flex flex-wrap items-center gap-2 border-t border-border-subtle px-5 py-2',
        className,
      )}
      {...props}
    />
  ),
);
FilterBarContent.displayName = 'FilterBar.Content';

// --- FilterBar.Badge ---

export type FilterBarBadgeProps = ComponentProps<'span'> & {
  /** Field label */
  label: string;
  /** Operator symbol (e.g. "=", "≥", "≈") */
  operator: string;
  /** Filter value (empty for operators like "is empty") */
  value?: string;
  /** Called when the remove button is clicked */
  onRemove?: () => void;
};

const FilterBarBadge = forwardRef<HTMLSpanElement, FilterBarBadgeProps>(
  ({ className, label, operator, value, onRemove, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="filter-bar-badge"
      className={cn(
        'inline-flex items-center gap-1 rounded-md bg-foreground/6 px-2 py-0.5 text-2xs text-foreground',
        className,
      )}
      {...props}
    >
      <span className="font-medium">{label}</span>
      <span className="text-foreground/50">{operator}</span>
      {value && <span>{value}</span>}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 inline-flex size-3.5 items-center justify-center rounded-sm transition-colors hover:bg-foreground/10"
          aria-label={`Remove ${label} filter`}
        >
          <Icon icon={X} size="sm" className="h-3 w-3" />
        </button>
      )}
    </span>
  ),
);
FilterBarBadge.displayName = 'FilterBar.Badge';

// --- FilterBar.AddButton ---

export type FilterBarAddButtonProps = ComponentProps<'button'>;

const FilterBarAddButton = forwardRef<HTMLButtonElement, FilterBarAddButtonProps>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      data-slot="filter-bar-add"
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded-md border border-dashed border-border px-2 text-2xs text-foreground/60 transition-colors hover:border-border-subtle hover:bg-foreground/4 hover:text-foreground',
        className,
      )}
      {...props}
    >
      {children ?? '+ Add filter'}
    </button>
  ),
);
FilterBarAddButton.displayName = 'FilterBar.AddButton';

// --- FilterBar.Popover ---

export type FilterBarPopoverProps = ComponentProps<'div'> & {
  /** Whether popover is visible */
  open?: boolean;
  /** Called when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Alignment relative to trigger */
  align?: 'start' | 'end';
};

const FilterBarPopover = forwardRef<HTMLDivElement, FilterBarPopoverProps>(
  ({ className, open, align = 'start', onOpenChange, children, ...props }, ref) => {
    const innerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!open) return;
      const handleClick = (e: MouseEvent) => {
        const el = innerRef.current;
        if (el && !el.contains(e.target as Node)) {
          onOpenChange?.(false);
        }
      };
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }, [open, onOpenChange]);

    if (!open) return null;

    return (
      <div
        ref={(node) => {
          (innerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        data-slot="filter-bar-popover"
        className={cn(
          'absolute top-full z-50 mt-1 w-56 rounded-md border border-border bg-surface shadow-md',
          align === 'start' ? 'left-0' : 'right-0',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
FilterBarPopover.displayName = 'FilterBar.Popover';

// --- FilterBar.FieldList ---

export type FilterBarFieldListProps = ComponentProps<'div'> & {
  /** Search input value */
  search?: string;
  /** Called when search value changes */
  onSearchChange?: (value: string) => void;
  /** Placeholder for search input */
  placeholder?: string;
};

const FilterBarFieldList = forwardRef<HTMLDivElement, FilterBarFieldListProps>(
  (
    { className, search, onSearchChange, placeholder = 'Search fields...', children, ...props },
    ref,
  ) => (
    <div
      ref={ref}
      data-slot="filter-bar-field-list"
      className={cn('flex flex-col', className)}
      {...props}
    >
      <div className="flex items-center gap-2 border-b border-border-subtle px-2.5 py-2">
        <Icon icon={Search} size="sm" className="shrink-0 text-foreground/50" />
        <input
          type="text"
          value={search ?? ''}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-2xs outline-none placeholder:text-foreground/40"
          autoFocus
        />
      </div>
      <div className="flex max-h-48 flex-col overflow-auto py-1">{children}</div>
    </div>
  ),
);
FilterBarFieldList.displayName = 'FilterBar.FieldList';

// --- FilterBar.FieldItem ---

export type FilterBarFieldItemProps = ComponentProps<'button'>;

const FilterBarFieldItem = forwardRef<HTMLButtonElement, FilterBarFieldItemProps>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      data-slot="filter-bar-field-item"
      className={cn(
        'px-2.5 py-1.5 text-left text-2xs transition-colors hover:bg-foreground/6',
        className,
      )}
      {...props}
    />
  ),
);
FilterBarFieldItem.displayName = 'FilterBar.FieldItem';

// --- FilterBar.OperatorForm ---

export type OperatorOption = {
  value: string;
  label: string;
  needsValue?: boolean;
};

export type FilterBarOperatorFormProps = ComponentProps<'div'> & {
  /** The selected field label */
  fieldLabel: string;
  /** Available operators for this field type */
  operators: OperatorOption[];
  /** Currently selected operator */
  operator: string;
  /** Called when operator changes */
  onOperatorChange?: (value: string) => void;
  /** Current filter value */
  value?: string;
  /** Called when filter value changes */
  onValueChange?: (value: string) => void;
  /** Whether the current operator requires a value input */
  needsValue?: boolean;
  /** Called when apply is clicked */
  onApply?: () => void;
  /** Called when back is clicked */
  onBack?: () => void;
};

const FilterBarOperatorForm = forwardRef<HTMLDivElement, FilterBarOperatorFormProps>(
  (
    {
      className,
      fieldLabel,
      operators,
      operator,
      onOperatorChange,
      value,
      onValueChange,
      needsValue,
      onApply,
      onBack,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      data-slot="filter-bar-operator-form"
      className={cn('flex flex-col', className)}
      {...props}
    >
      <div className="px-2.5 pb-2 pt-2.5">
        <p className="text-xs font-medium">{fieldLabel}</p>
      </div>
      <div className="flex flex-col gap-2 px-2.5 pb-2.5">
        <select
          value={operator}
          onChange={(e) => onOperatorChange?.(e.target.value)}
          className="h-7 w-full rounded-md border border-border bg-transparent px-2 text-2xs outline-none focus:border-primary"
        >
          {operators.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
        {needsValue && (
          <input
            type="text"
            value={value ?? ''}
            onChange={(e) => onValueChange?.(e.target.value)}
            placeholder="Value..."
            className="h-7 w-full rounded-md border border-border bg-transparent px-2 text-2xs outline-none placeholder:text-foreground/40 focus:border-primary"
            onKeyDown={(e) => {
              if (e.key === 'Enter') onApply?.();
            }}
            autoFocus
          />
        )}
      </div>
      <div className="flex items-center justify-between border-t border-border-subtle px-2.5 py-2">
        <Button variant="ghost" size="xs" onClick={onBack} type="button">
          Back
        </Button>
        <Button
          variant="primary"
          size="xs"
          onClick={onApply}
          type="button"
          disabled={needsValue && !value}
        >
          Apply
        </Button>
      </div>
    </div>
  ),
);
FilterBarOperatorForm.displayName = 'FilterBar.OperatorForm';

// --- Compose ---

export const FilterBar = Object.assign(FilterBarRoot, {
  Trigger: FilterBarTrigger,
  Content: FilterBarContent,
  Badge: FilterBarBadge,
  AddButton: FilterBarAddButton,
  Popover: FilterBarPopover,
  FieldList: FilterBarFieldList,
  FieldItem: FilterBarFieldItem,
  OperatorForm: FilterBarOperatorForm,
});
