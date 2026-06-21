import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { WidgetNode, ModelMeta } from '@rangka/shared';

export interface DatagridColumnMeta {
  fieldType: string;
  fieldName: string;
  editable: boolean;
  frozen: boolean;
  sortable: boolean;
  filterable: boolean;
  align: 'left' | 'center' | 'right';
  label: string;
}

const SKIP_FIELDS = new Set([
  'id',
  'created_at',
  'updated_at',
  'deleted_at',
  'created_by',
  'updated_by',
]);

const NON_EDITABLE_TYPES = new Set([
  'json',
  'code',
  'computed',
  'sequence',
  'attachment',
  'attachments',
]);

const AUTO_COLUMN_DEFAULTS: Record<
  string,
  {
    width: number;
    align: 'left' | 'center' | 'right';
    editable: boolean;
    sortable: boolean;
    filterable: boolean;
  }
> = {
  string: { width: 180, align: 'left', editable: true, sortable: true, filterable: true },
  text: { width: 250, align: 'left', editable: true, sortable: false, filterable: false },
  int: { width: 100, align: 'right', editable: true, sortable: true, filterable: true },
  decimal: { width: 120, align: 'right', editable: true, sortable: true, filterable: true },
  money: { width: 130, align: 'right', editable: true, sortable: true, filterable: true },
  boolean: { width: 90, align: 'center', editable: true, sortable: false, filterable: true },
  date: { width: 120, align: 'left', editable: true, sortable: true, filterable: true },
  datetime: { width: 160, align: 'left', editable: true, sortable: true, filterable: true },
  enum: { width: 130, align: 'left', editable: true, sortable: true, filterable: true },
  link: { width: 180, align: 'left', editable: true, sortable: false, filterable: true },
  sequence: { width: 100, align: 'left', editable: false, sortable: true, filterable: false },
  computed: { width: 150, align: 'left', editable: false, sortable: true, filterable: false },
  json: { width: 200, align: 'left', editable: false, sortable: false, filterable: false },
  code: { width: 200, align: 'left', editable: false, sortable: false, filterable: false },
  attachment: { width: 150, align: 'left', editable: false, sortable: false, filterable: false },
  attachments: { width: 150, align: 'left', editable: false, sortable: false, filterable: false },
};

function toTitleCase(str: string): string {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface UseDatagridColumnsOptions {
  columns: WidgetNode[];
  modelMeta: ModelMeta | undefined;
  gridEditable: boolean;
}

export function useDatagridColumns({
  columns,
  modelMeta,
  gridEditable,
}: UseDatagridColumnsOptions): ColumnDef<Record<string, unknown>, unknown>[] {
  return useMemo(() => {
    if (columns.length > 0) {
      return columnsFromNodes(columns, modelMeta, gridEditable);
    }
    if (modelMeta) {
      return columnsFromMeta(modelMeta, gridEditable);
    }
    return [];
  }, [columns, modelMeta, gridEditable]);
}

function columnsFromNodes(
  nodes: WidgetNode[],
  modelMeta: ModelMeta | undefined,
  gridEditable: boolean,
): ColumnDef<Record<string, unknown>, unknown>[] {
  return nodes
    .filter((col) => col.bind?.field)
    .map((col) => {
      const field = col.bind!.field!;
      const fieldMeta = modelMeta?.fields.find((f) => f.name === field);
      const fieldType = fieldMeta?.type ?? 'string';
      const defaults = AUTO_COLUMN_DEFAULTS[fieldType] ?? AUTO_COLUMN_DEFAULTS.string;

      const colEditable = col.props?.editable as boolean | undefined;
      const editable = resolveEditable(gridEditable, colEditable, fieldType);

      const meta: DatagridColumnMeta = {
        fieldType,
        fieldName: field,
        editable,
        frozen: (col.props?.frozen as boolean) ?? false,
        sortable: (col.props?.sortable as boolean) ?? false,
        filterable: (col.props?.filterable as boolean) ?? false,
        align: (col.props?.align as 'left' | 'center' | 'right') ?? defaults.align,
        label: (col.props?.label as string) ?? fieldMeta?.label ?? toTitleCase(field),
      };

      return {
        id: field,
        accessorKey: field,
        header: meta.label,
        size: parseInt(String(col.props?.width ?? defaults.width), 10),
        minSize: parseInt(String(col.props?.minWidth ?? '80'), 10),
        maxSize: col.props?.maxWidth ? parseInt(String(col.props.maxWidth), 10) : undefined,
        enableResizing: (col.props?.resizable as boolean) ?? true,
        meta,
      } as ColumnDef<Record<string, unknown>, unknown>;
    });
}

function columnsFromMeta(
  modelMeta: ModelMeta,
  gridEditable: boolean,
): ColumnDef<Record<string, unknown>, unknown>[] {
  return modelMeta.fields
    .filter((f) => !SKIP_FIELDS.has(f.name))
    .filter((f) => {
      if (f.type === 'hasMany' || f.type === 'manyToMany') return false;
      return true;
    })
    .map((f) => {
      const defaults = AUTO_COLUMN_DEFAULTS[f.type] ?? AUTO_COLUMN_DEFAULTS.string;
      const editable = resolveEditable(gridEditable, undefined, f.type);

      const meta: DatagridColumnMeta = {
        fieldType: f.type,
        fieldName: f.name,
        editable,
        frozen: false,
        sortable: defaults.sortable,
        filterable: defaults.filterable,
        align: defaults.align,
        label: f.label ?? toTitleCase(f.name),
      };

      return {
        id: f.name,
        accessorKey: f.name,
        header: meta.label,
        size: defaults.width,
        minSize: 80,
        enableResizing: true,
        meta,
      } as ColumnDef<Record<string, unknown>, unknown>;
    });
}

function resolveEditable(
  gridEditable: boolean,
  columnEditable: boolean | undefined,
  fieldType: string,
): boolean {
  if (!gridEditable) return false;
  if (columnEditable === false) return false;
  if (NON_EDITABLE_TYPES.has(fieldType)) return false;
  return columnEditable ?? true;
}
