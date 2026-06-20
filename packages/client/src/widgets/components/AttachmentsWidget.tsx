import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import type { WidgetProps } from '../types.js';

interface FileValue {
  name: string;
  url?: string;
  size?: number;
}

export function AttachmentsWidget({ props, bind, on }: WidgetProps) {
  const label = (props.label as string) ?? bind.meta?.label ?? '';
  const accept = (props.accept as string) ?? '';
  const maxCount = (props.maxCount as number) ?? 10;
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly ?? false;
  const inputRef = useRef<HTMLInputElement>(null);

  const files = (bind.value as FileValue[] | null) ?? [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files ?? []).map((f) => ({ name: f.name, size: f.size }));
    const next = [...files, ...newFiles].slice(0, maxCount);
    bind.setValue?.(next);
    on.change?.(next);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    const newFiles = Array.from(e.dataTransfer.files).map((f) => ({ name: f.name, size: f.size }));
    const next = [...files, ...newFiles].slice(0, maxCount);
    bind.setValue?.(next);
    on.change?.(next);
  };

  const handleRemove = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    bind.setValue?.(next);
    on.remove?.(index);
  };

  return (
    <Field>
      {label && <FieldLabel>{label}</FieldLabel>}
      {files.length > 0 && (
        <ul className="mb-2 space-y-1" role="list">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center gap-2 rounded-md border border-input px-3 py-1.5"
            >
              <span className="flex-1 truncate text-sm">{file.name}</span>
              {file.size && (
                <span className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              )}
              {!disabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(i)}
                  className="h-5 px-1"
                  aria-label={`Remove ${file.name}`}
                >
                  ×
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {files.length < maxCount && (
        <div
          className={cn(
            'flex flex-col items-center justify-center rounded-md border-2 border-dashed border-input p-4 text-center transition-colors',
            !disabled && 'cursor-pointer hover:border-primary/50 hover:bg-accent/50',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
          onClick={() => !disabled && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          role="button"
          aria-label="Upload files"
        >
          <p className="text-xs text-muted-foreground">
            Drop files here or click to browse ({files.length}/{maxCount})
          </p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
    </Field>
  );
}

AttachmentsWidget.widgetMeta = {
  name: 'attachments',
  label: 'Attachments',
  category: 'input' as const,
  schema: {
    label: { type: 'string' as const },
    accept: { type: 'string' as const },
    maxSize: { type: 'string' as const },
    maxCount: { type: 'number' as const, default: 10 },
    disabled: { type: 'boolean' as const, default: false },
  },
  binding: 'field' as const,
  triggers: ['change', 'remove'],
  container: false,
};
