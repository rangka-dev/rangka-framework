import { useCallback, useEffect, useMemo } from 'react';
import { PlusIcon } from 'lucide-react';
import type { WidgetProps } from '../../types.js';
import { useWidgetContext } from '../../hooks/useWidgetContext.js';
import { usePageState } from '../../hooks/usePageState.js';
import { useModelMeta } from '../../../data/useModelMeta.js';
import { Button } from '../../../components/ui/button.js';
import { DatagridToolbar } from './grid/DatagridToolbar.js';
import { DatagridHeader } from './grid/DatagridHeader.js';
import { DatagridBody } from './grid/DatagridBody.js';
import { useDatagridColumns } from './hooks/useDatagridColumns.js';
import { useDatagridTable } from './hooks/useDatagridTable.js';
import { useDatagridVirtual } from './hooks/useDatagridVirtual.js';
import { useEditState } from './hooks/useEditState.js';
import { useKeyboardNav } from './hooks/useKeyboardNav.js';
import { useDatagridMutations } from './hooks/useDatagridMutations.js';
import { useNewRow } from './hooks/useNewRow.js';
import { useInfiniteModelQuery } from './hooks/useInfiniteModelQuery.js';

const ROW_HEIGHTS = { compact: 32, default: 40, comfortable: 52 } as const;

export function DatagridWidget({ props, on }: WidgetProps) {
  const ctx = useWidgetContext();
  const store = usePageState();

  const pageSize = (props.pageSize as number) ?? 50;
  const editable = (props.editable as boolean) ?? true;
  const selectable = (props.selectable as boolean) ?? true;
  const resizable = (props.resizable as boolean) ?? true;
  const reorderable = (props.reorderable as boolean) ?? true;
  const addRow = (props.addRow as boolean) ?? false;
  const rowHeightKey = (props.rowHeight as 'compact' | 'default' | 'comfortable') ?? 'default';
  const rowHeight = ROW_HEIGHTS[rowHeightKey];
  const maxHeight = (props.maxHeight as number | undefined) ?? pageSize * rowHeight + 40;
  const emptyText = (props.emptyText as string) ?? 'No records';

  const model = ctx.model;
  const columns = ctx.__columns ?? [];
  const smartMode = Boolean(model);

  const source = useInfiniteModelQuery({
    model: model || '',
    pageSize,
    enabled: smartMode,
    staticFilters: ctx.sourceFilters,
  });

  const records = smartMode ? source.data : (ctx.records ?? []);
  const { modelMeta } = useModelMeta(model);

  const hasSearchableFields = useMemo(() => {
    if (!modelMeta) return false;
    return modelMeta.fields.some((f: { searchable?: boolean }) => f.searchable);
  }, [modelMeta]);

  const filterableColumns = columns.filter((col) => col.props?.filterable && col.bind?.field);

  const columnDefs = useDatagridColumns({
    columns,
    modelMeta,
    gridEditable: editable,
  });

  const {
    table,
    columnSizing,
    columnOrder,
    setColumnOrder,
    selectedRowIds,
    setRowSelection,
    reorderable: canReorder,
  } = useDatagridTable({
    data: records as Record<string, unknown>[],
    columns: columnDefs,
    selectable,
    reorderable,
    resizable,
  });

  const { scrollRef, virtualizer, virtualItems, totalSize } = useDatagridVirtual({
    rowCount: table.getRowModel().rows.length,
    rowHeight,
    hasNextPage: source.hasNextPage,
    isFetchingNextPage: source.isFetchingNextPage,
    fetchNextPage: source.fetchNextPage,
  });

  const {
    state: editState,
    activate,
    deactivate,
    startEdit,
    startEditAt,
    commitEdit,
    cancelEdit,
    setPending,
    clearPending,
  } = useEditState();

  const {
    updateCell,
    createRow,
    deleteRows,
    isLoading: isMutating,
  } = useDatagridMutations({
    model: model || '',
    queryKey: source.queryKey,
  });

  const dataColStart = selectable ? 1 : 0;

  const gridTemplateColumns = useMemo(() => {
    const cols = table.getVisibleLeafColumns().map((col) => `${col.getSize()}px`);
    if (selectable) cols.unshift('40px');
    return cols.join(' ');
  }, [table, selectable, columnSizing, columnOrder]);

  useEffect(() => {
    if (selectedRowIds.length > 0) {
      const rows = table
        .getRowModel()
        .rows.filter((r) => selectedRowIds.includes(r.id))
        .map((r) => r.original);
      on.rowSelect?.({ selectedRows: rows });
    }
  }, [selectedRowIds]);

  const fieldMetaMap = useMemo(() => {
    const map: Record<
      string,
      {
        type: string;
        label: string;
        required: boolean;
        options?: readonly string[];
        readOnly: boolean;
        relatedModel?: string;
      }
    > = {};
    if (!modelMeta) return map;
    for (const f of modelMeta.fields) {
      map[f.name] = {
        type: f.type,
        label: f.label ?? f.name,
        required: f.required ?? false,
        options: f.options,
        readOnly: false,
        relatedModel: f.relationship?.model,
      };
    }
    return map;
  }, [modelMeta]);

  const requiredFields = useMemo(() => {
    if (!modelMeta) return [];
    return modelMeta.fields.filter((f) => f.required && f.name !== 'id').map((f) => f.name);
  }, [modelMeta]);

  const firstEditableField = useMemo(() => {
    const cols = table.getVisibleLeafColumns();
    for (const col of cols) {
      const meta = col.columnDef.meta as { editable?: boolean; fieldName?: string } | undefined;
      if (meta?.editable && meta.fieldName) return meta.fieldName;
    }
    return undefined;
  }, [table]);

  const { newRow, canPersist, startNewRow, updateNewRowField, discardNewRow, persistNewRow } =
    useNewRow({
      requiredFields,
      onPersist: async (data) => {
        const result = await createRow(data);
        on.rowCreate?.({ row: result });
        return result;
      },
    });

  const handleSort = useCallback(
    (field: string, multi?: boolean) => {
      if (!model) return;
      const currentSort = source.sort ?? [];

      if (multi) {
        const idx = currentSort.findIndex((s) => s.field === field);
        const newEntries = [...currentSort];
        if (idx >= 0) {
          const entry = newEntries[idx];
          if (entry.direction === 'asc') {
            newEntries[idx] = { field, direction: 'desc' };
          } else {
            newEntries.splice(idx, 1);
          }
        } else {
          newEntries.push({ field, direction: 'asc' });
        }
        const sortStr =
          newEntries.length > 0
            ? newEntries.map((s) => (s.direction === 'desc' ? `-${s.field}` : s.field)).join(',')
            : null;
        store.set(`$sort.${model}`, sortStr);
      } else {
        const current = currentSort.find((s) => s.field === field);
        let newSort: string | undefined;
        if (current?.direction === 'asc') {
          newSort = `-${field}`;
        } else if (current?.direction === 'desc') {
          newSort = undefined;
        } else {
          newSort = field;
        }
        store.set(`$sort.${model}`, newSort ?? null);
      }
      scrollRef.current?.scrollTo(0, 0);
    },
    [model, source.sort, store],
  );

  const handleCellCommit = useCallback(
    async (rowId: string, field: string, value: unknown) => {
      commitEdit();
      const pendingKey = `${rowId}.${field}`;
      setPending(pendingKey, value);
      try {
        await updateCell(rowId, field, value);
        on.cellChange?.({ field, value, row: { id: rowId } });
      } catch {
        // rollback handled by useDatagridMutations
      } finally {
        clearPending(pendingKey);
      }
    },
    [commitEdit, setPending, clearPending, updateCell, on],
  );

  const handleCancelEdit = useCallback(() => {
    cancelEdit();
  }, [cancelEdit]);

  const handleColumnReorder = useCallback(
    (draggedId: string, targetId: string) => {
      const currentOrder =
        columnOrder.length > 0 ? columnOrder : table.getVisibleLeafColumns().map((c) => c.id);
      const dragIdx = currentOrder.indexOf(draggedId);
      const targetIdx = currentOrder.indexOf(targetId);
      if (dragIdx < 0 || targetIdx < 0) return;
      const newOrder = [...currentOrder];
      newOrder.splice(dragIdx, 1);
      newOrder.splice(targetIdx, 0, draggedId);
      setColumnOrder(newOrder);
    },
    [columnOrder, table, setColumnOrder],
  );

  const handleCopy = useCallback((value: unknown) => {
    if (value != null) {
      navigator.clipboard.writeText(String(value));
    }
  }, []);

  const handleClearCell = useCallback(
    (rowIndex: number, colIndex: number) => {
      const row = table.getRowModel().rows[rowIndex];
      const cols = table.getVisibleLeafColumns();
      const col = cols[colIndex];
      if (!row || !col) return;
      const meta = col.columnDef.meta as { editable?: boolean; fieldName?: string } | undefined;
      if (!meta?.editable || !meta.fieldName) return;
      handleCellCommit(row.id, meta.fieldName, null);
    },
    [table, handleCellCommit],
  );

  const handleSelectAll = useCallback(() => {
    table.toggleAllRowsSelected(true);
  }, [table]);

  const handleAddRow = useCallback(() => {
    if (newRow) return;
    startNewRow(firstEditableField);
  }, [newRow, startNewRow, firstEditableField]);

  useEffect(() => {
    if (canPersist) {
      persistNewRow();
    }
  }, [canPersist, persistNewRow]);

  const handleDeleteRows = useCallback(async () => {
    if (selectedRowIds.length === 0) return;
    const rows = table.getRowModel().rows.filter((r) => selectedRowIds.includes(r.id));
    await deleteRows(selectedRowIds);
    setRowSelection({});
    on.rowDelete?.({ rows: rows.map((r) => r.original) });
  }, [selectedRowIds, table, deleteRows, setRowSelection, on]);

  useKeyboardNav({
    scrollRef,
    table,
    virtualizer,
    activeCell: editState.activeCell,
    editingCell: editState.editingCell,
    selectable,
    activate,
    deactivate,
    startEdit,
    cancelEdit: handleCancelEdit,
    commitEdit,
    onCopy: handleCopy,
    onClearCell: handleClearCell,
    onSelectAll: handleSelectAll,
  });

  const wrapperClasses =
    'flex flex-col flex-1 min-h-0 bg-card text-card-foreground text-sm ring-1 ring-foreground/10';

  return (
    <div data-widget="datagrid" className={wrapperClasses}>
      {smartMode && (
        <DatagridToolbar
          model={model!}
          store={store}
          hasSearch={hasSearchableFields}
          filterableColumns={filterableColumns}
          table={table}
          selectable={selectable}
          selectedRowIds={selectedRowIds}
          onDeleteRows={handleDeleteRows}
        />
      )}

      <div
        ref={scrollRef}
        role="grid"
        aria-label="Data grid"
        aria-rowcount={table.getRowModel().rows.length + 1}
        aria-colcount={table.getVisibleLeafColumns().length + (selectable ? 1 : 0)}
        tabIndex={0}
        className="flex-1 min-h-0 overflow-auto scrollbar-none outline-none focus-visible:ring-1 focus-visible:ring-ring"
        style={{ maxHeight }}
      >
        <DatagridHeader
          table={table}
          selectable={selectable}
          currentSort={source.sort}
          onSort={handleSort}
          reorderable={canReorder}
          onColumnReorder={handleColumnReorder}
          gridTemplateColumns={gridTemplateColumns}
        />
        <div role="rowgroup">
          <DatagridBody
            table={table}
            virtualItems={virtualItems}
            totalSize={totalSize}
            virtualizer={virtualizer}
            rowHeight={rowHeight}
            selectable={selectable}
            activeCell={editState.activeCell}
            editingCell={editState.editingCell}
            pendingEdits={editState.pendingEdits}
            dataColStart={dataColStart}
            fieldMetaMap={fieldMetaMap}
            isLoading={source.isLoading}
            isFetching={source.isFetching}
            pageSize={pageSize}
            emptyText={emptyText}
            onActivate={activate}
            onStartEdit={startEditAt}
            onCommit={handleCellCommit}
            onCancel={handleCancelEdit}
            newRow={newRow}
            onNewRowFieldChange={updateNewRowField}
            onNewRowDiscard={discardNewRow}
            gridTemplateColumns={gridTemplateColumns}
            isFetchingNextPage={source.isFetchingNextPage}
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border px-3 py-2">
        <div className="flex items-center gap-2">
          {addRow && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={handleAddRow}
              disabled={isMutating}
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Add row
            </Button>
          )}
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {source.total != null
            ? `${(records as unknown[]).length} of ${source.total} records`
            : `${(records as unknown[]).length} records`}
        </span>
      </div>
    </div>
  );
}

DatagridWidget.widgetMeta = {
  name: 'datagrid',
  label: 'Datagrid',
  category: 'data' as const,
  schema: {
    pageSize: { type: 'number' as const },
    maxHeight: { type: 'number' as const },
    rowHeight: { type: 'enum' as const, options: ['compact', 'default', 'comfortable'] },
    editable: { type: 'boolean' as const },
    resizable: { type: 'boolean' as const },
    reorderable: { type: 'boolean' as const },
    selectable: { type: 'boolean' as const },
    addRow: { type: 'boolean' as const },
    emptyText: { type: 'string' as const },
  },
  binding: 'none' as const,
  triggers: ['cellChange', 'rowSelect', 'rowCreate', 'rowDelete'],
  container: true,
  accepts: ['column'],
};
