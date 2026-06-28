import { useState, useCallback, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Datagrid } from '../../data/datagrid';
import { Button } from '../../primitives/button';
import { Icon } from '../../primitives/icon';
import { renderDisplay, renderEditor, type CellColumn } from './cell-renderers';
import type { WidgetComponentProps, WidgetNode } from '../types';

interface ColumnDef {
  field: string;
  label: string;
  width?: number;
  sortable?: boolean;
  editable?: boolean;
  fieldType?: string;
  options?: Array<{ value: string; label: string }>;
  currency?: string;
  precision?: number;
}

interface CellRef {
  rowId: string;
  field: string;
}

export function DatagridWidget({ props, bind, on, childNodes }: WidgetComponentProps) {
  const selectable = (props.selectable as boolean) ?? true;
  const rowHeightKey = (props.rowHeight as 'compact' | 'default' | 'comfortable') ?? 'default';
  const maxHeight = props.maxHeight as number | undefined;
  const emptyText = (props.emptyText as string) ?? 'No records';
  const loading = props.loading as boolean | undefined;
  const fetching = props.fetching as boolean | undefined;
  const addRow = (props.addRow as boolean) ?? false;
  const editable = (props.editable as boolean) ?? false;

  const sorted = props.sorted as { field: string; direction: 'asc' | 'desc' }[] | undefined;
  const selectedRows = (props.selectedRows as string[]) ?? [];

  const columns = resolveColumns(props.columns as ColumnDef[] | undefined, childNodes);
  const records = (bind.value as Record<string, unknown>[]) ?? [];

  const rowHeights = { compact: 32, default: 40, comfortable: 52 };
  const rowHeight = rowHeights[rowHeightKey];

  const gridTemplate = [
    ...(selectable ? ['40px'] : []),
    ...columns.map((col) => `${col.width ?? 150}px`),
  ].join(' ');

  const [activeCell, setActiveCell] = useState<CellRef | null>(null);
  const [editingCell, setEditingCell] = useState<CellRef | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeCell && !editingCell) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (gridRef.current && !gridRef.current.contains(e.target as Node)) {
        setActiveCell(null);
        setEditingCell(null);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [activeCell, editingCell]);

  const getSortState = (field: string): 'asc' | 'desc' | null => {
    if (!sorted) return null;
    const entry = sorted.find((s) => s.field === field);
    return entry?.direction ?? null;
  };

  const handleCellClick = useCallback(
    (rowId: string, field: string) => {
      setActiveCell({ rowId, field });
      on.cellClick?.(rowId, field);
    },
    [on],
  );

  const handleCellDoubleClick = useCallback(
    (rowId: string, field: string, col: ColumnDef) => {
      if (!editable || col.editable === false) return;
      setEditingCell({ rowId, field });
    },
    [editable],
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

  const handleCellChange = useCallback(
    (rowId: string, field: string, value: unknown) => {
      on.cellChange?.(rowId, field, value);
    },
    [on],
  );

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

  return (
    <Datagrid ref={gridRef} maxHeight={maxHeight}>
      <Datagrid.ScrollArea>
        <Datagrid.Header gridTemplate={gridTemplate}>
          {selectable && (
            <Datagrid.SelectHeader
              allSelected={selectedRows.length === records.length && records.length > 0}
              indeterminate={selectedRows.length > 0 && selectedRows.length < records.length}
              onSelectAll={(checked) => on.selectAll?.(checked)}
            />
          )}
          {columns.map((col) => (
            <Datagrid.HeaderCell
              key={col.field}
              sortable={col.sortable}
              sorted={getSortState(col.field)}
              fieldType={col.fieldType}
              onSort={() => on.sort?.(col.field)}
            >
              {col.label}
            </Datagrid.HeaderCell>
          ))}
        </Datagrid.Header>

        <Datagrid.Body totalHeight={loading ? undefined : records.length * rowHeight}>
          {loading ? (
            Array.from({ length: 10 }, (_, i) => (
              <Datagrid.Row
                key={`skeleton-${i}`}
                gridTemplate={gridTemplate}
                rowHeight={rowHeight}
                offset={i * rowHeight}
              >
                {selectable && <Datagrid.Cell />}
                {columns.map((col) => (
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
            records.map((row, idx) => {
              const rowId = (row.id as string) ?? String(idx);
              const isSelected = selectedRows.includes(rowId);
              return (
                <Datagrid.Row
                  key={rowId}
                  gridTemplate={gridTemplate}
                  rowHeight={rowHeight}
                  offset={idx * rowHeight}
                  selected={isSelected}
                  onClick={() => on.rowClick?.(row)}
                  className={fetching ? 'opacity-50' : undefined}
                >
                  {selectable && (
                    <Datagrid.SelectCell
                      rowNumber={idx + 1}
                      selected={isSelected}
                      onSelectChange={(checked) => on.select?.(row, checked)}
                    />
                  )}
                  {columns.map((col) => {
                    const cellActive = isCellActive(rowId, col.field);
                    const cellEditing = isCellEditing(rowId, col.field);
                    const cellValue = row[col.field];

                    return (
                      <Datagrid.Cell
                        key={col.field}
                        active={cellActive}
                        editing={cellEditing}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCellClick(rowId, col.field);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleCellDoubleClick(rowId, col.field, col);
                        }}
                        onKeyDown={(e) => handleCellKeyDown(e, rowId, col.field, col)}
                        tabIndex={cellActive ? 0 : -1}
                      >
                        {cellEditing
                          ? renderEditor(
                              col.fieldType,
                              cellValue,
                              (val) => handleCellChange(rowId, col.field, val),
                              toCellColumn(col),
                            )
                          : renderDisplay(col.fieldType, cellValue, toCellColumn(col))}
                      </Datagrid.Cell>
                    );
                  })}
                </Datagrid.Row>
              );
            })
          )}
        </Datagrid.Body>
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
  );
}

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
        width: node.props?.width as number | undefined,
        sortable: node.props?.sortable as boolean | undefined,
        editable: node.props?.editable as boolean | undefined,
        fieldType: node.props?.fieldType as string | undefined,
        options: node.props?.options as Array<{ value: string; label: string }> | undefined,
        currency: node.props?.currency as string | undefined,
        precision: node.props?.precision as number | undefined,
      }));
  }

  return [];
}

DatagridWidget.displayName = 'DatagridWidget';
