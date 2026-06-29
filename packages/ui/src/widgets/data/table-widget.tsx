import { type ReactNode } from 'react';
import { Table } from '../../data/table';
import { TablePagination } from '../../data/table-pagination';
import { renderDisplay, type CellColumn } from './cell-renderers';
import { TableFilterBar, type FilterFieldDeclaration, type ActiveFilter } from './table-filter-bar';
import type { WidgetComponentProps, WidgetNode } from '../types';

interface ColumnDef {
  field: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  fieldType?: string;
  options?: Array<{ value: string; label: string }>;
  currency?: string;
  precision?: number;
  namingField?: string;
  children?: WidgetNode[];
  renderCell?: (row: Record<string, unknown>, index: number) => ReactNode;
}

export function TableWidget({ props, bind, on, childNodes }: WidgetComponentProps) {
  const variant = (props.variant as 'card' | 'flat') ?? 'flat';
  const selectable = props.selectable as boolean | undefined;
  const striped = props.striped as boolean | undefined;
  const bordered = props.bordered as boolean | undefined;
  const loading = props.loading as boolean | undefined;
  const fetching = props.fetching as boolean | undefined;
  const emptyText = (props.emptyText as string) ?? 'No data';

  const page = (props.page as number) ?? 1;
  const pageSize = (props.pageSize as number) ?? 0;
  const total = (props.total as number) ?? 0;
  const sorted = props.sorted as { field: string; direction: 'asc' | 'desc' } | undefined;

  const filterFields = (props.filterFields as FilterFieldDeclaration[]) ?? [];
  const activeFilters = (props.activeFilters as ActiveFilter[]) ?? [];
  const surface = (props.surface as 'page' | 'card') ?? 'card';

  const columns = resolveColumns(props.columns as ColumnDef[] | undefined, childNodes);
  const records = (bind.value as Record<string, unknown>[]) ?? [];
  const colCount = columns.length + (selectable ? 1 : 0);

  const showPagination = pageSize > 0 && total > 0;
  const showInlineFilters = filterFields.length > 0 && surface === 'card';

  return (
    <Table variant={variant} className={bordered ? 'ring-1 ring-border' : undefined}>
      {showInlineFilters && (
        <TableFilterBar
          fields={filterFields}
          activeFilters={activeFilters}
          onSetFilter={(field, operator, value) => on.setFilter?.(field, operator, value)}
          onRemoveFilter={(field, operator) => on.removeFilter?.(field, operator)}
        />
      )}
      <Table.Content>
        <Table.Header>
          <tr>
            {selectable && (
              <Table.SelectHead
                allSelected={false}
                onSelectAll={(checked) => on.selectAll?.(checked)}
              />
            )}
            {columns.map((col) => (
              <Table.Head
                key={col.field}
                align={col.align}
                width={col.width}
                sortable={col.sortable}
                sorted={sorted?.field === col.field ? sorted.direction : null}
                onSort={() => on.sort?.(col.field)}
              >
                {col.label}
              </Table.Head>
            ))}
          </tr>
        </Table.Header>

        {loading ? (
          <Table.Skeleton columns={colCount} rows={pageSize || 5} />
        ) : records.length === 0 ? (
          <Table.Body>
            <Table.Empty colSpan={colCount}>{emptyText}</Table.Empty>
          </Table.Body>
        ) : (
          <Table.Body
            className={fetching ? 'opacity-50 transition-opacity duration-150' : undefined}
          >
            {records.map((row, idx) => (
              <Table.Row
                key={(row.id as string) ?? idx}
                striped={striped && idx % 2 === 1}
                onClick={on.rowClick ? () => on.rowClick?.(row) : undefined}
              >
                {selectable && (
                  <Table.SelectCell
                    rowNumber={idx + 1}
                    selected={false}
                    onSelectChange={(checked) => on.select?.(row, checked)}
                  />
                )}
                {columns.map((col) => (
                  <Table.Cell key={col.field} align={col.align}>
                    {col.renderCell
                      ? col.renderCell(row, idx)
                      : renderDisplay(col.fieldType, row[col.field], toCellColumn(col))}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        )}
      </Table.Content>

      {showPagination && (
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={(p) => on.pageChange?.(p)}
        />
      )}
    </Table>
  );
}

function toCellColumn(col: ColumnDef): CellColumn {
  return {
    field: col.field,
    fieldType: col.fieldType,
    options: col.options,
    currency: col.currency,
    precision: col.precision,
    namingField: col.namingField,
  };
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
        width: node.props?.width as string | undefined,
        align: node.props?.align as 'left' | 'center' | 'right' | undefined,
        sortable: node.props?.sortable as boolean | undefined,
        fieldType: node.props?.fieldType as string | undefined,
        options: node.props?.options as Array<{ value: string; label: string }> | undefined,
        currency: node.props?.currency as string | undefined,
        precision: node.props?.precision as number | undefined,
        children: node.children,
      }));
  }

  return [];
}

TableWidget.displayName = 'TableWidget';
