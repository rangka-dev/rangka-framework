import { useState } from 'react';
import type { CellEditorProps } from './types.js';

export function EnumEditor({ value, meta, onCommit, onCancel }: CellEditorProps) {
  const options = (meta?.options ?? []) as readonly string[];
  const [localValue, setLocalValue] = useState(value != null ? String(value) : '');

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVal = e.target.value;
    setLocalValue(newVal);
    onCommit(newVal || null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <select
      value={localValue}
      onChange={handleChange}
      onBlur={() => onCancel()}
      onKeyDown={handleKeyDown}
      className="h-full w-full border-0 bg-transparent px-1 text-sm outline-none ring-0"
      autoFocus
    >
      <option value="">—</option>
      {options.map((opt) => (
        <option key={String(opt)} value={String(opt)}>
          {String(opt)}
        </option>
      ))}
    </select>
  );
}
