import { useCallback, useEffect, useRef } from 'react';
import type { Table } from '@tanstack/react-table';
import type { Virtualizer } from '@tanstack/react-virtual';
import type { CellAddress } from './useEditState.js';

interface UseKeyboardNavOptions {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  table: Table<Record<string, unknown>>;
  virtualizer: Virtualizer<HTMLDivElement, Element>;
  activeCell: CellAddress | null;
  editingCell: CellAddress | null;
  selectable: boolean;
  activate: (cell: CellAddress) => void;
  deactivate: () => void;
  startEdit: () => void;
  cancelEdit: () => void;
  commitEdit: () => void;
  onCopy?: (value: unknown) => void;
  onClearCell?: (rowIndex: number, colIndex: number) => void;
  onSelectAll?: () => void;
}

export function useKeyboardNav({
  scrollRef,
  table,
  virtualizer,
  activeCell,
  editingCell,
  selectable,
  activate,
  deactivate,
  startEdit,
  cancelEdit,
  commitEdit,
  onCopy,
  onClearCell,
  onSelectAll,
}: UseKeyboardNavOptions) {
  const stateRef = useRef({ activeCell, editingCell });
  stateRef.current = { activeCell, editingCell };

  const getColCount = useCallback(() => {
    return table.getVisibleLeafColumns().length + (selectable ? 1 : 0);
  }, [table, selectable]);

  const getRowCount = useCallback(() => {
    return table.getRowModel().rows.length;
  }, [table]);

  const getDataColStart = useCallback(() => {
    return selectable ? 1 : 0;
  }, [selectable]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const { activeCell: active, editingCell: editing } = stateRef.current;

      if (editing) {
        if (e.key === 'Escape') {
          e.preventDefault();
          cancelEdit();
        } else if (e.key === 'Tab') {
          e.preventDefault();
          commitEdit();
          moveActive(e.shiftKey ? 'left' : 'right');
        }
        return;
      }

      if (!active) return;

      const colCount = getColCount();
      const rowCount = getRowCount();
      const dataColStart = getDataColStart();

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          moveActiveTo(active.rowIndex - 1, active.colIndex);
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveActiveTo(active.rowIndex + 1, active.colIndex);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          moveActiveTo(active.rowIndex, active.colIndex - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveActiveTo(active.rowIndex, active.colIndex + 1);
          break;
        case 'Tab':
          e.preventDefault();
          moveActive(e.shiftKey ? 'left' : 'right');
          break;
        case 'Enter':
        case 'F2':
          e.preventDefault();
          if (active.colIndex >= dataColStart) {
            startEdit();
          }
          break;
        case 'Escape':
          e.preventDefault();
          deactivate();
          break;
        case 'Home':
          e.preventDefault();
          if (e.ctrlKey || e.metaKey) {
            moveActiveTo(0, dataColStart);
          } else {
            moveActiveTo(active.rowIndex, dataColStart);
          }
          break;
        case 'End':
          e.preventDefault();
          if (e.ctrlKey || e.metaKey) {
            moveActiveTo(rowCount - 1, colCount - 1);
          } else {
            moveActiveTo(active.rowIndex, colCount - 1);
          }
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          if (active.colIndex >= dataColStart) {
            onClearCell?.(active.rowIndex, active.colIndex - dataColStart);
          }
          break;
        case ' ':
          if (active.colIndex === 0 && selectable) {
            e.preventDefault();
            const row = table.getRowModel().rows[active.rowIndex];
            row?.toggleSelected();
          }
          break;
        case 'c':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (active.colIndex >= dataColStart) {
              const row = table.getRowModel().rows[active.rowIndex];
              const cols = table.getVisibleLeafColumns();
              const col = cols[active.colIndex - dataColStart];
              if (row && col) {
                const value = row.getValue(col.id);
                onCopy?.(value);
              }
            }
          }
          break;
        case 'a':
          if ((e.ctrlKey || e.metaKey) && selectable) {
            e.preventDefault();
            onSelectAll?.();
          }
          break;
      }

      function moveActive(direction: 'left' | 'right') {
        if (!active) return;
        if (direction === 'right') {
          if (active.colIndex < colCount - 1) {
            moveActiveTo(active.rowIndex, active.colIndex + 1);
          } else if (active.rowIndex < rowCount - 1) {
            moveActiveTo(active.rowIndex + 1, dataColStart);
          }
        } else {
          if (active.colIndex > dataColStart) {
            moveActiveTo(active.rowIndex, active.colIndex - 1);
          } else if (active.rowIndex > 0) {
            moveActiveTo(active.rowIndex - 1, colCount - 1);
          }
        }
      }

      function moveActiveTo(row: number, col: number) {
        if (row < 0 || row >= rowCount || col < 0 || col >= colCount) return;
        activate({ rowIndex: row, colIndex: col });
        virtualizer.scrollToIndex(row, { align: 'auto' });
      }
    };

    el.addEventListener('keydown', handleKeyDown);
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [
    scrollRef,
    table,
    virtualizer,
    selectable,
    activate,
    deactivate,
    startEdit,
    cancelEdit,
    commitEdit,
    onCopy,
    onClearCell,
    onSelectAll,
    getColCount,
    getRowCount,
    getDataColStart,
  ]);
}
