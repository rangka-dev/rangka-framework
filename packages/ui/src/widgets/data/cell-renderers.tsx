import { type ReactNode } from 'react';
import { Badge } from '../../primitives/badge';
import { Icon } from '../../primitives/icon';
import { Paperclip } from 'lucide-react';
import { format as formatFns, parseISO } from 'date-fns';
import { CellInput } from '../../data/cell-editors/cell-input';
import { CellCheckbox } from '../../data/cell-editors/cell-checkbox';
import { CellSelect } from '../../data/cell-editors/cell-select';
import { CellDate } from '../../data/cell-editors/cell-date';
import { CellDateTime } from '../../data/cell-editors/cell-date-time';
import { CellMultiSelect } from '../../data/cell-editors/cell-multi-select';
import { CellAttachment } from '../../data/cell-editors/cell-attachment';
import { CellJson } from '../../data/cell-editors/cell-json';

// --- Column config for renderers ---

export interface CellColumn {
  field: string;
  fieldType?: string;
  options?: Array<{ value: string; label: string }>;
  currency?: string;
  precision?: number;
}

// --- Display renderers ---

export function renderDisplay(
  fieldType: string | undefined,
  value: unknown,
  col?: CellColumn,
): ReactNode {
  if (value == null) return <span className="text-muted-foreground">—</span>;

  switch (fieldType) {
    case 'boolean':
      return <CellCheckbox checked={!!value} readOnly className="pointer-events-none" />;

    case 'enum': {
      const options = col?.options;
      const label = options?.find((o) => o.value === value)?.label ?? String(value);
      return <Badge variant="secondary">{label}</Badge>;
    }

    case 'money': {
      const formatted = Number(value).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return <span className="tabular-nums">{formatted}</span>;
    }

    case 'int':
    case 'sequence':
      return <span className="tabular-nums">{Number(value).toLocaleString()}</span>;

    case 'decimal': {
      const precision = col?.precision ?? 2;
      return (
        <span className="tabular-nums">
          {Number(value).toLocaleString(undefined, {
            minimumFractionDigits: precision,
            maximumFractionDigits: precision,
          })}
        </span>
      );
    }

    case 'date':
      return <span className="tabular-nums">{formatDate(String(value))}</span>;

    case 'datetime':
      return <span className="tabular-nums">{formatDateTime(String(value))}</span>;

    case 'link': {
      const options = col?.options;
      const label = options?.find((o) => o.value === value)?.label ?? String(value);
      return <span className="text-primary">{label}</span>;
    }

    case 'many-to-many': {
      const arr = Array.isArray(value) ? value : [];
      const options = col?.options;
      if (arr.length === 0) return <span className="text-muted-foreground">—</span>;
      return (
        <span className="flex items-center gap-1 overflow-hidden">
          {arr.map((v, i) => {
            const label = options?.find((o) => o.value === v)?.label ?? String(v);
            return (
              <span
                key={i}
                className="inline-flex shrink-0 rounded bg-foreground/8 px-1.5 py-0.5 text-2xs"
              >
                {label}
              </span>
            );
          })}
        </span>
      );
    }

    case 'attachment':
      return (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Icon icon={Paperclip} size="sm" />
          <span className="truncate">{String(value)}</span>
        </span>
      );

    case 'json':
      return <span className="font-mono text-2xs truncate">{JSON.stringify(value)}</span>;

    default:
      return <span className="truncate">{String(value)}</span>;
  }
}

// --- Editor renderers ---

export function renderEditor(
  fieldType: string | undefined,
  value: unknown,
  onChange: (val: unknown) => void,
  col?: CellColumn,
): ReactNode {
  switch (fieldType) {
    case 'boolean':
      return <CellCheckbox checked={!!value} onChange={(e) => onChange(e.target.checked)} />;

    case 'enum':
      return (
        <CellSelect
          value={value as string | null}
          onChange={(v) => onChange(v)}
          options={col?.options ?? []}
        />
      );

    case 'money':
      return (
        <CellInput
          type="number"
          step="0.01"
          value={value != null ? String(value) : ''}
          onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
          autoFocus
        />
      );

    case 'int':
      return (
        <CellInput
          type="number"
          value={value != null ? String(value) : ''}
          onChange={(e) => onChange(e.target.value ? parseInt(e.target.value, 10) : null)}
          autoFocus
        />
      );

    case 'decimal':
      return (
        <CellInput
          type="number"
          step={col?.precision ? `0.${'0'.repeat(col.precision - 1)}1` : '0.01'}
          value={value != null ? String(value) : ''}
          onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
          autoFocus
        />
      );

    case 'date':
      return <CellDate value={value as string | null} onChange={(v) => onChange(v)} />;

    case 'datetime':
      return <CellDateTime value={value as string | null} onChange={(v) => onChange(v)} />;

    case 'link':
      return (
        <CellSelect
          value={value as string | null}
          onChange={(v) => onChange(v)}
          options={col?.options ?? []}
          searchable
        />
      );

    case 'many-to-many':
      return (
        <CellMultiSelect
          value={Array.isArray(value) ? value : []}
          onChange={(v) => onChange(v)}
          options={col?.options ?? []}
        />
      );

    case 'sequence':
      return renderDisplay(fieldType, value, col);

    case 'json':
      return <CellJson value={value} onChange={(v) => onChange(v)} />;

    case 'attachment':
      return <CellAttachment value={value as string | null} onChange={(file) => onChange(file)} />;

    case 'attachments':
      return renderDisplay(fieldType, value, col);

    default:
      return (
        <CellInput
          value={value != null ? String(value) : ''}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />
      );
  }
}

// --- Helpers ---

function formatDate(iso: string): string {
  try {
    return formatFns(parseISO(iso), 'PPP');
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string): string {
  try {
    return formatFns(parseISO(iso), 'PPP p');
  } catch {
    return iso;
  }
}
