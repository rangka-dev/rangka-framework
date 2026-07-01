import { useState, useCallback } from 'react';
import { List } from 'lucide-react';
import { Badge } from '../../../primitives/badge';
import { useClickOutside } from '../../../lib/use-click-outside';
import { cn } from '../../../lib/cn';
import { FieldDisplay, EmptyValue } from '../field-display';

interface SelectEditorProps {
  label?: string;
  value: string;
  options: { value: string; label: string }[];
  readOnly?: boolean;
  onSave: (value: unknown) => void;
}

export function SelectEditor({ label, value, options, readOnly, onSave }: SelectEditorProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const containerRef = useClickOutside<HTMLDivElement>(
    useCallback(() => setEditing(false), []),
    editing,
  );

  const handleClick = () => {
    if (readOnly) return;
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

  const selected = options.find((opt) => opt.value === value);

  const displayValue = selected ? (
    <Badge variant="secondary" className="text-2xs">
      {selected.label}
    </Badge>
  ) : (
    <EmptyValue />
  );

  return (
    <div ref={containerRef}>
      <FieldDisplay
        label={label}
        icon={List}
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
              <div className="min-w-[180px] shadow-md border border-border rounded-md bg-popover py-1">
                {options.map((opt) => (
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
          </>
        )}
      </FieldDisplay>
    </div>
  );
}
