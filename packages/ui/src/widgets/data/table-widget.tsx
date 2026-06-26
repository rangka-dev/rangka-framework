import { Table } from '../../data/table';
import { TablePagination } from '../../data/table-pagination';
import type { WidgetComponentProps, WidgetNode } from '../types';

interface ColumnDef {
  field: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

export function TableWidget({ props, bind, on, childNodes }: WidgetComponentProps) {
  const variant = (props.variant as 'card' | 'flat') ?? 'flat';
  const selectable = props.selectable as boolean | undefined;
  const striped = props.striped as boolean | undefined;
  const emptyText = (props.emptyText as string) ?? 'No data';

  const page = (props.page as number) ?? 1;
  const pageSize = (props.pageSize as number) ?? 0;
  const total = (props.total as number) ?? 0;
  const sorted = props.sorted as { field: string; direction: 'asc' | 'desc' } | undefined;

  const columns = resolveColumns(props.columns as ColumnDef[] | undefined, childNodes);
  const records = (bind.value as Record<string, unknown>[]) ?? [];

  const handleSort = (field: string) => {
    on.sort?.(field);
  };

  const handleRowClick = (row: Record<string, unknown>) => {
    on.rowClick?.(row);
  };

  const handleSelect = (row: Record<string, unknown>) => {
    on.select?.(row);
  };

  const showPagination = pageSize > 0 && total > 0;

  return (
    <Table variant={variant}>
      <Table.Content>
        <Table.Header>
          <tr>
            {selectable && (
              <Table.Head width="40px" align="center">
                <input type="checkbox" className="cursor-pointer" aria-label="Select all" />
              </Table.Head>
            )}
            {columns.map((col) => (
              <Table.Head
                key={col.field}
                align={col.align}
                width={col.width}
                sortable={col.sortable}
                sorted={sorted?.field === col.field ? sorted.direction : null}
                onSort={() => handleSort(col.field)}
              >
                {col.label}
              </Table.Head>
            ))}
          </tr>
        </Table.Header>

        {records.length === 0 ? (
          <Table.Body>
            <Table.Empty colSpan={columns.length + (selectable ? 1 : 0)}>{emptyText}</Table.Empty>
          </Table.Body>
        ) : (
          <Table.Body>
            {records.map((row, idx) => (
              <Table.Row
                key={(row.id as string) ?? idx}
                striped={striped && idx % 2 === 1}
                onClick={on.rowClick ? () => handleRowClick(row) : undefined}
              >
                {selectable && (
                  <Table.Cell align="center">
                    <input
                      type="checkbox"
                      className="cursor-pointer"
                      aria-label={`Select row ${idx + 1}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(row);
                      }}
                    />
                  </Table.Cell>
                )}
                {columns.map((col) => (
                  <Table.Cell key={col.field} align={col.align}>
                    {row[col.field] != null ? String(row[col.field]) : ''}
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
      }));
  }

  return [];
}

TableWidget.displayName = 'TableWidget';
