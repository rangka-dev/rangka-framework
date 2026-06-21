import { useState, useEffect, useRef } from 'react';
import type { CellEditorProps } from './types.js';

export function DatetimeEditor({ value, onCommit, onCancel }: CellEditorProps) {
  const [localValue, setLocalValue] = useState(() => {
    if (!value) return '';
    const d = new Date(value as string);
    if (isNaN(d.getTime())) return '';
    return toLocalDatetimeString(d);
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const committedRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const commit = () => {
    if (!localValue) {
      onCommit(null);
      return;
    }
    const d = new Date(localValue);
    if (isNaN(d.getTime())) {
      onCancel();
      return;
    }
    onCommit(d.toISOString());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      committedRef.current = true;
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      committedRef.current = true;
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type="datetime-local"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => {
        if (!committedRef.current) commit();
      }}
      onKeyDown={handleKeyDown}
      className="h-full w-full border-0 bg-transparent px-2 text-sm outline-none ring-0"
    />
  );
}

function toLocalDatetimeString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
