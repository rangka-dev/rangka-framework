import { useState, useRef, useEffect } from 'react';
import { Type, Hash, DollarSign } from 'lucide-react';
import { InlineField } from '../../primitives/inline-field';
import { Input } from '../../primitives/input';
import { cn } from '../../lib/cn';

interface TextEditorProps {
  label?: string;
  value: unknown;
  fieldType?: string;
  currency?: string;
  readOnly?: boolean;
  onSave: (value: unknown) => void;
}

export function TextEditor({
  label,
  value,
  fieldType,
  currency = '$',
  readOnly,
  onSave,
}: TextEditorProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleClick = () => {
    if (readOnly) return;
    setEditValue(value != null ? String(value) : '');
    setEditing(true);
  };

  const handleSave = () => {
    const parsed = parseValue(editValue, fieldType);
    if (parsed !== value) {
      setSaving(true);
      onSave(parsed);
      setTimeout(() => setSaving(false), 600);
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value != null ? String(value) : '');
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  const icon = getFieldIcon(fieldType);
  const inputType =
    fieldType === 'int' || fieldType === 'decimal' || fieldType === 'money' ? 'number' : 'text';
  const step = fieldType === 'decimal' || fieldType === 'money' ? '0.01' : undefined;

  return (
    <InlineField
      label={label}
      icon={icon}
      readOnly={readOnly}
      editing={editing}
      onClick={!editing ? handleClick : undefined}
    >
      {editing ? (
        <div className="flex items-center gap-1">
          {fieldType === 'money' && (
            <span className="text-2xs text-muted-foreground">{currency}</span>
          )}
          <Input
            ref={inputRef}
            type={inputType}
            step={step}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={cn(
              'h-6 text-2xs border-0 shadow-none p-0 focus-visible:ring-0',
              inputType === 'number' &&
                '[&::-webkit-inner-spin-button]:appearance-none [appearance:textfield]',
            )}
          />
        </div>
      ) : (
        <InlineField.Value saving={saving} readOnly={readOnly}>
          {formatValue(value, fieldType, currency)}
        </InlineField.Value>
      )}
    </InlineField>
  );
}

function formatValue(value: unknown, fieldType?: string, currency?: string): React.ReactNode {
  if (value == null || value === '') return <InlineField.Empty />;
  switch (fieldType) {
    case 'int':
      return <span className="tabular-nums">{Number(value).toLocaleString()}</span>;
    case 'decimal':
      return (
        <span className="tabular-nums">
          {Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      );
    case 'money':
      return (
        <span className="tabular-nums">
          {currency}
          {Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      );
    default:
      return String(value);
  }
}

function parseValue(value: string, fieldType?: string): unknown {
  if (value === '') return null;
  if (fieldType === 'int') return parseInt(value, 10);
  if (fieldType === 'decimal' || fieldType === 'money') return parseFloat(value);
  return value;
}

function getFieldIcon(fieldType?: string) {
  switch (fieldType) {
    case 'int':
    case 'decimal':
      return Hash;
    case 'money':
      return DollarSign;
    default:
      return Type;
  }
}
