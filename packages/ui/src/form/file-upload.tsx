import { forwardRef, type ComponentProps } from 'react';
import { Upload, File, X } from 'lucide-react';
import { cn } from '../lib/cn';
import { Icon } from '../primitives/icon';

// --- FileUpload (Root) ---

export type FileUploadProps = ComponentProps<'div'>;

const FileUploadRoot = forwardRef<HTMLDivElement, FileUploadProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="file-upload"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  ),
);
FileUploadRoot.displayName = 'FileUpload';

// --- FileUpload.Dropzone ---

export type FileUploadDropzoneProps = Omit<ComponentProps<'label'>, 'onChange'> & {
  accept?: string;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const FileUploadDropzone = forwardRef<HTMLLabelElement, FileUploadDropzoneProps>(
  ({ className, accept, disabled, onChange, children, ...props }, ref) => (
    <label
      ref={ref}
      data-slot="file-upload-dropzone"
      className={cn(
        'flex h-20 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-border',
        'text-2xs text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-foreground/4',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      {...props}
    >
      {children ?? (
        <>
          <Icon icon={Upload} size="md" />
          <span>Drop file or click to upload</span>
        </>
      )}
      <input
        type="file"
        className="hidden"
        onChange={onChange}
        disabled={disabled}
        accept={accept}
      />
    </label>
  ),
);
FileUploadDropzone.displayName = 'FileUpload.Dropzone';

// --- FileUpload.Item ---

export type FileUploadItemProps = ComponentProps<'div'> & {
  name: string;
  size?: string;
  disabled?: boolean;
  onRemove?: () => void;
};

const FileUploadItem = forwardRef<HTMLDivElement, FileUploadItemProps>(
  ({ className, name, size, disabled, onRemove, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="file-upload-item"
      className={cn('flex items-center gap-2 rounded-md border border-border px-3 py-2', className)}
      {...props}
    >
      <Icon icon={File} size="sm" className="shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate text-2xs">{name}</span>
      {size && <span className="text-2xs text-muted-foreground">{size}</span>}
      {!disabled && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded-full p-1 transition-colors hover:bg-foreground/6"
          aria-label={`Remove ${name}`}
        >
          <Icon icon={X} size="sm" />
        </button>
      )}
    </div>
  ),
);
FileUploadItem.displayName = 'FileUpload.Item';

// --- Compose ---

export const FileUpload = Object.assign(FileUploadRoot, {
  Dropzone: FileUploadDropzone,
  Item: FileUploadItem,
});
