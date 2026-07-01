import { useState } from 'react';
import { ToggleLeft } from 'lucide-react';
import { InlineField } from '../../primitives/inline-field';
import { cn } from '../../lib/cn';

interface CheckboxEditorProps {
  label?: string;
  value: boolean;
  readOnly?: boolean;
  onSave: (value: unknown) => void;
}

export function CheckboxEditor({ label, value, readOnly, onSave }: CheckboxEditorProps) {
  const [saving, setSaving] = useState(false);

  const handleChange = () => {
    if (readOnly) return;
    const next = !value;
    setSaving(true);
    onSave(next);
    setTimeout(() => setSaving(false), 600);
  };

  return (
    <InlineField label={label} icon={ToggleLeft} readOnly={readOnly}>
      <input
        type="checkbox"
        checked={value}
        onChange={handleChange}
        disabled={readOnly}
        className={cn(
          'size-4 rounded-sm accent-primary cursor-pointer',
          saving && 'opacity-50',
          readOnly && 'opacity-70 cursor-default',
        )}
      />
    </InlineField>
  );
}
