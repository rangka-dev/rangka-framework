import { memo } from 'react';
import type { Row } from '@tanstack/react-table';
import { DatagridCell } from './DatagridCell.js';
import type { CellAddress } from '../hooks/useEditState.js';
import type { DatagridColumnMeta } from '../hooks/useDatagridColumns.js';

interface DatagridRowProps {
  row: Row<Record<string, unknown>>;
  rowIndex: number;
  rowHeight: number;
  offsetTop: number;
  isSelected: boolean;
  activeCell: CellAddress | null;
  editingCell: CellAddress | null;
  pendingEdits: Map<string, unknown>;
  selectable: boolean;
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
  gridTemplateColumns: string;
  onActivate: (cell: CellAddress) => void;
  onStartEdit: (cell: CellAddress) => void;
  onCommit: (rowId: string, field: string, value: unknown) => void;
  onCancel: () => void;
}

export const DatagridRow = memo(
  function DatagridRow({
    row,
    rowIndex,
    rowHeight,
    offsetTop,
    isSelected,
    activeCell,
    editingCell,
    pendingEdits,
    selectable,
    dataColStart,
    fieldMetaMap,
    gridTemplateColumns,
    onActivate,
    onStartEdit,
    onCommit,
    onCancel,
  }: DatagridRowProps) {
    const cells = row.getVisibleCells();
    const rowId = row.id;

    return (
      <div
        role="row"
        aria-rowindex={rowIndex + 2}
        aria-selected={isSelected}
        className={`absolute left-0 grid w-full border-b border-border/40 hover:bg-muted/40 transition-colors ${
          isSelected ? 'bg-primary/5' : ''
        }`}
        style={{ top: offsetTop, height: rowHeight, gridTemplateColumns }}
      >
        {selectable && (
          <div
            role="gridcell"
            aria-colindex={1}
            className="flex items-center justify-center group/select border-r border-border"
          >
            <span
              className={`text-xs tabular-nums text-muted-foreground ${isSelected ? 'hidden' : 'group-hover/select:hidden'}`}
            >
              {rowIndex + 1}
            </span>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={row.getToggleSelectedHandler()}
              className={`h-3.5 w-3.5 cursor-pointer ${isSelected ? '' : 'hidden group-hover/select:block'}`}
              aria-label={`Select row ${rowIndex + 1}`}
            />
          </div>
        )}
        {cells.map((cell, colIdx) => {
          const globalColIdx = colIdx + dataColStart;
          const isActive =
            activeCell?.rowIndex === rowIndex && activeCell?.colIndex === globalColIdx;
          const isEditing =
            editingCell?.rowIndex === rowIndex && editingCell?.colIndex === globalColIdx;

          const meta = cell.column.columnDef.meta as DatagridColumnMeta | undefined;
          const fieldName = meta?.fieldName ?? '';
          const pendingKey = `${rowId}.${fieldName}`;
          const pendingValue = pendingEdits.get(pendingKey);

          return (
            <DatagridCell
              key={cell.id}
              cell={cell}
              isActive={isActive}
              isEditing={isEditing}
              pendingValue={pendingValue}
              fieldMeta={fieldMetaMap[fieldName]}
              onActivate={() => onActivate({ rowIndex, colIndex: globalColIdx })}
              onStartEdit={() => onStartEdit({ rowIndex, colIndex: globalColIdx })}
              onCommit={(value) => onCommit(rowId, fieldName, value)}
              onCancel={onCancel}
            />
          );
        })}
      </div>
    );
  },
  (prev, next) => {
    if (prev.row.id !== next.row.id) return false;
    if (prev.row.original !== next.row.original) return false;
    if (prev.offsetTop !== next.offsetTop) return false;
    if (prev.isSelected !== next.isSelected) return false;
    if (prev.gridTemplateColumns !== next.gridTemplateColumns) return false;

    const prevActive = prev.activeCell;
    const nextActive = next.activeCell;
    const prevEditing = prev.editingCell;
    const nextEditing = next.editingCell;

    const wasActiveInRow = prevActive?.rowIndex === prev.rowIndex;
    const isActiveInRow = nextActive?.rowIndex === next.rowIndex;
    const wasEditingInRow = prevEditing?.rowIndex === prev.rowIndex;
    const isEditingInRow = nextEditing?.rowIndex === next.rowIndex;

    if (wasActiveInRow !== isActiveInRow) return false;
    if (isActiveInRow && prevActive?.colIndex !== nextActive?.colIndex) return false;
    if (wasEditingInRow !== isEditingInRow) return false;
    if (isEditingInRow && prevEditing?.colIndex !== nextEditing?.colIndex) return false;

    if (prev.pendingEdits !== next.pendingEdits) return false;

    return true;
  },
);
