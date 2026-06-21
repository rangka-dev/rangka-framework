import { useState, useEffect, useRef } from 'react';
import type { CellEditorProps } from './types.js';

export function DateEditor({ value, onCommit, onCancel }: CellEditorProps) {
  const [localValue, setLocalValue] = useState(() => {
    if (!value) return '';
    const d = new Date(value as string);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const committedRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      committedRef.current = true;
      onCommit(localValue || null);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      committedRef.current = true;
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type="date"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => {
        if (!committedRef.current) onCommit(localValue || null);
      }}
      onKeyDown={handleKeyDown}
      className="h-full w-full border-0 bg-transparent px-2 text-sm outline-none ring-0"
    />
  );
}
