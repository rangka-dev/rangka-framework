import { Field } from '../../form/field';
import { FileUpload } from '../../form/file-upload';
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

export function AttachmentWidget({ props, bind, on }: WidgetComponentProps) {
  const label = (props.label as string) ?? bind.meta?.label;
  const disabled = (props.disabled as boolean) ?? bind.meta?.readOnly;
  const required = bind.meta?.required;
  const accept = props.accept as string | undefined;

  const file = bind.value as FileValue | null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const value: FileValue = { name: f.name, size: f.size };
    bind.setValue?.(value);
    on.change?.(value);
  };

  const handleRemove = () => {
    bind.setValue?.(null);
    on.change?.(null);
  };

  return (
    <Field data-invalid={!!bind.error || undefined}>
      {label && <Field.Label required={required}>{label}</Field.Label>}
      {!file ? (
        <FileUpload.Dropzone accept={accept} disabled={disabled} onChange={handleFileChange} />
      ) : (
        <FileUpload.Item
          name={file.name}
          size={formatSize(file.size)}
          disabled={disabled}
          onRemove={handleRemove}
        />
      )}
      {bind.error && <Field.Error>{bind.error}</Field.Error>}
    </Field>
  );
}

AttachmentWidget.displayName = 'AttachmentWidget';
