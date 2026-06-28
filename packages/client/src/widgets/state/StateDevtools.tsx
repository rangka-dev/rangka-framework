import { useState, useMemo } from 'react';
import { usePageState, useStateVersion } from '../hooks/usePageState.js';

export function StateDevtools() {
  const store = usePageState();
  const version = useStateVersion();
  const [open, setOpen] = useState(false);

  const entries = useMemo(() => Object.entries(store.snapshot()), [store, version]);

  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[9999] font-mono text-xs">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-sm bg-foreground/90 px-2 py-1 text-background shadow-md hover:bg-foreground"
      >
        $state ({entries.length})
      </button>
      {open && entries.length > 0 && (
        <div className="absolute bottom-8 left-0 w-72 rounded-sm border border-border bg-surface p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between text-foreground/60">
            <span>Page State (v{version})</span>
            <button
              onClick={() => store.reset()}
              className="text-foreground/40 hover:text-foreground"
            >
              clear
            </button>
          </div>
          <div className="space-y-1">
            {entries.map(([key, value]) => (
              <div key={key} className="flex justify-between gap-2">
                <span className="shrink-0 text-foreground/70">{key}</span>
                <span className="truncate text-foreground">
                  {value === null ? 'null' : value === undefined ? 'undefined' : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
