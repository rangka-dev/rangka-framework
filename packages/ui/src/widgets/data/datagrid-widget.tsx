import { Datagrid } from '../../data/datagrid';
import type { WidgetComponentProps, WidgetNode } from '../types';

interface ColumnDef {
  field: string;
  label: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  editable?: boolean;
}

export function DatagridWidget({ props, bind, on, childNodes }: WidgetComponentProps) {
  const selectable = (props.selectable as boolean) ?? true;
  const rowHeightKey = (props.rowHeight as 'compact' | 'default' | 'comfortable') ?? 'default';
  const maxHeight = props.maxHeight as number | undefined;
  const emptyText = (props.emptyText as string) ?? 'No records';
  const loading = props.loading as boolean | undefined;
  const fetching = props.fetching as boolean | undefined;

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

  const getSortState = (field: string): 'asc' | 'desc' | null => {
    if (!sorted) return null;
    const entry = sorted.find((s) => s.field === field);
    return entry?.direction ?? null;
  };

  return (
    <Datagrid maxHeight={maxHeight}>
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
                  <Datagrid.Cell key={col.field} align={col.align}>
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
                      selected={isSelected}
                      onSelectChange={(checked) => on.select?.(row, checked)}
                    />
                  )}
                  {columns.map((col) => (
                    <Datagrid.Cell
                      key={col.field}
                      align={col.align}
                      onClick={(e) => {
                        e.stopPropagation();
                        on.cellClick?.(row, col.field);
                      }}
                    >
                      {row[col.field] != null ? String(row[col.field]) : ''}
                    </Datagrid.Cell>
                  ))}
                </Datagrid.Row>
              );
            })
          )}
        </Datagrid.Body>
      </Datagrid.ScrollArea>

      <Datagrid.Footer>
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
        align: node.props?.align as 'left' | 'center' | 'right' | undefined,
        sortable: node.props?.sortable as boolean | undefined,
        editable: node.props?.editable as boolean | undefined,
      }));
  }

  return [];
}

DatagridWidget.displayName = 'DatagridWidget';
