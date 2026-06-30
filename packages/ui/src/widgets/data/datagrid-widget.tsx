import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Plus,
  ArrowUpNarrowWide,
  ArrowDownNarrowWide,
  XCircle,
  Filter,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
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
  PanelLeftClose,
  PanelRightClose,
  PinOff,
} from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '../../lib/cn';
import { Datagrid } from '../../data/datagrid';
import { FilterBar } from '../../data/filter-bar';
import { getOperatorsForType, operatorSymbol } from '../../data/filter-operators';
import { Button } from '../../primitives/button';
import { Icon } from '../../primitives/icon';
import { Popover } from '../../overlays/popover';
import { renderDisplay, renderEditor, type CellColumn } from './cell-renderers';
import { useColumnState, type ColumnDef } from './use-column-state';
import { useColumnResize } from './use-column-resize';
import {
  DatagridDndProvider,
  useSortableHeaderCell,
  DragOverlayCell,
} from './datagrid-dnd-context';
import type { WidgetComponentProps, WidgetNode } from '../types';
import type { FilterFieldDeclaration, ActiveFilter } from '@rangka/shared';

interface CellRef {
  rowId: string;
  field: string;
}

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

// --- Main Widget ---

export function DatagridWidget({ props, bind, on, childNodes }: WidgetComponentProps) {
  const selectable = (props.selectable as boolean) ?? true;
  const rowHeightKey = (props.rowHeight as 'compact' | 'default' | 'comfortable') ?? 'default';
  const maxHeight = props.maxHeight as number | undefined;
  const emptyText = (props.emptyText as string) ?? 'No records';
  const loading = props.loading as boolean | undefined;
  const addRow = (props.addRow as boolean) ?? false;
  const editable = (props.editable as boolean) ?? true;

  const sorted = props.sorted as { field: string; direction: 'asc' | 'desc' } | undefined;
  const selectedRows = (props.selectedRows as string[]) ?? [];
  const filterFields = (props.filterFields as FilterFieldDeclaration[]) ?? [];
  const activeFilters = (props.activeFilters as ActiveFilter[]) ?? [];

  const columns = resolveColumns(props.columns as ColumnDef[] | undefined, childNodes);
  const records = (bind.value as Record<string, unknown>[]) ?? [];

  const showSkeleton = loading && records.length === 0;

  const rowHeights = { compact: 32, default: 40, comfortable: 52 };
  const rowHeight = rowHeights[rowHeightKey];

  // Column state (resize, reorder, pinning)
  const colState = useColumnState(columns);
  const { pinnedLeftColumns, centerColumns, pinnedRightColumns, hasPinning } = colState;

  // Resize
  const { startResize } = useColumnResize({
    onResize: (field, width) => colState.resize(field, width),
    onResizeEnd: (field, width) => on.columnResize?.(field, width),
  });

  // Reorder
  const handleReorder = useCallback(
    (activeField: string, overField: string) => {
      const order = colState.state.order;
      const fromIndex = order.indexOf(activeField);
      const toIndex = order.indexOf(overField);
      if (fromIndex === -1 || toIndex === -1) return;
      colState.reorder(fromIndex, toIndex);
      on.columnReorder?.(colState.state.order);
    },
    [colState, on],
  );

  // Grid templates
  const buildGridTemplate = (cols: ColumnDef[], includeSelect = false) =>
    (includeSelect ? '40px ' : '') +
    cols.map((col) => `${colState.getWidth(col.field)}px`).join(' ');

  // Edit state
  const [activeCell, setActiveCell] = useState<CellRef | null>(null);
  const [editingCell, setEditingCell] = useState<CellRef | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const localValues = useRef<Map<string, unknown>>(new Map());

  const cellKey = (rowId: string, field: string) => `${rowId}:${field}`;

  const getCellValue = (row: Record<string, unknown>, rowId: string, field: string) => {
    const key = cellKey(rowId, field);
    if (localValues.current.has(key)) {
      const localVal = localValues.current.get(key);
      if (row[field] === localVal) {
        localValues.current.delete(key);
      }
      return localVal;
    }
    return row[field];
  };

  // TanStack Virtual
  const virtualizer = useVirtualizer({
    count: records.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  });

  useEffect(() => {
    if (!activeCell && !editingCell) return;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (gridRef.current && gridRef.current.contains(target)) return;
      const portal =
        (target as HTMLElement).closest?.('[data-slot="datagrid-cell-portal"]') ||
        (target as HTMLElement).closest?.('.fixed.z-50');
      if (portal) return;

      setActiveCell(null);
      setEditingCell(null);
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [activeCell, editingCell]);

  const getSortState = (field: string): 'asc' | 'desc' | null => {
    if (!sorted) return null;
    if (sorted.field === field) return sorted.direction;
    return null;
  };

  const handleCellClick = useCallback(
    (rowId: string, field: string, col: ColumnDef) => {
      const isAlreadyActive = activeCell?.rowId === rowId && activeCell?.field === field;

      if (isAlreadyActive && editable && col.editable !== false) {
        setEditingCell({ rowId, field });
      } else {
        setActiveCell({ rowId, field });
        setEditingCell(null);
      }
      on.cellClick?.(rowId, field);
    },
    [activeCell, editable, on],
  );

  const handleCellKeyDown = useCallback(
    (e: React.KeyboardEvent, rowId: string, field: string, col: ColumnDef) => {
      if (e.key === 'Enter' && !editingCell && editable && col.editable !== false) {
        setEditingCell({ rowId, field });
      } else if (e.key === 'Escape' && editingCell) {
        setEditingCell(null);
        setActiveCell({ rowId, field });
      }
    },
    [editingCell, editable],
  );

  const handleCommit = useCallback(
    (rowId: string, field: string, value: unknown) => {
      localValues.current.set(cellKey(rowId, field), value);
      setEditingCell(null);
      setActiveCell({ rowId, field });
      on.cellChange?.(rowId, field, value);
    },
    [on],
  );

  const handleCancel = useCallback((rowId: string, field: string) => {
    setEditingCell(null);
    setActiveCell({ rowId, field });
  }, []);

  const isCellActive = (rowId: string, field: string) =>
    activeCell?.rowId === rowId && activeCell?.field === field;

  const isCellEditing = (rowId: string, field: string) =>
    editingCell?.rowId === rowId && editingCell?.field === field;

  const toCellColumn = (col: ColumnDef): CellColumn => ({
    field: col.field,
    fieldType: col.fieldType,
    options: col.options,
    currency: col.currency,
    precision: col.precision,
  });

  const hasActiveFilters = activeFilters.length > 0;

  // Horizontal scroll shadow detection
  const [scrollShadow, setScrollShadow] = useState<{ left: boolean; right: boolean }>({
    left: false,
    right: false,
  });
  const horizontalScrollRef = useRef<HTMLDivElement>(null);

  const handleHorizontalScroll = useCallback(() => {
    const el = horizontalScrollRef.current;
    if (!el) return;
    setScrollShadow({
      left: el.scrollLeft > 0,
      right: el.scrollLeft < el.scrollWidth - el.clientWidth - 1,
    });
  }, []);

  // --- Render cells for a section ---
  const renderCells = (sectionColumns: ColumnDef[], row: Record<string, unknown>, rowId: string) =>
    sectionColumns.map((col) => {
      const cellActive = isCellActive(rowId, col.field);
      const cellEditing = isCellEditing(rowId, col.field);
      const cellValue = getCellValue(row, rowId, col.field);

      return (
        <Datagrid.Cell
          key={col.field}
          active={cellActive}
          editing={cellEditing}
          onClick={(e) => {
            e.stopPropagation();
            handleCellClick(rowId, col.field, col);
          }}
          onKeyDown={(e) => handleCellKeyDown(e, rowId, col.field, col)}
          tabIndex={cellActive ? 0 : -1}
        >
          {cellEditing ? (
            <EditableCell
              fieldType={col.fieldType}
              value={cellValue}
              col={toCellColumn(col)}
              onCommit={(val) => handleCommit(rowId, col.field, val)}
              onCancel={() => handleCancel(rowId, col.field)}
            />
          ) : (
            renderDisplay(col.fieldType, cellValue, toCellColumn(col))
          )}
        </Datagrid.Cell>
      );
    });

  // --- Render header cells for a section ---
  const renderHeaderCells = (sectionColumns: ColumnDef[]) =>
    sectionColumns.map((col) => (
      <SortableHeaderCell
        key={col.field}
        col={col}
        sorted={getSortState(col.field)}
        pinned={colState.state.pinned[col.field] || false}
        filterFields={filterFields}
        width={colState.getWidth(col.field)}
        onSort={(direction) => on.sort?.(col.field, direction)}
        onSetFilter={(field, operator, value) => on.setFilter?.(field, operator, value)}
        onPin={(side) => {
          colState.pin(col.field, side);
          on.columnPin?.(col.field, side);
        }}
        onUnpin={() => {
          colState.unpin(col.field);
          on.columnPin?.(col.field, false);
        }}
        onResizeStart={(e) => startResize(col.field, colState.getWidth(col.field), e)}
      />
    ));

  // --- Render a section (header + body) ---
  const renderSection = (
    sectionColumns: ColumnDef[],
    gridTemplate: string,
    showSelect: boolean,
  ) => (
    <>
      <Datagrid.Header gridTemplate={gridTemplate}>
        {showSelect && (
          <Datagrid.SelectHeader
            allSelected={selectedRows.length === records.length && records.length > 0}
            indeterminate={selectedRows.length > 0 && selectedRows.length < records.length}
            onSelectAll={(checked) => on.selectAll?.(checked)}
          />
        )}
        <DatagridDndProvider
          items={sectionColumns.map((c) => c.field)}
          onReorder={handleReorder}
          renderOverlay={(field) => {
            const col = sectionColumns.find((c) => c.field === field);
            return col ? <DragOverlayCell label={col.label} /> : null;
          }}
        >
          {renderHeaderCells(sectionColumns)}
        </DatagridDndProvider>
      </Datagrid.Header>

      <Datagrid.Body totalHeight={showSkeleton ? undefined : virtualizer.getTotalSize()}>
        {showSkeleton ? (
          Array.from({ length: 10 }, (_, i) => (
            <Datagrid.Row
              key={`skeleton-${i}`}
              gridTemplate={gridTemplate}
              rowHeight={rowHeight}
              offset={i * rowHeight}
            >
              {showSelect && <Datagrid.Cell />}
              {sectionColumns.map((col) => (
                <Datagrid.Cell key={col.field}>
                  <span className="h-4 w-3/4 animate-pulse rounded bg-foreground/10" />
                </Datagrid.Cell>
              ))}
            </Datagrid.Row>
          ))
        ) : records.length === 0 ? (
          <Datagrid.Row gridTemplate="1fr" rowHeight={rowHeight * 3} offset={0}>
            <Datagrid.Cell className="text-muted-foreground justify-center">
              {emptyText}
            </Datagrid.Cell>
          </Datagrid.Row>
        ) : (
          virtualizer.getVirtualItems().map((virtualRow) => {
            const row = records[virtualRow.index];
            const idx = virtualRow.index;
            const rowId = (row.id as string) ?? String(idx);
            const isSelected = selectedRows.includes(rowId);
            return (
              <Datagrid.Row
                key={rowId}
                gridTemplate={gridTemplate}
                rowHeight={rowHeight}
                offset={virtualRow.start}
                selected={isSelected}
                onClick={() => on.rowClick?.(row)}
              >
                {showSelect && (
                  <Datagrid.SelectCell
                    rowNumber={idx + 1}
                    selected={isSelected}
                    onSelectChange={(checked) => on.select?.(row, checked)}
                  />
                )}
                {renderCells(sectionColumns, row, rowId)}
              </Datagrid.Row>
            );
          })
        )}
      </Datagrid.Body>
    </>
  );

  // --- Main render ---
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {hasActiveFilters && (
        <DatagridFilterChips
          filterFields={filterFields}
          activeFilters={activeFilters}
          onRemoveFilter={(field, operator) => on.removeFilter?.(field, operator)}
        />
      )}
      <Datagrid ref={gridRef} maxHeight={maxHeight}>
        <Datagrid.ScrollArea ref={scrollRef}>
          {hasPinning ? (
            <div className="flex min-h-0">
              {pinnedLeftColumns.length > 0 && (
                <Datagrid.PinnedSection
                  side="left"
                  showShadow={scrollShadow.left}
                  style={{ width: colState.pinnedLeftWidth + (selectable ? 40 : 0) }}
                >
                  {renderSection(
                    pinnedLeftColumns,
                    buildGridTemplate(pinnedLeftColumns, selectable),
                    selectable,
                  )}
                </Datagrid.PinnedSection>
              )}
              <Datagrid.ScrollableSection
                ref={horizontalScrollRef}
                onScroll={handleHorizontalScroll}
              >
                {renderSection(
                  centerColumns,
                  buildGridTemplate(centerColumns, !pinnedLeftColumns.length && selectable),
                  !pinnedLeftColumns.length && selectable,
                )}
              </Datagrid.ScrollableSection>
              {pinnedRightColumns.length > 0 && (
                <Datagrid.PinnedSection
                  side="right"
                  showShadow={scrollShadow.right}
                  style={{ width: colState.pinnedRightWidth }}
                >
                  {renderSection(
                    pinnedRightColumns,
                    buildGridTemplate(pinnedRightColumns, false),
                    false,
                  )}
                </Datagrid.PinnedSection>
              )}
            </div>
          ) : (
            renderSection(
              colState.orderedColumns,
              buildGridTemplate(colState.orderedColumns, selectable),
              selectable,
            )
          )}
        </Datagrid.ScrollArea>

        <Datagrid.Footer>
          {addRow && (
            <Button variant="ghost" size="xs" onClick={() => on.addRow?.()}>
              <Icon icon={Plus} size="sm" />
              <span>Add row</span>
            </Button>
          )}
          {!addRow && <span />}
          <Datagrid.FooterCount count={records.length} total={props.total as number | undefined} />
        </Datagrid.Footer>
      </Datagrid>
    </div>
  );
}

// --- Editable Cell ---

const IMMEDIATE_COMMIT_TYPES = new Set([
  'boolean',
  'enum',
  'link',
  'date',
  'datetime',
  'many-to-many',
]);

interface EditableCellProps {
  fieldType: string | undefined;
  value: unknown;
  col: CellColumn;
  onCommit: (value: unknown) => void;
  onCancel: () => void;
}

function EditableCell({ fieldType, value, col, onCommit, onCancel }: EditableCellProps) {
  const [draft, setDraft] = useState<unknown>(value);
  const committed = useRef(false);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;
  const isImmediate = IMMEDIATE_COMMIT_TYPES.has(fieldType ?? '');

  const handleChange = useCallback(
    (newValue: unknown) => {
      if (committed.current) return;
      if (isImmediate) {
        committed.current = true;
        onCommitRef.current(newValue);
      } else {
        setDraft(newValue);
      }
    },
    [isImmediate],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      if (committed.current || isImmediate) return;
      const related = e.relatedTarget as HTMLElement | null;
      if (related?.closest?.('.fixed.z-50')) return;
      committed.current = true;
      onCommitRef.current(draft);
    },
    [draft, isImmediate],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isImmediate) {
        e.preventDefault();
        if (committed.current) return;
        committed.current = true;
        onCommitRef.current(draft);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (committed.current) return;
        committed.current = true;
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [draft, isImmediate, onCancel]);

  return (
    <div onBlur={isImmediate ? undefined : handleBlur} className="contents">
      {renderEditor(fieldType, isImmediate ? value : draft, handleChange, col)}
    </div>
  );
}

// --- Sortable Header Cell (with DnD + resize + popover) ---

interface SortableHeaderCellProps {
  col: ColumnDef;
  sorted: 'asc' | 'desc' | null;
  pinned: 'left' | 'right' | false;
  filterFields: FilterFieldDeclaration[];
  width: number;
  onSort: (direction: 'asc' | 'desc' | null) => void;
  onSetFilter: (field: string, operator: string, value: unknown) => void;
  onPin: (side: 'left' | 'right') => void;
  onUnpin: () => void;
  onResizeStart: (e: React.PointerEvent) => void;
}

function SortableHeaderCell({
  col,
  sorted,
  pinned,
  filterFields,
  width: _width,
  onSort,
  onSetFilter,
  onPin,
  onUnpin,
  onResizeStart,
}: SortableHeaderCellProps) {
  const { attributes, listeners, setNodeRef, style, isDragging } = useSortableHeaderCell(col.field);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [step, setStep] = useState<'menu' | 'filter'>('menu');
  const [operator, setOperator] = useState('');
  const [value, setValue] = useState('');

  const filterField = filterFields.find((f) => f.field === col.field);
  const operators = useMemo(
    () => (filterField ? getOperatorsForType(filterField.type) : []),
    [filterField],
  );

  const resetState = () => {
    setStep('menu');
    setOperator('');
    setValue('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    setPopoverOpen(isOpen);
    if (!isOpen) resetState();
  };

  const handleSortAsc = () => {
    onSort('asc');
    setPopoverOpen(false);
    resetState();
  };
  const handleSortDesc = () => {
    onSort('desc');
    setPopoverOpen(false);
    resetState();
  };
  const handleClearSort = () => {
    onSort(null);
    setPopoverOpen(false);
    resetState();
  };

  const handleFilterClick = () => {
    if (!filterField) return;
    setOperator(operators[0]?.value ?? 'eq');
    setStep('filter');
  };

  const handleApplyFilter = () => {
    if (!filterField) return;
    const op = operators.find((o) => o.value === operator);
    const filterValue = op?.needsValue === false ? (operator === 'eq' ? true : false) : value;
    onSetFilter(col.field, operator, filterValue);
    setPopoverOpen(false);
    resetState();
  };

  const typeIcon = col.fieldType ? fieldTypeIcons[col.fieldType] : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('relative flex items-center', isDragging && 'opacity-50')}
      {...attributes}
    >
      <Popover open={popoverOpen} onOpenChange={handleOpenChange}>
        <Popover.Trigger
          className={cn(
            'flex items-center gap-1 px-3 h-9 w-full text-xs font-medium text-foreground/50 border-r border-border',
            'cursor-pointer select-none hover:text-foreground hover:bg-foreground/4 transition-colors',
          )}
          {...listeners}
        >
          {typeIcon && <Icon icon={typeIcon} size="sm" className="shrink-0 opacity-50" />}
          <span className="flex-1 truncate text-left">{col.label}</span>
          {col.sortable !== false && sorted === 'asc' && (
            <Icon icon={ChevronUp} size="sm" className="text-foreground" />
          )}
          {col.sortable !== false && sorted === 'desc' && (
            <Icon icon={ChevronDown} size="sm" className="text-foreground" />
          )}
          {col.sortable !== false && !sorted && (
            <Icon icon={ChevronsUpDown} size="sm" className="opacity-40" />
          )}
        </Popover.Trigger>
        <Popover.Content side="bottom" align="start" className="w-52 p-0">
          {step === 'menu' ? (
            <div className="flex flex-col py-1">
              {col.sortable !== false && (
                <>
                  <PopoverMenuItem
                    icon={ArrowUpNarrowWide}
                    label="Sort ascending"
                    active={sorted === 'asc'}
                    onClick={handleSortAsc}
                  />
                  <PopoverMenuItem
                    icon={ArrowDownNarrowWide}
                    label="Sort descending"
                    active={sorted === 'desc'}
                    onClick={handleSortDesc}
                  />
                  {sorted && (
                    <PopoverMenuItem icon={XCircle} label="Clear sort" onClick={handleClearSort} />
                  )}
                </>
              )}
              {col.filterable !== false && filterField && (
                <>
                  <div className="my-1 border-t border-border" />
                  <PopoverMenuItem icon={Filter} label="Filter..." onClick={handleFilterClick} />
                </>
              )}
              <div className="my-1 border-t border-border" />
              {!pinned ? (
                <>
                  <PopoverMenuItem
                    icon={PanelLeftClose}
                    label="Pin to left"
                    onClick={() => {
                      onPin('left');
                      setPopoverOpen(false);
                    }}
                  />
                  <PopoverMenuItem
                    icon={PanelRightClose}
                    label="Pin to right"
                    onClick={() => {
                      onPin('right');
                      setPopoverOpen(false);
                    }}
                  />
                </>
              ) : (
                <PopoverMenuItem
                  icon={PinOff}
                  label="Unpin"
                  onClick={() => {
                    onUnpin();
                    setPopoverOpen(false);
                  }}
                />
              )}
            </div>
          ) : (
            <FilterBar.OperatorForm
              fieldLabel={col.label}
              operators={operators}
              operator={operator}
              onOperatorChange={setOperator}
              value={value}
              onValueChange={setValue}
              needsValue={operators.find((o) => o.value === operator)?.needsValue ?? true}
              onApply={handleApplyFilter}
              onBack={() => setStep('menu')}
            />
          )}
        </Popover.Content>
      </Popover>
      <Datagrid.ResizeHandle onPointerDown={onResizeStart} />
    </div>
  );
}

// --- Popover Menu Item ---

interface PopoverMenuItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick: () => void;
}

function PopoverMenuItem({ icon, label, active, onClick }: PopoverMenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 text-2xs transition-colors hover:bg-foreground/6',
        active ? 'text-primary font-medium' : 'text-foreground',
      )}
    >
      <Icon icon={icon} size="sm" className={active ? 'text-primary' : 'opacity-50'} />
      <span>{label}</span>
    </button>
  );
}

// --- Filter Chips ---

interface DatagridFilterChipsProps {
  filterFields: FilterFieldDeclaration[];
  activeFilters: ActiveFilter[];
  onRemoveFilter: (field: string, operator: string) => void;
}

function DatagridFilterChips({
  filterFields,
  activeFilters,
  onRemoveFilter,
}: DatagridFilterChipsProps) {
  const fieldLabelMap = useMemo(
    () => new Map(filterFields.map((f) => [f.field, f.label])),
    [filterFields],
  );
  const getFieldLabel = (field: string) => fieldLabelMap.get(field) ?? field;

  return (
    <FilterBar.Content>
      {activeFilters.map((f) => (
        <FilterBar.Badge
          key={`${f.field}__${f.operator}`}
          label={getFieldLabel(f.field)}
          operator={operatorSymbol(f.operator)}
          value={f.value != null ? String(f.value) : undefined}
          onRemove={() => onRemoveFilter(f.field, f.operator)}
        />
      ))}
    </FilterBar.Content>
  );
}

// --- Column Resolver ---

function resolveColumns(
  propColumns: ColumnDef[] | undefined,
  childNodes: WidgetNode[] | undefined,
): ColumnDef[] {
  if (propColumns && propColumns.length > 0) return propColumns;

  if (childNodes) {
    return childNodes
      .filter((node) => node.type === 'column')
      .map((node) => ({
        field: (node.props?.field as string) ?? '',
        label: (node.props?.label as string) ?? '',
        width: node.props?.width as number | string | undefined,
        sortable: (node.props?.sortable as boolean | undefined) ?? true,
        filterable: (node.props?.filterable as boolean | undefined) ?? true,
        editable: (node.props?.editable as boolean | undefined) ?? true,
        fieldType: node.props?.fieldType as string | undefined,
        options: node.props?.options as Array<{ value: string; label: string }> | undefined,
        currency: node.props?.currency as string | undefined,
        precision: node.props?.precision as number | undefined,
      }));
  }

  return [];
}

DatagridWidget.displayName = 'DatagridWidget';
