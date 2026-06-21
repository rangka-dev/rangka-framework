import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  type ColumnOrderState,
  type ColumnSizingState,
  type VisibilityState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { useState } from 'react';

interface UseDatagridTableOptions {
  data: Record<string, unknown>[];
  columns: ColumnDef<Record<string, unknown>, unknown>[];
  selectable: boolean;
  reorderable: boolean;
  resizable: boolean;
}

export function useDatagridTable({
  data,
  columns,
  selectable,
  reorderable,
  resizable,
}: UseDatagridTableOptions) {
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    state: {
      columnSizing,
      columnOrder: columnOrder.length > 0 ? columnOrder : undefined,
      columnVisibility,
      rowSelection,
    },
    onColumnSizingChange: setColumnSizing,
    onColumnOrderChange: setColumnOrder,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: resizable ? 'onChange' : undefined,
    enableColumnResizing: resizable,
    enableRowSelection: selectable,
    getRowId: (row) => String(row.id ?? ''),
  });

  const selectedRowIds = useMemo(() => {
    return Object.keys(rowSelection).filter((k) => rowSelection[k]);
  }, [rowSelection]);

  return {
    table,
    columnSizing,
    columnOrder,
    setColumnOrder,
    columnVisibility,
    setColumnVisibility,
    rowSelection,
    setRowSelection,
    selectedRowIds,
    reorderable,
  };
}
