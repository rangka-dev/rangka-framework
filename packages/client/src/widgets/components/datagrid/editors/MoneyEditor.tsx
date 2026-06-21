import { useState, useEffect, useRef } from 'react';
import type { CellEditorProps } from './types.js';

export function MoneyEditor({ value, onCommit, onCancel }: CellEditorProps) {
  const [localValue, setLocalValue] = useState(value != null ? String(value) : '');
  const inputRef = useRef<HTMLInputElement>(null);
  const committedRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const commit = () => {
    if (localValue === '') {
      onCommit(null);
      return;
    }
    const num = parseFloat(localValue);
    if (isNaN(num)) {
      onCancel();
      return;
    }
    onCommit(num);
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
      type="number"
      step="0.01"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => {
        if (!committedRef.current) commit();
      }}
      onKeyDown={handleKeyDown}
      className="h-full w-full border-0 bg-transparent px-2 text-sm tabular-nums text-right outline-none ring-0"
    />
  );
}
