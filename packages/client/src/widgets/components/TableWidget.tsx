import { useCallback, useMemo } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from 'lucide-react';
import type { WidgetNode } from '@rangka/shared';
import type { WidgetProps } from '../types.js';
import { useWidgetContext, WidgetContextProvider } from '../hooks/useWidgetContext.js';
import { usePageState } from '../hooks/usePageState.js';
import { useModelQuery } from '../data/useModelQuery.js';
import { useSurfaceContext } from '../hooks/useSurfaceContext.js';
import { buildRowContext } from '../context/builder.js';
import { useModelMeta } from '../../data/useModelMeta.js';
import { Skeleton } from '../../components/ui/skeleton.js';
import type { SortEntry } from '../reactivity/variables.js';
import { TableToolbar } from './table/TableToolbar.js';
import { TablePagination } from './table/TablePagination.js';
import { ColumnChildRenderer, CellValue } from './table/CellRenderers.js';

// --- Main Component ---

export function TableWidget({ props, on }: WidgetProps) {
  const ctx = useWidgetContext();
  const store = usePageState();
  const surface = useSurfaceContext();

  // Props
  const variant =
    (props.variant as 'card' | 'flat' | undefined) ?? (surface === 'card' ? 'flat' : 'card');
  const selectable = props.selectable as boolean | undefined;
  const bordered = props.bordered as boolean | undefined;
  const striped = props.striped as boolean | undefined;
  const pageSize = props.pageSize as number | undefined;

  // Data source
  const model = ctx.model;
  const columns = ctx.__columns ?? [];
  const smartMode = Boolean(model && pageSize);

  const source = useModelQuery({
    model: model || '',
    pageSize: pageSize ?? 20,
    enabled: smartMode,
  });

  const records = smartMode ? source.data : (ctx.records ?? []);
  const isFetching = smartMode && source.isFetching;

  // Model metadata for search/filter capabilities
  const { modelMeta } = useModelMeta(model);
  const hasSearchableFields = useMemo(() => {
    if (!modelMeta) return false;
    return modelMeta.fields.some((f) => f.searchable);
  }, [modelMeta]);

  const filterableColumns = columns.filter((col) => col.props?.filterable && col.bind?.field);

  // Sorting
  const handleSort = useCallback(
    (field: string) => {
      if (!model) return;
      const current = source.sort?.[0];
      let newSort: string | undefined;

      if (current?.field === field && current.direction === 'asc') {
        newSort = `-${field}`;
      } else if (current?.field === field && current.direction === 'desc') {
        newSort = undefined;
      } else {
        newSort = field;
      }

      store.set(`$sort.${model}`, newSort ?? null);
      store.set(`$page.${model}`, 1);
    },
    [model, source.sort, store],
  );

  // Pagination
  const handlePageChange = useCallback(
    (newPage: number) => {
      if (!model) return;
      store.set(`$page.${model}`, newPage);
      on.pageChange?.(newPage);
    },
    [model, store, on],
  );

  // Styles
  const wrapperClasses = [
    'flex flex-col',
    variant === 'card'
      ? 'bg-card text-card-foreground ring-1 ring-foreground/10'
      : '-mx-(--card-spacing)',
  ]
    .filter(Boolean)
    .join(' ');

  const tableClasses = [
    'w-full text-sm border-collapse table-fixed',
    bordered && variant === 'card' ? 'ring-1 ring-border' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div data-widget="table" className={wrapperClasses}>
      {smartMode && (hasSearchableFields || filterableColumns.length > 0) && (
        <TableToolbar
          model={model!}
          store={store}
          columns={filterableColumns}
          hasSearch={hasSearchableFields}
          hasFilters={filterableColumns.length > 0}
        />
      )}

      <div className="overflow-auto">
        <table className={tableClasses}>
          <TableHead
            columns={columns}
            selectable={selectable}
            smartMode={smartMode}
            currentSort={source.sort}
            onSort={handleSort}
          />
          <TableBody
            columns={columns}
            records={records}
            selectable={selectable}
            striped={striped}
            isFetching={isFetching}
            isLoading={source.isLoading}
            pageSize={pageSize ?? 20}
            emptyText={(props.emptyText as string) ?? 'No data'}
            ctx={ctx}
            onRowClick={on.rowClick}
            onSelect={on.select}
          />
        </table>
      </div>

      {smartMode && (
        <TablePagination
          page={source.page}
          pageSize={source.pageSize}
          total={source.total}
          recordCount={records.length}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

// --- Table Head ---

interface TableHeadProps {
  columns: WidgetNode[];
  selectable: boolean | undefined;
  smartMode: boolean;
  currentSort: SortEntry[] | null;
  onSort: (field: string) => void;
}

function TableHead({ columns, selectable, smartMode, currentSort, onSort }: TableHeadProps) {
  return (
    <thead>
      <tr className="border-b-2 border-border">
        {selectable && (
          <th className="w-10 px-5 py-2 text-center">
            <input type="checkbox" className="cursor-pointer" aria-label="Select all" />
          </th>
        )}
        {columns.map((col, i) => {
          const align = (col.props?.align as string) ?? 'left';
          const width = col.props?.width as string | undefined;
          const sortable = smartMode && (col.props?.sortable as boolean | undefined);
          const field = col.bind?.field;
          const alignClass =
            align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
          const sortState = sortable && field ? getSortState(currentSort, field) : null;

          return (
            <th
              key={col.id ?? i}
              data-rangka-widget="column"
              data-rangka-id={col.id ?? undefined}
              data-rangka-field={field ?? undefined}
              className={`px-5 py-2 text-xs font-semibold text-muted-foreground ${alignClass} ${sortable ? 'cursor-pointer select-none transition-colors hover:text-foreground' : ''}`}
              style={width ? { width } : undefined}
              onClick={sortable && field ? () => onSort(field) : undefined}
            >
              <span className="inline-flex items-center gap-1">
                {String(col.props?.label ?? '')}
                {sortState === 'asc' && <ChevronUpIcon className="h-3 w-3 text-foreground" />}
                {sortState === 'desc' && <ChevronDownIcon className="h-3 w-3 text-foreground" />}
              </span>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

// --- Table Body ---

interface TableBodyProps {
  columns: WidgetNode[];
  records: unknown[];
  selectable: boolean | undefined;
  striped: boolean | undefined;
  isFetching: boolean;
  isLoading: boolean;
  pageSize: number;
  emptyText: string;
  ctx: ReturnType<typeof useWidgetContext>;
  onRowClick?: (row: unknown) => void;
  onSelect?: (row: unknown) => void;
}

function TableBody({
  columns,
  records,
  selectable,
  striped,
  isFetching,
  isLoading,
  pageSize,
  emptyText,
  ctx,
  onRowClick,
  onSelect,
}: TableBodyProps) {
  const bodyOpacity =
    isFetching && records.length > 0
      ? 'opacity-50 transition-opacity duration-150'
      : 'transition-opacity duration-150';

  if (isLoading) {
    return (
      <tbody className={bodyOpacity}>
        {Array.from({ length: pageSize }, (_, i) => (
          <tr key={`skeleton-${i}`} className="border-b border-border/50 last:border-b-0">
            {selectable && (
              <td className="w-10 px-5 py-2 text-center">
                <Skeleton className="h-4 w-4 mx-auto" />
              </td>
            )}
            {columns.map((col, colIndex) => (
              <td key={col.id ?? colIndex} className="px-5 py-2">
                <Skeleton className="h-4 w-full max-w-[80%]" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  }

  if (records.length === 0) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={columns.length + (selectable ? 1 : 0)}
            className="px-5 py-8 text-center text-muted-foreground"
          >
            {emptyText}
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className={bodyOpacity}>
      {records.map((row, rowIndex) => {
        const rowCtx = buildRowContext(row as Record<string, unknown>, rowIndex, ctx);
        return (
          <tr
            key={((row as Record<string, unknown>).id as string) ?? rowIndex}
            data-rangka-widget="row"
            data-rangka-id={`row-${rowIndex}`}
            className={[
              'border-b border-border/50 last:border-b-0',
              striped && rowIndex % 2 === 1 ? 'bg-muted/30' : '',
              onRowClick ? 'cursor-pointer transition-colors hover:bg-muted/50' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onRowClick?.(row)}
          >
            {selectable && (
              <td className="w-10 px-5 py-2 text-center">
                <input
                  type="checkbox"
                  className="cursor-pointer"
                  aria-label={`Select row ${rowIndex + 1}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect?.(row);
                  }}
                />
              </td>
            )}
            {columns.map((col, colIndex) => {
              const align = (col.props?.align as string) ?? 'left';
              const alignClass =
                align === 'center'
                  ? 'text-center'
                  : align === 'right'
                    ? 'text-right tabular-nums'
                    : 'text-left';
              return (
                <td
                  key={col.id ?? colIndex}
                  data-rangka-widget="column"
                  data-rangka-id={col.id ?? undefined}
                  data-rangka-field={col.bind?.field ?? undefined}
                  className={`px-5 py-2 ${alignClass}`}
                >
                  <WidgetContextProvider value={rowCtx}>
                    {col.children && col.children.length > 0 ? (
                      col.children.map((child, ci) => (
                        <ColumnChildRenderer key={child.id ?? ci} node={child} rowCtx={rowCtx} />
                      ))
                    ) : (
                      <CellValue col={col} row={row as Record<string, unknown>} />
                    )}
                  </WidgetContextProvider>
                </td>
              );
            })}
          </tr>
        );
      })}
    </tbody>
  );
}

// --- Helpers ---

function getSortState(sort: SortEntry[] | null, field: string): 'asc' | 'desc' | null {
  if (!sort) return null;
  const entry = sort.find((s) => s.field === field);
  return entry?.direction ?? null;
}

// --- Widget Meta ---

TableWidget.widgetMeta = {
  name: 'table',
  label: 'Table',
  category: 'data' as const,
  schema: {
    variant: { type: 'enum' as const, options: ['card', 'flat'], default: 'card' },
    selectable: { type: 'boolean' as const },
    bordered: { type: 'boolean' as const },
    striped: { type: 'boolean' as const },
    pageSize: { type: 'number' as const },
    emptyText: { type: 'string' as const },
  },
  binding: 'model' as const,
  triggers: ['rowClick', 'select', 'pageChange'],
  container: true,
  accepts: ['column'],
};
