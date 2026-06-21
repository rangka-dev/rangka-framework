import type { CellEditorProps } from './types.js';

export function CheckboxEditor({ value, onCommit }: CellEditorProps) {
  const checked = Boolean(value);

  return (
    <div className="flex h-full items-center justify-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCommit(e.target.checked)}
        className="h-4 w-4 cursor-pointer"
        autoFocus
      />
    </div>
  );
}
