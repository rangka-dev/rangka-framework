import { useState } from 'react';
import { ToggleLeft, Check } from 'lucide-react';
import { Icon } from '../../../primitives/icon';
import { cn } from '../../../lib/cn';

interface CheckboxEditorProps {
  label?: string;
  value: boolean;
  readOnly?: boolean;
  onSave: (value: unknown) => void;
}

export function CheckboxEditor({ label, value, readOnly, onSave }: CheckboxEditorProps) {
  const [saving, setSaving] = useState(false);

  const handleClick = () => {
    if (readOnly) return;
    const next = !value;
    setSaving(true);
    onSave(next);
    setTimeout(() => setSaving(false), 600);
  };

  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 px-3 rounded-md transition-all h-[36px]',
        !readOnly && 'hover:bg-accent/50 cursor-pointer',
      )}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2 w-[140px] shrink-0">
        <Icon icon={ToggleLeft} size="sm" className="text-muted-foreground/70 shrink-0" />
        <span className="text-2xs text-muted-foreground truncate">{label}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'size-4 rounded-sm border transition-colors',
            value ? 'bg-primary border-primary' : 'border-border bg-background',
            saving && 'opacity-50',
            readOnly && 'opacity-70',
          )}
        >
          {value && <Icon icon={Check} size="sm" className="text-primary-foreground" />}
        </div>
      </div>
    </div>
  );
}
