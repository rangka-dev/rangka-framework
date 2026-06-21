import { useState, useEffect, useRef } from 'react';
import type { Table } from '@tanstack/react-table';
import type { DatagridColumnMeta } from '../hooks/useDatagridColumns.js';
import { TextEditor } from '../editors/TextEditor.js';
import { NumberEditor } from '../editors/NumberEditor.js';
import { CheckboxEditor } from '../editors/CheckboxEditor.js';
import { DateEditor } from '../editors/DateEditor.js';
import { DatetimeEditor } from '../editors/DatetimeEditor.js';
import { EnumEditor } from '../editors/EnumEditor.js';
import { ComboboxEditor } from '../editors/ComboboxEditor.js';
import { MoneyEditor } from '../editors/MoneyEditor.js';
import { CellDisplay } from '../CellDisplay.js';
import type { CellEditorProps } from '../editors/types.js';
import { XIcon } from 'lucide-react';

interface NewRowRendererProps {
  newRow: { id: string; data: Record<string, unknown>; focusField?: string };
  table: Table<Record<string, unknown>>;
  rowHeight: number;
  offsetTop: number;
  selectable: boolean;
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
  onFieldChange: (field: string, value: unknown) => void;
  onDiscard: () => void;
}

export function NewRowRenderer({
  newRow,
  table,
  rowHeight,
  offsetTop,
  selectable,
  fieldMetaMap,
  gridTemplateColumns,
  onFieldChange,
  onDiscard,
}: NewRowRendererProps) {
  const columns = table.getVisibleLeafColumns();
  const [editingField, setEditingField] = useState<string | null>(newRow.focusField ?? null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current && newRow.focusField) {
      setEditingField(newRow.focusField);
      mountedRef.current = true;
    }
  }, [newRow.focusField]);

  return (
    <div
      role="row"
      className="absolute left-0 grid w-full border-b border-border/40 bg-primary/5 ring-1 ring-primary/20 ring-inset"
      style={{ top: offsetTop, height: rowHeight, gridTemplateColumns }}
    >
      {selectable && (
        <div className="flex w-10 shrink-0 items-center justify-center">
          <button
            onClick={onDiscard}
            className="rounded-sm p-0.5 text-muted-foreground hover:text-destructive hover:bg-muted"
            aria-label="Discard new row"
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {columns.map((col) => {
        const meta = col.columnDef.meta as DatagridColumnMeta | undefined;
        const fieldName = meta?.fieldName ?? '';
        const fieldMeta = fieldMetaMap[fieldName];
        const editable = meta?.editable ?? false;
        const align = meta?.align ?? 'left';
        const alignClass =
          align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
        const value = newRow.data[fieldName] ?? null;
        const isEditing = editingField === fieldName;
        const isRequired = fieldMeta?.required ?? false;

        if (isEditing && editable) {
          const Editor = getEditor(meta?.fieldType ?? 'string');
          if (Editor) {
            return (
              <div
                key={col.id}
                className={`relative flex items-center overflow-hidden ring-2 ring-primary ${alignClass}`}
              >
                <Editor
                  value={value}
                  field={fieldName}
                  meta={fieldMeta}
                  onCommit={(newValue) => {
                    onFieldChange(fieldName, newValue);
                    setEditingField(null);
                  }}
                  onCancel={() => setEditingField(null)}
                />
              </div>
            );
          }
        }

        return (
          <div
            key={col.id}
            className={`flex items-center truncate px-2 overflow-hidden ${alignClass} ${
              isRequired && value == null ? 'border-b-2 border-dashed border-warning/50' : ''
            } ${editable ? 'cursor-pointer hover:bg-muted/30' : ''}`}
            onClick={editable ? () => setEditingField(fieldName) : undefined}
          >
            {value != null ? (
              <CellDisplay value={value} fieldType={meta?.fieldType ?? 'string'} />
            ) : isRequired ? (
              <span className="text-xs text-muted-foreground/60 italic">
                {fieldMeta?.label ?? fieldName}*
              </span>
            ) : (
              <span className="text-muted-foreground/30">—</span>
            )}
          </div>
        );
      })}
      {!selectable && (
        <div className="flex shrink-0 items-center px-2">
          <button
            onClick={onDiscard}
            className="rounded-sm p-0.5 text-muted-foreground hover:text-destructive hover:bg-muted"
            aria-label="Discard new row"
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function getEditor(
  fieldType: string,
): ((props: CellEditorProps) => React.ReactElement | null) | null {
  switch (fieldType) {
    case 'string':
    case 'text':
      return TextEditor;
    case 'int':
    case 'decimal':
      return NumberEditor;
    case 'money':
      return MoneyEditor;
    case 'boolean':
      return CheckboxEditor;
    case 'date':
      return DateEditor;
    case 'datetime':
      return DatetimeEditor;
    case 'enum':
      return EnumEditor;
    case 'link':
      return ComboboxEditor;
    default:
      return null;
  }
}
