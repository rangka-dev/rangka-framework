import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ComponentProps } from 'react';
import { Pencil } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Icon } from './icon';
import { cn } from '../lib/cn';

const inlineFieldVariants = cva(
  'group relative flex items-center gap-3 px-3 rounded-md transition-all h-[36px]',
  {
    variants: {
      state: {
        idle: 'hover:bg-accent/50 cursor-pointer',
        editing: 'bg-accent ring-1 ring-border',
        readOnly: '',
      },
    },
    defaultVariants: { state: 'idle' },
  },
);

export type InlineFieldProps = ComponentProps<'div'> &
  VariantProps<typeof inlineFieldVariants> & {
    /** Field label text */
    label?: string;
    /** Icon displayed before the label */
    icon?: LucideIcon;
    /** Whether the field is read-only */
    readOnly?: boolean;
    /** Whether the field is in editing state */
    editing?: boolean;
    /** Whether the field is saving */
    saving?: boolean;
  };

export type InlineFieldValueProps = ComponentProps<'span'> & {
  /** Whether the value is in saving state */
  saving?: boolean;
  /** Whether the field is read-only */
  readOnly?: boolean;
};

export type InlineFieldEmptyProps = ComponentProps<'span'>;

const InlineFieldRoot = forwardRef<HTMLDivElement, InlineFieldProps>(
  ({ className, label, icon, readOnly, editing, children, ...props }, ref) => {
    const state = editing ? 'editing' : readOnly ? 'readOnly' : 'idle';

    return (
      <div ref={ref} className={cn(inlineFieldVariants({ state, className }))} {...props}>
        <div className="flex items-center gap-2 w-[140px] shrink-0">
          {icon && <Icon icon={icon} size="sm" className="text-muted-foreground/70 shrink-0" />}
          <span className="text-2xs text-muted-foreground truncate">{label}</span>
        </div>
        <div className="flex-1 min-w-0 relative">{children}</div>
        {!readOnly && !editing && (
          <Icon
            icon={Pencil}
            size="sm"
            className="absolute right-2 opacity-0 group-hover:opacity-50 transition-opacity text-muted-foreground"
          />
        )}
      </div>
    );
  },
);
InlineFieldRoot.displayName = 'InlineField';

const InlineFieldValue = forwardRef<HTMLSpanElement, InlineFieldValueProps>(
  ({ className, saving, readOnly, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'text-2xs block truncate font-medium',
          saving && 'opacity-50',
          readOnly && 'text-foreground/70',
          className,
        )}
        {...props}
      >
        {children}
      </span>
    );
  },
);
InlineFieldValue.displayName = 'InlineField.Value';

const InlineFieldEmpty = forwardRef<HTMLSpanElement, InlineFieldEmptyProps>(
  ({ className, ...props }, ref) => {
    return (
      <span ref={ref} className={cn('text-foreground/30 italic', className)} {...props}>
        Empty
      </span>
    );
  },
);
InlineFieldEmpty.displayName = 'InlineField.Empty';

export const InlineField = Object.assign(InlineFieldRoot, {
  Value: InlineFieldValue,
  Empty: InlineFieldEmpty,
});

export { inlineFieldVariants };
