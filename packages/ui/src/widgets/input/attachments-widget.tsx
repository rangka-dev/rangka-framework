import { Upload, X, File } from 'lucide-react';
import { Icon } from '../../primitives/icon';
import { Field } from '../../form/field';
import { cn } from '../../lib/cn';
import type { WidgetComponentProps } from '../types';

interface FileValue {
  name: string;
  url?: string;
  size?: number;
}

export function AttachmentsWidget({ props, bind, on }: WidgetComponentProps) {
  const label = (props.label as string) ?? bind.meta?.label;
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly;
  const required = bind.meta?.required;
  const accept = props.accept as string | undefined;
  const maxCount = (props.maxCount as number) ?? Infinity;

  const files = (bind.value as FileValue[]) ?? [];
  const canAdd = files.length < maxCount;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files ?? []);
    const remaining = maxCount - files.length;
    const toAdd = newFiles.slice(0, remaining).map((f) => ({ name: f.name, size: f.size }));
    const next = [...files, ...toAdd];
    bind.setValue?.(next);
    on.change?.(next);
  };

  const handleRemove = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    bind.setValue?.(next);
    on.change?.(next);
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Field data-invalid={!!bind.error || undefined}>
      {label && <Field.Label required={required}>{label}</Field.Label>}
      {canAdd && (
        <label
          className={cn(
            'flex h-16 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-border',
            'text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-foreground/4',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          <Icon icon={Upload} size="sm" />
          <span>Drop files or click to upload</span>
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled}
            accept={accept}
            multiple
          />
        </label>
      )}
      {files.length > 0 && (
        <div className="flex flex-col gap-1">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5"
            >
              <Icon icon={File} size="sm" className="text-muted-foreground" />
              <span className="flex-1 truncate text-sm">{file.name}</span>
              {file.size && (
                <span className="text-xs text-muted-foreground">{formatSize(file.size)}</span>
              )}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="rounded-full p-1 hover:bg-foreground/6"
                >
                  <Icon icon={X} size="sm" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {bind.error && <Field.Error>{bind.error}</Field.Error>}
    </Field>
  );
}

AttachmentsWidget.displayName = 'AttachmentsWidget';
