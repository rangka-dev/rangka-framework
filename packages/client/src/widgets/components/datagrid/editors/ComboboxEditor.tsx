import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../api/client.js';
import { modelToPath } from '../../../../api/paths.js';
import type { CellEditorProps } from './types.js';

export function ComboboxEditor({ meta, onCommit, onCancel }: CellEditorProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const relatedModel = meta?.relatedModel;

  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    };
  }, []);

  const path = relatedModel ? modelToPath(relatedModel) : '';

  const { data: options } = useQuery<Record<string, unknown>[]>({
    queryKey: ['model', relatedModel, 'combobox', search],
    queryFn: async () => {
      const url = new URL(path, window.location.origin);
      url.searchParams.set('limit', '20');
      if (search) url.searchParams.set('search', search);
      const res = await apiClient(url.pathname + url.search);
      if (!res.ok) return [];
      const json = await res.json();
      if (Array.isArray(json)) return json;
      if (json.data && Array.isArray(json.data)) return json.data;
      return [];
    },
    enabled: !!relatedModel && open,
  });

  const displayField = (() => {
    if (!options || options.length === 0) return 'name';
    const first = options[0];
    if ('name' in first) return 'name';
    if ('title' in first) return 'title';
    if ('label' in first) return 'label';
    const keys = Object.keys(first).filter((k) => k !== 'id');
    return keys[0] ?? 'id';
  })();

  const handleSelect = (id: unknown) => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
    onCommit(id);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="relative h-full w-full">
      <input
        ref={inputRef}
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          blurTimerRef.current = setTimeout(() => {
            setOpen(false);
            onCancel();
          }, 150);
        }}
        placeholder="Search..."
        className="h-full w-full border-0 bg-transparent px-2 text-sm outline-none ring-0"
      />
      {open && options && options.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-0.5 max-h-40 w-full overflow-auto rounded-sm border border-border bg-popover shadow-md">
          {options.map((opt) => (
            <button
              key={String(opt.id)}
              type="button"
              className="w-full px-2 py-1.5 text-left text-xs hover:bg-muted transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(opt.id);
              }}
            >
              {String(opt[displayField] ?? opt.id)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
