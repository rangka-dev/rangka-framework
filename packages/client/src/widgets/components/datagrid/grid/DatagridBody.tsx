import { useEffect } from 'react';
import type { Table } from '@tanstack/react-table';
import type { VirtualItem, Virtualizer } from '@tanstack/react-virtual';
import { DatagridRow } from './DatagridRow.js';
import { NewRowRenderer } from './NewRowRenderer.js';
import type { CellAddress } from '../hooks/useEditState.js';
import { Skeleton } from '../../../../components/ui/skeleton.js';

interface DatagridBodyProps {
  table: Table<Record<string, unknown>>;
  virtualItems: VirtualItem[];
  totalSize: number;
  virtualizer: Virtualizer<HTMLDivElement, Element>;
  rowHeight: number;
  selectable: boolean;
  activeCell: CellAddress | null;
  editingCell: CellAddress | null;
  pendingEdits: Map<string, unknown>;
  dataColStart: number;
  fieldMetaMap: Record<
    string,
    {
      type: string;
      label: string;
      required: boolean;
      options?: readonly string[];
      readOnly: boolean;
      relatedModel?: string;
    }
  >;
  isLoading: boolean;
  isFetching: boolean;
  pageSize: number;
  emptyText: string;
  onActivate: (cell: CellAddress) => void;
  onStartEdit: (cell: CellAddress) => void;
  onCommit: (rowId: string, field: string, value: unknown) => void;
  onCancel: () => void;
  newRow: { id: string; data: Record<string, unknown>; focusField?: string } | null;
  onNewRowFieldChange: (field: string, value: unknown) => void;
  onNewRowDiscard: () => void;
  gridTemplateColumns: string;
  isFetchingNextPage: boolean;
}

export function DatagridBody({
  table,
  virtualItems,
  totalSize,
  rowHeight,
  selectable,
  activeCell,
  editingCell,
  pendingEdits,
  dataColStart,
  fieldMetaMap,
  isLoading,
  isFetching,
  pageSize,
  emptyText,
  onActivate,
  onStartEdit,
  onCommit,
  onCancel,
  newRow,
  onNewRowFieldChange,
  onNewRowDiscard,
  gridTemplateColumns,
  isFetchingNextPage,
}: DatagridBodyProps) {
  const rows = table.getRowModel().rows;

  useEffect(() => {
    if (!editingCell) return;
    const visibleIndices = virtualItems.map((v) => v.index);
    if (!visibleIndices.includes(editingCell.rowIndex)) {
      onCancel();
    }
  }, [editingCell, virtualItems, onCancel]);

  if (isLoading) {
    return (
      <div className="flex flex-col">
        {Array.from({ length: pageSize }, (_, i) => (
          <div
            key={i}
            className="grid items-center border-b border-border/40"
            style={{ height: rowHeight, gridTemplateColumns }}
          >
            {selectable && (
              <div className="flex items-center justify-center">
                <Skeleton className="h-3.5 w-3.5" />
              </div>
            )}
            {table.getVisibleLeafColumns().map((col) => (
              <div key={col.id} className="px-2">
                <Skeleton className="h-4 w-[70%]" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (rows.length === 0 && !newRow) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }

  const bodyOpacity = isFetching
    ? 'opacity-50 transition-opacity duration-150'
    : 'transition-opacity duration-150';

  return (
    <div
      className={`relative ${bodyOpacity}`}
      style={{ height: totalSize + (newRow ? rowHeight : 0) }}
    >
      {newRow && (
        <NewRowRenderer
          newRow={newRow}
          table={table}
          rowHeight={rowHeight}
          offsetTop={0}
          selectable={selectable}
          fieldMetaMap={fieldMetaMap}
          gridTemplateColumns={gridTemplateColumns}
          onFieldChange={onNewRowFieldChange}
          onDiscard={onNewRowDiscard}
        />
      )}
      {virtualItems.map((virtualItem) => {
        const row = rows[virtualItem.index];
        if (!row) return null;
        return (
          <DatagridRow
            key={row.id}
            row={row}
            rowIndex={virtualItem.index}
            rowHeight={rowHeight}
            offsetTop={virtualItem.start + (newRow ? rowHeight : 0)}
            isSelected={row.getIsSelected()}
            activeCell={activeCell}
            editingCell={editingCell}
            pendingEdits={pendingEdits}
            selectable={selectable}
            dataColStart={dataColStart}
            fieldMetaMap={fieldMetaMap}
            gridTemplateColumns={gridTemplateColumns}
            onActivate={onActivate}
            onStartEdit={onStartEdit}
            onCommit={onCommit}
            onCancel={onCancel}
          />
        );
      })}
      {isFetchingNextPage && (
        <div
          className="absolute left-0 grid w-full border-b border-border/40 animate-pulse"
          style={{
            top: totalSize + (newRow ? rowHeight : 0),
            height: rowHeight,
            gridTemplateColumns,
          }}
        >
          {selectable && (
            <div className="flex items-center justify-center">
              <Skeleton className="h-3.5 w-3.5" />
            </div>
          )}
          {table.getVisibleLeafColumns().map((col) => (
            <div key={col.id} className="flex items-center px-2">
              <Skeleton className="h-4 w-[60%]" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
