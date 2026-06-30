import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';
import { Icon } from '../primitives/icon';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  GripVertical,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  Link2,
  List,
  DollarSign,
  Code,
  Paperclip,
  FileText,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// --- Datagrid (Root) ---

export type DatagridProps = ComponentProps<'div'> & {
  /** CSS grid-template-columns value */
  gridTemplate?: string;
  /** Maximum height before scrolling */
  maxHeight?: number | string;
};

const DatagridRoot = forwardRef<HTMLDivElement, DatagridProps>(
  ({ className, gridTemplate: _gridTemplate, maxHeight, style, ...props }, ref) => (
    <div
      ref={ref}
      role="grid"
      data-slot="datagrid"
      tabIndex={0}
      className={cn(
        'flex flex-col flex-1 min-h-0 bg-card text-card-foreground text-2xs ring-1 ring-border overflow-hidden outline-none',
        className,
      )}
      style={{ ...style, maxHeight }}
      {...props}
    />
  ),
);
DatagridRoot.displayName = 'Datagrid';

// --- Datagrid.ScrollArea ---

export type DatagridScrollAreaProps = ComponentProps<'div'>;

const DatagridScrollArea = forwardRef<HTMLDivElement, DatagridScrollAreaProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="datagrid-scroll-area"
      className={cn('flex-1 min-h-0 overflow-auto', className)}
      {...props}
    />
  ),
);
DatagridScrollArea.displayName = 'Datagrid.ScrollArea';

// --- Datagrid.Header ---

export type DatagridHeaderProps = ComponentProps<'div'> & {
  /** CSS grid-template-columns */
  gridTemplate?: string;
};

const DatagridHeader = forwardRef<HTMLDivElement, DatagridHeaderProps>(
  ({ className, gridTemplate, style, ...props }, ref) => (
    <div
      ref={ref}
      role="row"
      data-slot="datagrid-header"
      className={cn('sticky top-0 z-20 grid border-b border-border bg-card', className)}
      style={{ ...style, gridTemplateColumns: gridTemplate }}
      {...props}
    />
  ),
);
DatagridHeader.displayName = 'Datagrid.Header';

// --- Field type icon mapping ---

const fieldTypeIcons: Record<string, LucideIcon> = {
  string: Type,
  text: FileText,
  int: Hash,
  decimal: Hash,
  money: DollarSign,
  date: Calendar,
  datetime: Calendar,
  boolean: ToggleLeft,
  enum: List,
  link: Link2,
  manyToMany: Link2,
  json: Code,
  code: Code,
  attachment: Paperclip,
  attachments: Paperclip,
  sequence: Hash,
};

// --- Datagrid.HeaderCell ---

export type DatagridHeaderCellProps = ComponentProps<'div'> & {
  /** Whether the column is sortable */
  sortable?: boolean;
  /** Current sort direction */
  sorted?: 'asc' | 'desc' | null;
  /** Whether the column is reorderable */
  reorderable?: boolean;
  /** Field type for icon display */
  fieldType?: string;
  /** Sort click handler */
  onSort?: () => void;
};

const DatagridHeaderCell = forwardRef<HTMLDivElement, DatagridHeaderCellProps>(
  ({ className, sortable, sorted, reorderable, fieldType, onSort, children, ...props }, ref) => {
    const typeIcon = fieldType ? fieldTypeIcons[fieldType] : undefined;

    return (
      <div
        ref={ref}
        role="columnheader"
        data-slot="datagrid-header-cell"
        className={cn(
          'flex items-center gap-1 px-3 h-9 text-xs font-medium text-foreground/50 border-r border-border last:border-r-0',
          sortable && 'cursor-pointer select-none hover:text-foreground',
          className,
        )}
        onClick={sortable ? onSort : undefined}
        {...props}
      >
        {reorderable && (
          <Icon icon={GripVertical} size="sm" className="shrink-0 text-foreground/30 cursor-grab" />
        )}
        {typeIcon && <Icon icon={typeIcon} size="sm" className="shrink-0 opacity-50" />}
        <span className="flex-1 truncate">{children}</span>
        {sortable && sorted === 'asc' && (
          <Icon icon={ChevronUp} size="sm" className="text-foreground" />
        )}
        {sortable && sorted === 'desc' && (
          <Icon icon={ChevronDown} size="sm" className="text-foreground" />
        )}
        {sortable && !sorted && <Icon icon={ChevronsUpDown} size="sm" className="opacity-40" />}
      </div>
    );
  },
);
DatagridHeaderCell.displayName = 'Datagrid.HeaderCell';

// --- Datagrid.ResizeHandle ---

export type DatagridResizeHandleProps = ComponentProps<'div'> & {
  /** Whether currently resizing */
  resizing?: boolean;
};

const DatagridResizeHandle = forwardRef<HTMLDivElement, DatagridResizeHandleProps>(
  ({ className, resizing, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="datagrid-resize-handle"
      className={cn(
        'absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none',
        'hover:bg-primary/50',
        resizing && 'bg-primary',
        className,
      )}
      {...props}
    />
  ),
);
DatagridResizeHandle.displayName = 'Datagrid.ResizeHandle';

// --- Datagrid.Body ---

export type DatagridBodyProps = ComponentProps<'div'> & {
  /** Total height for virtual scroll spacer */
  totalHeight?: number;
};

const DatagridBody = forwardRef<HTMLDivElement, DatagridBodyProps>(
  ({ className, totalHeight, style, ...props }, ref) => (
    <div
      ref={ref}
      role="rowgroup"
      data-slot="datagrid-body"
      className={cn('relative', className)}
      style={{ ...style, height: totalHeight }}
      {...props}
    />
  ),
);
DatagridBody.displayName = 'Datagrid.Body';

// --- Datagrid.Row ---

export type DatagridRowProps = ComponentProps<'div'> & {
  /** CSS grid-template-columns */
  gridTemplate?: string;
  /** Row height in pixels */
  rowHeight?: number;
  /** Vertical offset for virtual positioning */
  offset?: number;
  /** Whether row is selected */
  selected?: boolean;
  /** Whether row has an active cell */
  active?: boolean;
};

const DatagridRow = forwardRef<HTMLDivElement, DatagridRowProps>(
  ({ className, gridTemplate, rowHeight, offset, selected, active, style, ...props }, ref) => (
    <div
      ref={ref}
      role="row"
      data-slot="datagrid-row"
      data-selected={selected || undefined}
      data-active={active || undefined}
      className={cn(
        'absolute left-0 min-w-full grid border-b border-border/50',
        selected && 'bg-primary/5',
        active && 'bg-foreground/3',
        !selected && !active && 'hover:bg-foreground/3',
        className,
      )}
      style={{
        ...style,
        gridTemplateColumns: gridTemplate,
        height: rowHeight,
        transform: offset != null ? `translateY(${offset}px)` : undefined,
      }}
      {...props}
    />
  ),
);
DatagridRow.displayName = 'Datagrid.Row';

// --- Datagrid.Cell ---

export type DatagridCellProps = ComponentProps<'div'> & {
  /** Whether this cell is the active (focused) cell */
  active?: boolean;
  /** Whether this cell is in edit mode */
  editing?: boolean;
  /** Whether this cell has a pending save */
  pending?: boolean;
};

const DatagridCell = forwardRef<HTMLDivElement, DatagridCellProps>(
  ({ className, active, editing, pending, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="gridcell"
        data-slot="datagrid-cell"
        data-active={active || undefined}
        data-editing={editing || undefined}
        className={cn(
          'flex items-center px-3 border-r border-border/50 last:border-r-0 truncate',
          active && !editing && 'ring-2 ring-inset ring-primary',
          editing && 'ring-2 ring-inset ring-primary bg-card px-3 py-0',
          pending && 'bg-amber-50/50',
          className,
        )}
        {...props}
      />
    );
  },
);
DatagridCell.displayName = 'Datagrid.Cell';

// --- Datagrid.SelectCell ---

export type DatagridSelectCellProps = ComponentProps<'div'> & {
  /** Row number to display when not hovered */
  rowNumber?: number;
  /** Whether the row is selected */
  selected?: boolean;
  /** Called when checkbox state changes */
  onSelectChange?: (checked: boolean) => void;
};

const DatagridSelectCell = forwardRef<HTMLDivElement, DatagridSelectCellProps>(
  ({ className, rowNumber, selected, onSelectChange, ...props }, ref) => (
    <div
      ref={ref}
      role="gridcell"
      data-slot="datagrid-select-cell"
      className={cn(
        'group/select flex items-center justify-center border-r border-border/50 text-xs text-foreground/50',
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
    </div>
  ),
);
DatagridSelectCell.displayName = 'Datagrid.SelectCell';

// --- Datagrid.SelectHeader ---

export type DatagridSelectHeaderProps = ComponentProps<'div'> & {
  /** Whether all rows are selected */
  allSelected?: boolean;
  /** Whether some rows are selected */
  indeterminate?: boolean;
  /** Called when select-all changes */
  onSelectAll?: (checked: boolean) => void;
};

const DatagridSelectHeader = forwardRef<HTMLDivElement, DatagridSelectHeaderProps>(
  ({ className, allSelected, indeterminate, onSelectAll, ...props }, ref) => (
    <div
      ref={ref}
      role="columnheader"
      data-slot="datagrid-select-header"
      className={cn('flex items-center justify-center border-r border-border', className)}
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
    </div>
  ),
);
DatagridSelectHeader.displayName = 'Datagrid.SelectHeader';

// --- Datagrid.Footer ---

export type DatagridFooterProps = ComponentProps<'div'>;

const DatagridFooter = forwardRef<HTMLDivElement, DatagridFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="datagrid-footer"
      className={cn(
        'flex items-center justify-between border-t border-border px-3 py-2',
        className,
      )}
      {...props}
    />
  ),
);
DatagridFooter.displayName = 'Datagrid.Footer';

// --- Datagrid.FooterCount ---

export type DatagridFooterCountProps = ComponentProps<'span'> & {
  /** Number of visible records */
  count: number;
  /** Total records (if known) */
  total?: number;
};

const DatagridFooterCount = forwardRef<HTMLSpanElement, DatagridFooterCountProps>(
  ({ className, count, total, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="datagrid-footer-count"
      className={cn('text-xs text-muted-foreground tabular-nums', className)}
      {...props}
    >
      {total != null ? `${count} of ${total} records` : `${count} records`}
    </span>
  ),
);
DatagridFooterCount.displayName = 'Datagrid.FooterCount';

// --- Datagrid.PinnedSection ---

export type DatagridPinnedSectionProps = ComponentProps<'div'> & {
  /** Which side this section is pinned to */
  side: 'left' | 'right';
  /** Whether the center content is scrolled (shows shadow) */
  showShadow?: boolean;
};

const DatagridPinnedSection = forwardRef<HTMLDivElement, DatagridPinnedSectionProps>(
  ({ className, side, showShadow, style, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="datagrid-pinned-section"
      data-side={side}
      className={cn(
        'flex flex-col flex-shrink-0 relative z-20 bg-card overflow-visible',
        side === 'left' && showShadow && 'shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]',
        side === 'right' && showShadow && 'shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)]',
        className,
      )}
      style={style}
      {...props}
    />
  ),
);
DatagridPinnedSection.displayName = 'Datagrid.PinnedSection';

// --- Datagrid.ScrollableSection ---

export type DatagridScrollableSectionProps = ComponentProps<'div'>;

const DatagridScrollableSection = forwardRef<HTMLDivElement, DatagridScrollableSectionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="datagrid-scrollable-section"
      className={cn('flex flex-col flex-1 min-w-0 overflow-x-auto relative z-10', className)}
      {...props}
    />
  ),
);
DatagridScrollableSection.displayName = 'Datagrid.ScrollableSection';

// --- Compose ---

export const Datagrid = Object.assign(DatagridRoot, {
  ScrollArea: DatagridScrollArea,
  Header: DatagridHeader,
  HeaderCell: DatagridHeaderCell,
  ResizeHandle: DatagridResizeHandle,
  Body: DatagridBody,
  Row: DatagridRow,
  Cell: DatagridCell,
  SelectCell: DatagridSelectCell,
  SelectHeader: DatagridSelectHeader,
  Footer: DatagridFooter,
  FooterCount: DatagridFooterCount,
  PinnedSection: DatagridPinnedSection,
  ScrollableSection: DatagridScrollableSection,
});
