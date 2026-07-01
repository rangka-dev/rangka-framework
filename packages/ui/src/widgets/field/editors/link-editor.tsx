import { useState, useCallback } from 'react';
import { Link2 } from 'lucide-react';
import { Input } from '../../../primitives/input';
import { useClickOutside } from '../../../lib/use-click-outside';
import { cn } from '../../../lib/cn';
import { FieldDisplay, EmptyValue } from '../field-display';

interface LinkEditorProps {
  label?: string;
  value: unknown;
  options?: { value: string; label: string }[];
  readOnly?: boolean;
  onSave: (value: unknown) => void;
}

export function LinkEditor({ label, value, options = [], readOnly, onSave }: LinkEditorProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const containerRef = useClickOutside<HTMLDivElement>(
    useCallback(() => setEditing(false), []),
    editing,
  );

  const handleClick = () => {
    if (readOnly) return;
    setSearch('');
    setEditing(true);
  };

  const handleSelect = (optValue: string) => {
    if (optValue !== value) {
      setSaving(true);
      onSave(optValue);
      setTimeout(() => setSaving(false), 600);
    }
    setEditing(false);
  };

  const filtered = search
    ? options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const selected = options.find((opt) => opt.value === value);
  const displayValue = selected ? (
    <span className="text-primary">{selected.label}</span>
  ) : (
    <EmptyValue />
  );

  return (
    <div ref={containerRef}>
      <FieldDisplay
        label={label}
        icon={Link2}
        value={displayValue}
        readOnly={readOnly}
        editing={editing}
        saving={saving}
        onClick={handleClick}
      >
        {editing && (
          <>
            <span className={cn('text-2xs block truncate font-medium', saving && 'opacity-50')}>
              {displayValue}
            </span>
            <div className="absolute top-full left-0 mt-1 z-50">
              <div className="min-w-[200px] shadow-md border border-border rounded-md bg-popover py-1">
                <div className="px-2 pb-1">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="h-7 text-2xs"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-auto">
                  {filtered.length === 0 && (
                    <div className="px-3 py-1.5 text-2xs text-muted-foreground">No results</div>
                  )}
                  {filtered.map((opt) => (
                    <div
                      key={opt.value}
                      className={cn(
                        'px-3 py-1.5 text-2xs cursor-pointer transition-colors hover:bg-accent',
                        opt.value === value && 'bg-accent font-medium',
                      )}
                      onClick={() => handleSelect(opt.value)}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </FieldDisplay>
    </div>
  );
}
