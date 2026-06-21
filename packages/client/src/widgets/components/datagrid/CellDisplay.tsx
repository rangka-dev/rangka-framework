import { format } from 'date-fns';

interface CellDisplayProps {
  value: unknown;
  fieldType: string;
}

export function CellDisplay({ value, fieldType }: CellDisplayProps) {
  if (value == null) return <span className="text-muted-foreground/50">—</span>;

  switch (fieldType) {
    case 'boolean':
      return (
        <div className="flex items-center justify-center">
          <div
            className={`h-3.5 w-3.5 rounded-sm border ${value ? 'border-primary bg-primary' : 'border-border'}`}
          >
            {value && (
              <svg className="h-3.5 w-3.5 text-primary-foreground" viewBox="0 0 14 14" fill="none">
                <path
                  d="M3.5 7L6 9.5L10.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>
      );

    case 'enum':
      return (
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {String(value)}
        </span>
      );

    case 'date':
      try {
        const d = new Date(value as string);
        return <>{format(d, 'MMM d, yyyy')}</>;
      } catch {
        return <>{String(value)}</>;
      }

    case 'datetime':
      try {
        const d = new Date(value as string);
        return <>{format(d, 'MMM d, yyyy h:mm a')}</>;
      } catch {
        return <>{String(value)}</>;
      }

    case 'money':
    case 'decimal':
      return (
        <span className="tabular-nums">
          {Number(value).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      );

    case 'int':
      return <span className="tabular-nums">{Number(value).toLocaleString()}</span>;

    case 'json':
    case 'code':
      return (
        <span className="font-mono text-xs text-muted-foreground truncate">
          {JSON.stringify(value).slice(0, 50)}
        </span>
      );

    default:
      return <>{String(value)}</>;
  }
}
