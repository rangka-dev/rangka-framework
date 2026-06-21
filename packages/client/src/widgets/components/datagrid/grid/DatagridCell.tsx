import { memo, useCallback } from 'react';
import type { Cell } from '@tanstack/react-table';
import { CellDisplay } from '../CellDisplay.js';
import { TextEditor } from '../editors/TextEditor.js';
import { NumberEditor } from '../editors/NumberEditor.js';
import { CheckboxEditor } from '../editors/CheckboxEditor.js';
import { DateEditor } from '../editors/DateEditor.js';
import { DatetimeEditor } from '../editors/DatetimeEditor.js';
import { EnumEditor } from '../editors/EnumEditor.js';
import { ComboboxEditor } from '../editors/ComboboxEditor.js';
import { MoneyEditor } from '../editors/MoneyEditor.js';
import type { CellEditorProps } from '../editors/types.js';
import type { DatagridColumnMeta } from '../hooks/useDatagridColumns.js';

interface DatagridCellProps {
  cell: Cell<Record<string, unknown>, unknown>;
  isActive: boolean;
  isEditing: boolean;
  pendingValue: unknown | undefined;
  fieldMeta:
    | {
        type: string;
        label: string;
        required: boolean;
        options?: readonly string[];
        readOnly: boolean;
        relatedModel?: string;
      }
    | undefined;
  onActivate: () => void;
  onStartEdit: () => void;
  onCommit: (value: unknown) => void;
  onCancel: () => void;
}

export const DatagridCell = memo(function DatagridCell({
  cell,
  isActive,
  isEditing,
  pendingValue,
  fieldMeta,
  onActivate,
  onStartEdit,
  onCommit,
  onCancel,
}: DatagridCellProps) {
  const meta = cell.column.columnDef.meta as DatagridColumnMeta | undefined;
  const align = meta?.align ?? 'left';
  const editable = meta?.editable ?? false;
  const value = pendingValue !== undefined ? pendingValue : cell.getValue();

  const alignClass =
    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

  const handleDoubleClick = useCallback(() => {
    if (editable) onStartEdit();
  }, [editable, onStartEdit]);

  if (isEditing && editable) {
    const Editor = getEditor(meta?.fieldType ?? 'string');
    if (Editor) {
      return (
        <div
          role="gridcell"
          aria-colindex={cell.column.getIndex() + 1}
          className={`relative flex items-center overflow-hidden ring-2 ring-primary border-r border-border ${alignClass}`}
        >
          <Editor
            value={value}
            field={meta?.fieldName ?? ''}
            meta={fieldMeta}
            onCommit={onCommit}
            onCancel={onCancel}
          />
        </div>
      );
    }
  }

  return (
    <div
      role="gridcell"
      aria-colindex={cell.column.getIndex() + 1}
      aria-readonly={!editable}
      tabIndex={isActive ? 0 : -1}
      className={`flex items-center truncate px-2 cursor-pointer overflow-hidden border-r border-border ${alignClass} ${
        isActive ? 'ring-2 ring-ring ring-inset' : ''
      }`}
      onClick={onActivate}
      onDoubleClick={handleDoubleClick}
    >
      <CellDisplay value={value} fieldType={meta?.fieldType ?? 'string'} />
    </div>
  );
});

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
