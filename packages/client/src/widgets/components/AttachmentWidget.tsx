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

export function AttachmentWidget({ props, bind, on }: WidgetProps) {
  const label = (props.label as string) ?? bind.meta?.label ?? '';
  const accept = (props.accept as string) ?? '';
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly ?? false;
  const inputRef = useRef<HTMLInputElement>(null);

  const fileValue = bind.value as FileValue | null | undefined;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const value = { name: file.name, size: file.size };
      bind.setValue?.(value);
      on.change?.(value);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const value = { name: file.name, size: file.size };
      bind.setValue?.(value);
      on.change?.(value);
    }
  };

  const handleRemove = () => {
    bind.setValue?.(null);
    on.remove?.();
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <Field>
      {label && <FieldLabel>{label}</FieldLabel>}
      {fileValue ? (
        <div className="flex items-center gap-2 rounded-md border border-input px-3 py-2">
          <span className="flex-1 truncate text-sm">{fileValue.name}</span>
          {fileValue.size && (
            <span className="text-xs text-muted-foreground">
              {(fileValue.size / 1024).toFixed(1)} KB
            </span>
          )}
          {!disabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="h-5 px-1"
              aria-label="Remove file"
            >
              ×
            </Button>
          )}
        </div>
      ) : (
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
          aria-label="Upload file"
        >
          <p className="text-xs text-muted-foreground">Drop a file here or click to browse</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
    </Field>
  );
}

AttachmentWidget.widgetMeta = {
  name: 'attachment',
  label: 'Attachment',
  category: 'input' as const,
  schema: {
    label: { type: 'string' as const },
    accept: { type: 'string' as const },
    maxSize: { type: 'string' as const },
    disabled: { type: 'boolean' as const, default: false },
  },
  binding: 'field' as const,
  triggers: ['change', 'remove'],
  container: false,
};
