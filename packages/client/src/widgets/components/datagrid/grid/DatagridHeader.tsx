import {
  ChevronUpIcon,
  ChevronDownIcon,
  GripVerticalIcon,
  TypeIcon,
  HashIcon,
  CalendarIcon,
  ToggleLeftIcon,
  LinkIcon,
  ListIcon,
  DollarSignIcon,
  FileTextIcon,
  CodeIcon,
  PaperclipIcon,
  ClockIcon,
} from 'lucide-react';
import type { Table, Header } from '@tanstack/react-table';
import { ColumnResizeHandle } from '../columns/ColumnResizeHandle.js';
import type { DatagridColumnMeta } from '../hooks/useDatagridColumns.js';
import type { SortEntry } from '../../../reactivity/variables.js';
import { useCallback, useEffect, useRef, useState } from 'react';

interface DatagridHeaderProps {
  table: Table<Record<string, unknown>>;
  selectable: boolean;
  currentSort: SortEntry[] | null;
  onSort: (field: string, multi?: boolean) => void;
  reorderable: boolean;
  onColumnReorder: (draggedId: string, targetId: string) => void;
  gridTemplateColumns: string;
}

export function DatagridHeader({
  table,
  selectable,
  currentSort,
  onSort,
  reorderable,
  onColumnReorder,
  gridTemplateColumns,
}: DatagridHeaderProps) {
  const headerGroups = table.getHeaderGroups();
  const isResizing = table.getState().columnSizingInfo.isResizingColumn;

  return (
    <div
      role="row"
      className={`grid border-t border-b-2 border-border sticky top-0 z-20 bg-card ${isResizing ? 'select-none' : ''}`}
      style={{ gridTemplateColumns }}
    >
      {selectable && (
        <div
          role="columnheader"
          className="flex items-center justify-center border-r border-border"
        >
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="h-3.5 w-3.5 cursor-pointer"
            aria-label="Select all"
          />
        </div>
      )}
      {headerGroups[0]?.headers.map((header) => (
        <HeaderCell
          key={header.id}
          header={header}
          currentSort={currentSort}
          onSort={onSort}
          reorderable={reorderable}
          onColumnReorder={onColumnReorder}
          isAnyResizing={!!isResizing}
        />
      ))}
    </div>
  );
}

interface HeaderCellProps {
  header: Header<Record<string, unknown>, unknown>;
  currentSort: SortEntry[] | null;
  onSort: (field: string, multi?: boolean) => void;
  reorderable: boolean;
  onColumnReorder: (draggedId: string, targetId: string) => void;
  isAnyResizing: boolean;
}

function HeaderCell({
  header,
  currentSort,
  onSort,
  reorderable,
  onColumnReorder,
  isAnyResizing,
}: HeaderCellProps) {
  const meta = header.column.columnDef.meta as DatagridColumnMeta | undefined;
  const field = meta?.fieldName ?? '';
  const sortable = meta?.sortable ?? false;
  const frozen = meta?.frozen ?? false;
  const [dragOver, setDragOver] = useState(false);
  const wasResizingRef = useRef(false);

  useEffect(() => {
    if (isAnyResizing) {
      wasResizingRef.current = true;
    } else if (wasResizingRef.current) {
      setTimeout(() => {
        wasResizingRef.current = false;
      }, 0);
    }
  }, [isAnyResizing]);

  const sortState = getSortState(currentSort, field);
  const alignClass = 'justify-start';

  const canDrag = reorderable && !frozen && !isAnyResizing;
  const showGrip = reorderable && !frozen;

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData('text/plain', header.id);
      e.dataTransfer.effectAllowed = 'move';
    },
    [header.id],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const draggedId = e.dataTransfer.getData('text/plain');
      if (draggedId && draggedId !== header.id) {
        onColumnReorder(draggedId, header.id);
      }
    },
    [header.id, onColumnReorder],
  );

  return (
    <div
      role="columnheader"
      aria-sort={sortState === 'asc' ? 'ascending' : sortState === 'desc' ? 'descending' : 'none'}
      aria-colindex={header.index + 1}
      className={`relative flex items-center gap-1 px-2 py-2 text-xs font-semibold text-muted-foreground border-r border-border ${alignClass} ${
        sortable && !isAnyResizing ? 'cursor-pointer select-none hover:text-foreground' : ''
      } ${dragOver ? 'border-l-2 border-primary' : ''} ${frozen ? 'sticky left-0 z-10 bg-card' : ''}`}
      onClick={
        sortable
          ? (e: React.MouseEvent) => {
              if (!wasResizingRef.current) onSort(field, e.shiftKey);
            }
          : undefined
      }
      draggable={canDrag}
      onDragStart={canDrag ? handleDragStart : undefined}
      onDragOver={canDrag ? handleDragOver : undefined}
      onDragLeave={canDrag ? handleDragLeave : undefined}
      onDrop={canDrag ? handleDrop : undefined}
    >
      {showGrip && (
        <GripVerticalIcon className="h-3 w-3 shrink-0 text-muted-foreground/50 cursor-grab" />
      )}
      <FieldTypeIcon fieldType={meta?.fieldType} />
      <span className="truncate">{meta?.label ?? header.id}</span>
      {sortState === 'asc' && <ChevronUpIcon className="h-3 w-3 shrink-0 text-foreground" />}
      {sortState === 'desc' && <ChevronDownIcon className="h-3 w-3 shrink-0 text-foreground" />}
      <ColumnResizeHandle header={header} />
    </div>
  );
}

function getSortState(sort: SortEntry[] | null, field: string): 'asc' | 'desc' | null {
  if (!sort) return null;
  const entry = sort.find((s) => s.field === field);
  return entry?.direction ?? null;
}

function FieldTypeIcon({ fieldType }: { fieldType: string | undefined }) {
  const cls = 'h-3 w-3 shrink-0 text-muted-foreground/60';
  switch (fieldType) {
    case 'string':
    case 'text':
      return <TypeIcon className={cls} />;
    case 'int':
    case 'decimal':
      return <HashIcon className={cls} />;
    case 'money':
      return <DollarSignIcon className={cls} />;
    case 'boolean':
      return <ToggleLeftIcon className={cls} />;
    case 'date':
      return <CalendarIcon className={cls} />;
    case 'datetime':
      return <ClockIcon className={cls} />;
    case 'enum':
      return <ListIcon className={cls} />;
    case 'link':
      return <LinkIcon className={cls} />;
    case 'json':
    case 'code':
      return <CodeIcon className={cls} />;
    case 'attachment':
    case 'attachments':
      return <PaperclipIcon className={cls} />;
    case 'computed':
    case 'sequence':
      return <FileTextIcon className={cls} />;
    default:
      return <TypeIcon className={cls} />;
  }
}
