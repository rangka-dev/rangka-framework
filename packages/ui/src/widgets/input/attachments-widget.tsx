import { Field } from '../../form/field';
import { FileUpload } from '../../form/file-upload';
import { Stack } from '../../layout/stack';
import type { WidgetComponentProps } from '../types';

interface FileValue {
  name: string;
  url?: string;
  size?: number;
}

function formatSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

  return (
    <Field data-invalid={!!bind.error || undefined}>
      {label && <Field.Label required={required}>{label}</Field.Label>}
      <FileUpload>
        {canAdd && (
          <FileUpload.Dropzone
            accept={accept}
            disabled={disabled}
            onChange={handleFileChange}
            className="h-16"
          />
        )}
        {files.length > 0 && (
          <Stack gap="xs">
            {files.map((file, index) => (
              <FileUpload.Item
                key={index}
                name={file.name}
                size={formatSize(file.size)}
                disabled={disabled}
                onRemove={() => handleRemove(index)}
              />
            ))}
          </Stack>
        )}
      </FileUpload>
      {bind.error && <Field.Error>{bind.error}</Field.Error>}
    </Field>
  );
}

AttachmentsWidget.displayName = 'AttachmentsWidget';
