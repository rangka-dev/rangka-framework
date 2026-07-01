import type { ReactNode } from 'react';
import { Pencil } from 'lucide-react';
import { Icon } from '../../primitives/icon';
import { cn } from '../../lib/cn';
import type { LucideIcon } from 'lucide-react';

interface FieldDisplayProps {
  label?: string;
  icon: LucideIcon;
  value: ReactNode;
  readOnly?: boolean;
  editing?: boolean;
  saving?: boolean;
  onClick?: () => void;
  children?: ReactNode;
}

export function FieldDisplay({
  label,
  icon,
  value,
  readOnly,
  editing,
  saving,
  onClick,
  children,
}: FieldDisplayProps) {
  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 px-3 rounded-md transition-all h-[36px]',
        !readOnly && !editing && 'hover:bg-accent/50 cursor-pointer',
        editing && 'bg-accent ring-1 ring-border',
      )}
      onClick={!editing ? onClick : undefined}
    >
      <div className="flex items-center gap-2 w-[140px] shrink-0">
        <Icon icon={icon} size="sm" className="text-muted-foreground/70 shrink-0" />
        <span className="text-2xs text-muted-foreground truncate">{label}</span>
      </div>
      <div className="flex-1 min-w-0 relative">
        {children || (
          <span
            className={cn(
              'text-2xs block truncate font-medium',
              saving && 'opacity-50',
              readOnly && 'text-foreground/70',
            )}
          >
            {value}
          </span>
        )}
      </div>
      {!readOnly && !editing && (
        <Icon
          icon={Pencil}
          size="sm"
          className="absolute right-2 opacity-0 group-hover:opacity-50 transition-opacity text-muted-foreground"
        />
      )}
    </div>
  );
}

export function EmptyValue() {
  return <span className="text-foreground/30 italic">Empty</span>;
}
