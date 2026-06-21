import { useState, useEffect, useRef } from 'react';
import type { CellEditorProps } from './types.js';

export function TextEditor({ value, onCommit, onCancel }: CellEditorProps) {
  const [localValue, setLocalValue] = useState(value != null ? String(value) : '');
  const inputRef = useRef<HTMLInputElement>(null);
  const committedRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      committedRef.current = true;
      onCommit(localValue);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      committedRef.current = true;
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => {
        if (!committedRef.current) onCommit(localValue);
      }}
      onKeyDown={handleKeyDown}
      className="h-full w-full border-0 bg-transparent px-2 text-sm outline-none ring-0"
    />
  );
}
