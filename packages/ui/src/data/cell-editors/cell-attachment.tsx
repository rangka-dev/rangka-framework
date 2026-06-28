import { forwardRef, useRef, type ComponentProps } from 'react';
import { Paperclip, Plus, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Icon } from '../../primitives/icon';

export type CellAttachmentProps = Omit<ComponentProps<'div'>, 'value' | 'onChange'> & {
  /** Current filename (null if no file attached) */
  value?: string | null;
  /** Called with File when a file is selected, or null when removed */
  onChange?: (file: File | null) => void;
};

export const CellAttachment = forwardRef<HTMLDivElement, CellAttachmentProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      onChange?.(file);
      if (inputRef.current) inputRef.current.value = '';
    };

    return (
      <div ref={ref} className={cn('flex items-center gap-1 h-full w-full', className)} {...props}>
        {value ? (
          <span className="inline-flex items-center gap-1 rounded bg-foreground/8 px-1.5 py-0.5 text-2xs max-w-full overflow-hidden">
            <Icon icon={Paperclip} size="sm" className="shrink-0 h-3 w-3 text-muted-foreground" />
            <span className="truncate">{value}</span>
            <button
              type="button"
              onClick={() => onChange?.(null)}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <Icon icon={X} size="sm" className="h-3 w-3" />
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1 rounded bg-foreground/8 px-1.5 py-0.5 text-2xs text-muted-foreground hover:text-foreground"
          >
            <Icon icon={Plus} size="sm" className="h-3 w-3" />
            <span>Attach</span>
          </button>
        )}
        <input ref={inputRef} type="file" className="hidden" onChange={handleFileChange} />
      </div>
    );
  },
);

CellAttachment.displayName = 'CellAttachment';
