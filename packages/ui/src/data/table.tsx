import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ComponentProps } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '../lib/cn';
import { Icon } from '../primitives/icon';
import { Skeleton } from '../primitives/skeleton';

// --- Table (Root) ---

const tableVariants = cva('w-full border-collapse', {
  variants: {
    variant: {
      card: 'bg-card text-card-foreground',
      flat: '',
    },
  },
  defaultVariants: { variant: 'flat' },
});

export type TableProps = ComponentProps<'div'> & VariantProps<typeof tableVariants>;

const TableRoot = forwardRef<HTMLDivElement, TableProps>(
  ({ className, variant, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="table"
      className={cn(
        'w-full',
        variant === 'card' && 'rounded-lg border border-border-subtle overflow-hidden',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
TableRoot.displayName = 'Table';

// --- Table.Content (wraps the actual <table>) ---

export type TableContentProps = ComponentProps<'div'>;

const TableContent = forwardRef<HTMLDivElement, TableContentProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="table-content"
      className={cn('w-full overflow-auto', className)}
      {...props}
    >
      <table className="w-full border-collapse">{children}</table>
    </div>
  ),
);
TableContent.displayName = 'Table.Content';

// --- Table.Header ---

export type TableHeaderProps = ComponentProps<'thead'>;

const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      data-slot="table-header"
      className={cn('border-b border-border-subtle', className)}
      {...props}
    />
  ),
);
TableHeader.displayName = 'Table.Header';

// --- Table.Body ---

export type TableBodyProps = ComponentProps<'tbody'>;

const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} data-slot="table-body" className={cn('', className)} {...props} />
  ),
);
TableBody.displayName = 'Table.Body';

// --- Table.Row ---

export type TableRowProps = ComponentProps<'tr'> & {
  /** Apply striped background */
  striped?: boolean;
  /** Whether the row is selected */
  selected?: boolean;
};

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, striped, selected, onClick, ...props }, ref) => (
    <tr
      ref={ref}
      data-slot="table-row"
      data-selected={selected || undefined}
      className={cn(
        'border-b border-border-subtle last:border-b-0',
        striped && 'bg-foreground/2',
        onClick && 'cursor-pointer hover:bg-foreground/4',
        selected && 'bg-foreground/6',
        className,
      )}
      onClick={onClick}
      {...props}
    />
  ),
);
TableRow.displayName = 'Table.Row';

// --- Table.Head ---

export type TableHeadProps = ComponentProps<'th'> & {
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Whether the column is sortable */
  sortable?: boolean;
  /** Current sort direction */
  sorted?: 'asc' | 'desc' | null;
  /** Sort click handler */
  onSort?: () => void;
  /** Column width */
  width?: string;
};

const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, align = 'left', sortable, sorted, onSort, width, children, ...props }, ref) => {
    const alignClass =
      align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

    return (
      <th
        ref={ref}
        data-slot="table-head"
        className={cn(
          'px-5 py-2.5 text-xs font-medium text-foreground/50',
          alignClass,
          sortable && 'cursor-pointer select-none transition-colors hover:text-foreground',
          className,
        )}
        style={width ? { width } : undefined}
        onClick={sortable ? onSort : undefined}
        {...props}
      >
        <span className="inline-flex items-center gap-1">
          {children}
          {sortable && sorted === 'asc' && (
            <Icon icon={ChevronUp} size="sm" className="text-foreground" />
          )}
          {sortable && sorted === 'desc' && (
            <Icon icon={ChevronDown} size="sm" className="text-foreground" />
          )}
          {sortable && !sorted && <Icon icon={ChevronsUpDown} size="sm" className="opacity-40" />}
        </span>
      </th>
    );
  },
);
TableHead.displayName = 'Table.Head';

// --- Table.Cell ---

export type TableCellProps = ComponentProps<'td'> & {
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
};

const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, align = 'left', ...props }, ref) => {
    const alignClass =
      align === 'center'
        ? 'text-center'
        : align === 'right'
          ? 'text-right tabular-nums'
          : 'text-left';

    return (
      <td
        ref={ref}
        data-slot="table-cell"
        className={cn('px-5 py-2.5 text-2xs text-foreground', alignClass, className)}
        {...props}
      />
    );
  },
);
TableCell.displayName = 'Table.Cell';

// --- Table.SelectCell ---

export type TableSelectCellProps = ComponentProps<'td'> & {
  /** Row number to display when not hovered */
  rowNumber: number;
  /** Whether this row is selected */
  selected?: boolean;
  /** Called when selection state changes */
  onSelectChange?: (selected: boolean) => void;
};

const TableSelectCell = forwardRef<HTMLTableCellElement, TableSelectCellProps>(
  ({ className, rowNumber, selected, onSelectChange, ...props }, ref) => (
    <td
      ref={ref}
      data-slot="table-select-cell"
      className={cn(
        'group/select w-12 px-3 py-2.5 text-center text-xs text-foreground/50',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'inline-flex items-center justify-center',
          selected && 'hidden',
          'group-hover/select:hidden',
        )}
      >
        {rowNumber}
      </span>
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => onSelectChange?.(e.target.checked)}
        className={cn(
          'size-3.5 cursor-pointer rounded-sm border border-border accent-primary',
          !selected && 'hidden group-hover/select:inline-flex',
          selected && 'inline-flex',
        )}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Select row ${rowNumber}`}
      />
    </td>
  ),
);
TableSelectCell.displayName = 'Table.SelectCell';

// --- Table.SelectHead ---

export type TableSelectHeadProps = ComponentProps<'th'> & {
  /** Whether all rows are selected */
  allSelected?: boolean;
  /** Whether some rows are selected (indeterminate) */
  indeterminate?: boolean;
  /** Called when select-all changes */
  onSelectAll?: (selected: boolean) => void;
};

const TableSelectHead = forwardRef<HTMLTableCellElement, TableSelectHeadProps>(
  ({ className, allSelected, indeterminate, onSelectAll, ...props }, ref) => (
    <th
      ref={ref}
      data-slot="table-select-head"
      className={cn('w-12 px-3 py-2.5 text-center', className)}
      {...props}
    >
      <input
        type="checkbox"
        checked={allSelected}
        ref={(el) => {
          if (el) el.indeterminate = !!indeterminate;
        }}
        onChange={(e) => onSelectAll?.(e.target.checked)}
        className="size-3.5 cursor-pointer rounded-sm border border-border accent-primary"
        aria-label="Select all rows"
      />
    </th>
  ),
);
TableSelectHead.displayName = 'Table.SelectHead';

// --- Table.Empty ---

export type TableEmptyProps = ComponentProps<'tr'> & {
  /** Number of columns to span */
  colSpan: number;
};

const TableEmpty = forwardRef<HTMLTableRowElement, TableEmptyProps>(
  ({ className, colSpan, children, ...props }, ref) => (
    <tr ref={ref} data-slot="table-empty" {...props}>
      <td
        colSpan={colSpan}
        className={cn('px-5 py-8 text-center text-2xs text-foreground/50', className)}
      >
        {children ?? 'No data'}
      </td>
    </tr>
  ),
);
TableEmpty.displayName = 'Table.Empty';

// --- Table.Skeleton ---

export type TableSkeletonProps = ComponentProps<'tbody'> & {
  /** Number of columns */
  columns: number;
  /** Number of skeleton rows */
  rows?: number;
};

const TableSkeletonBody = forwardRef<HTMLTableSectionElement, TableSkeletonProps>(
  ({ className, columns, rows = 5, ...props }, ref) => (
    <tbody ref={ref} data-slot="table-skeleton" className={className} {...props}>
      {Array.from({ length: rows }, (_, i) => (
        <tr key={i} className="border-b border-border-subtle last:border-b-0">
          {Array.from({ length: columns }, (_, j) => (
            <td key={j} className="px-5 py-2.5">
              <Skeleton width="80%" height="1rem" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  ),
);
TableSkeletonBody.displayName = 'Table.Skeleton';

// --- Table.Footer ---

export type TableFooterProps = ComponentProps<'div'>;

const TableFooter = forwardRef<HTMLDivElement, TableFooterProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="table-footer"
    className={cn(
      'flex items-center justify-between border-t border-border-subtle px-5 py-2.5',
      className,
    )}
    {...props}
  />
));
TableFooter.displayName = 'Table.Footer';

// --- Compose ---

export const Table = Object.assign(TableRoot, {
  Content: TableContent,
  Header: TableHeader,
  Body: TableBody,
  Row: TableRow,
  Head: TableHead,
  Cell: TableCell,
  SelectCell: TableSelectCell,
  SelectHead: TableSelectHead,
  Empty: TableEmpty,
  Skeleton: TableSkeletonBody,
  Footer: TableFooter,
});

export { tableVariants };
