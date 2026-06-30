import type { Meta, StoryObj } from '@storybook/react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { PageShell } from '../pages/page-shell';
import { Input } from '../../src/primitives/input';
import { Badge } from '../../src/primitives/badge';
import { Icon } from '../../src/primitives/icon';
import { useClickOutside } from '../../src/lib/use-click-outside';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Type,
  Hash,
  Calendar,
  DollarSign,
  List,
  ToggleLeft,
  Link2,
  Pencil,
  ExternalLink,
  Search,
  Check,
} from 'lucide-react';
import { cn } from '../../src/lib/cn';

const meta: Meta = {
  title: 'Prototypes/Record Mode',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

// --- RecordField prototype ---

type FieldType =
  | 'string'
  | 'int'
  | 'decimal'
  | 'money'
  | 'date'
  | 'datetime'
  | 'enum'
  | 'boolean'
  | 'link';

interface RecordFieldProps {
  label: string;
  value: unknown;
  fieldType?: FieldType;
  options?: { value: string; label: string }[];
  readOnly?: boolean;
  icon?: typeof Type;
  onSave?: (value: unknown) => void;
}

function RecordField({
  label,
  value,
  fieldType = 'string',
  options,
  readOnly,
  icon,
  onSave,
}: RecordFieldProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleClick = () => {
    if (readOnly) return;
    if (fieldType === 'boolean') {
      const next = !value;
      setSaving(true);
      onSave?.(next);
      setTimeout(() => setSaving(false), 600);
      return;
    }
    setEditValue(value);
    setEditing(true);
  };

  const handleSave = (val?: unknown) => {
    const saveVal = val !== undefined ? val : editValue;
    if (saveVal !== value) {
      setSaving(true);
      onSave?.(saveVal);
      setTimeout(() => setSaving(false), 600);
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setEditing(false);
  };

  const formatValue = () => {
    if (value == null || value === '')
      return <span className="text-foreground/30 italic">Empty</span>;
    switch (fieldType) {
      case 'money':
        return (
          <span className="tabular-nums">
            ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        );
      case 'date':
        return new Date(value as string).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      case 'datetime':
        return new Date(value as string).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });
      case 'enum': {
        const opt = options?.find((o) => o.value === value);
        return (
          <Badge variant="secondary" className="text-2xs">
            {opt?.label ?? value}
          </Badge>
        );
      }
      case 'boolean':
        return (
          <div
            className={cn(
              'size-4 rounded-sm border transition-colors',
              value ? 'bg-primary border-primary' : 'border-border bg-background',
            )}
          >
            {value && <Icon icon={Check} size="sm" className="text-primary-foreground" />}
          </div>
        );
      case 'int':
        return <span className="tabular-nums">{Number(value).toLocaleString()}</span>;
      case 'decimal':
        return (
          <span className="tabular-nums">
            {Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        );
      case 'link':
        return <span className="text-primary">{String(value)}</span>;
      default:
        return String(value);
    }
  };

  const fieldIcon = icon ?? getFieldIcon(fieldType);

  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 px-3 rounded-md transition-all h-[36px]',
        !readOnly && !editing && 'hover:bg-accent/50 cursor-pointer',
        editing && 'bg-accent ring-1 ring-border',
      )}
      onClick={!editing ? handleClick : undefined}
    >
      <div className="flex items-center gap-2 w-[140px] shrink-0">
        <Icon icon={fieldIcon} size="sm" className="text-muted-foreground/70 shrink-0" />
        <span className="text-2xs text-muted-foreground truncate">{label}</span>
      </div>
      <div className="flex-1 min-w-0 relative">
        {editing ? (
          <FieldEditor
            fieldType={fieldType}
            value={editValue}
            options={options}
            onChange={setEditValue}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <span
            className={cn(
              'text-2xs block truncate font-medium',
              saving && 'opacity-50',
              readOnly && 'text-foreground/70',
            )}
          >
            {formatValue()}
          </span>
        )}
      </div>
      {!readOnly && !editing && fieldType !== 'boolean' && (
        <Icon
          icon={Pencil}
          size="sm"
          className="absolute right-2 opacity-0 group-hover:opacity-50 transition-opacity text-muted-foreground"
        />
      )}
    </div>
  );
}

// --- Field Editors by type ---

function FieldEditor({
  fieldType,
  value,
  options,
  onChange,
  onSave,
  onCancel,
}: {
  fieldType: FieldType;
  value: unknown;
  options?: { value: string; label: string }[];
  onChange: (v: unknown) => void;
  onSave: (v?: unknown) => void;
  onCancel: () => void;
}) {
  switch (fieldType) {
    case 'enum':
      return (
        <EnumEditor
          value={value as string}
          options={options ?? []}
          onSave={onSave}
          onCancel={onCancel}
        />
      );
    case 'date':
      return <DateEditor value={value as string | null} onSave={onSave} onCancel={onCancel} />;
    case 'datetime':
      return <DateTimeEditor value={value as string | null} onSave={onSave} onCancel={onCancel} />;
    case 'money':
      return <MoneyEditor value={value as number | null} onSave={onSave} onCancel={onCancel} />;
    case 'link':
      return (
        <LinkEditor
          value={value as string}
          options={options ?? []}
          onSave={onSave}
          onCancel={onCancel}
        />
      );
    case 'int':
    case 'decimal':
      return (
        <NumberEditor
          value={value}
          fieldType={fieldType}
          onChange={onChange}
          onSave={onSave}
          onCancel={onCancel}
        />
      );
    default:
      return <TextEditor value={value} onChange={onChange} onSave={onSave} onCancel={onCancel} />;
  }
}

function TextEditor({
  value,
  onChange,
  onSave,
  onCancel,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <Input
      ref={inputRef}
      type="text"
      value={value != null ? String(value) : ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onSave}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSave();
        if (e.key === 'Escape') onCancel();
      }}
      className="h-6 text-2xs border-0 shadow-none p-0 focus-visible:ring-0"
    />
  );
}

function NumberEditor({
  value,
  fieldType,
  onChange,
  onSave,
  onCancel,
}: {
  value: unknown;
  fieldType: 'int' | 'decimal';
  onChange: (v: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(null);
      return;
    }
    onChange(fieldType === 'int' ? parseInt(raw, 10) : parseFloat(raw));
  };

  return (
    <Input
      ref={inputRef}
      type="number"
      step={fieldType === 'decimal' ? '0.01' : '1'}
      value={value != null ? String(value) : ''}
      onChange={handleChange}
      onBlur={onSave}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSave();
        if (e.key === 'Escape') onCancel();
      }}
      className="h-6 text-2xs border-0 shadow-none p-0 focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [appearance:textfield]"
    />
  );
}

function MoneyEditor({
  value,
  onSave,
  onCancel,
}: {
  value: number | null;
  onSave: (v?: unknown) => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(value != null ? String(value) : '');
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSave = () => {
    const num = localValue === '' ? null : parseFloat(localValue);
    onSave(num);
  };

  return (
    <div className="flex items-center gap-1">
      <span className="text-2xs text-muted-foreground">$</span>
      <Input
        ref={inputRef}
        type="number"
        step="0.01"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') onCancel();
        }}
        className="h-6 text-2xs border-0 shadow-none p-0 focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [appearance:textfield]"
      />
    </div>
  );
}

function EnumEditor({
  value,
  options,
  onSave,
  onCancel,
}: {
  value: string;
  options: { value: string; label: string }[];
  onSave: (v?: unknown) => void;
  onCancel: () => void;
}) {
  const containerRef = useClickOutside<HTMLDivElement>(
    useCallback(() => onCancel(), [onCancel]),
    true,
  );

  return (
    <div ref={containerRef} className="absolute top-full left-0 mt-1 z-50">
      <div className="min-w-[180px] shadow-md border border-border rounded-md bg-popover py-1">
        {options.map((opt) => (
          <div
            key={opt.value}
            className={cn(
              'px-3 py-1.5 text-2xs cursor-pointer transition-colors hover:bg-accent',
              opt.value === value && 'bg-accent font-medium',
            )}
            onClick={() => onSave(opt.value)}
          >
            {opt.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function DateEditor({
  value,
  onSave,
  onCancel,
}: {
  value: string | null;
  onSave: (v?: unknown) => void;
  onCancel: () => void;
}) {
  const containerRef = useClickOutside<HTMLDivElement>(
    useCallback(() => onCancel(), [onCancel]),
    true,
  );

  const dateValue = value ? new Date(value) : undefined;
  const [viewMonth, setViewMonth] = useState(() => dateValue ?? new Date());

  const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const monthEnd = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
  const days: Date[] = [];
  for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  const startDayOfWeek = monthStart.getDay();

  const handleSelect = (day: Date) => {
    const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    onSave(iso);
  };

  const prevMonth = () =>
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  const nextMonth = () =>
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));

  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 mt-1 z-50 rounded-md border border-border bg-card p-3 shadow-md"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel();
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded-sm p-1 hover:bg-accent text-muted-foreground"
        >
          <Icon icon={ChevronLeft} size="sm" />
        </button>
        <span className="text-xs font-medium">{monthLabel}</span>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded-sm p-1 hover:bg-accent text-muted-foreground"
        >
          <Icon icon={ChevronRight} size="sm" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div
            key={d}
            className="flex h-7 w-7 items-center justify-center text-2xs text-muted-foreground"
          >
            {d}
          </div>
        ))}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`e-${i}`} className="h-7 w-7" />
        ))}
        {days.map((day) => {
          const isSelected = dateValue && day.toDateString() === dateValue.toDateString();
          const isToday = day.toDateString() === new Date().toDateString();
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => handleSelect(day)}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-sm text-2xs transition-colors hover:bg-accent',
                isSelected && 'bg-primary text-primary-foreground hover:bg-primary',
                isToday && !isSelected && 'border border-primary',
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DateTimeEditor({
  value,
  onSave,
  onCancel,
}: {
  value: string | null;
  onSave: (v?: unknown) => void;
  onCancel: () => void;
}) {
  const containerRef = useClickOutside<HTMLDivElement>(
    useCallback(() => onCancel(), [onCancel]),
    true,
  );

  const dateValue = value ? new Date(value) : undefined;
  const [viewMonth, setViewMonth] = useState(() => dateValue ?? new Date());
  const [time, setTime] = useState(() => {
    if (!dateValue) return '12:00';
    return `${String(dateValue.getHours()).padStart(2, '0')}:${String(dateValue.getMinutes()).padStart(2, '0')}`;
  });

  const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const monthEnd = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
  const days: Date[] = [];
  for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  const startDayOfWeek = monthStart.getDay();

  const handleSelect = (day: Date) => {
    const [hours, minutes] = time.split(':').map(Number);
    day.setHours(hours, minutes);
    onSave(day.toISOString());
  };

  const prevMonth = () =>
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  const nextMonth = () =>
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));

  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 mt-1 z-50 rounded-md border border-border bg-card p-3 shadow-md"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel();
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded-sm p-1 hover:bg-accent text-muted-foreground"
        >
          <Icon icon={ChevronLeft} size="sm" />
        </button>
        <span className="text-xs font-medium">{monthLabel}</span>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded-sm p-1 hover:bg-accent text-muted-foreground"
        >
          <Icon icon={ChevronRight} size="sm" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div
            key={d}
            className="flex h-7 w-7 items-center justify-center text-2xs text-muted-foreground"
          >
            {d}
          </div>
        ))}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`e-${i}`} className="h-7 w-7" />
        ))}
        {days.map((day) => {
          const isSelected = dateValue && day.toDateString() === dateValue.toDateString();
          const isToday = day.toDateString() === new Date().toDateString();
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => handleSelect(day)}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-sm text-2xs transition-colors hover:bg-accent',
                isSelected && 'bg-primary text-primary-foreground hover:bg-primary',
                isToday && !isSelected && 'border border-primary',
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
      <div className="mt-2 pt-2 border-t border-border flex items-center gap-2">
        <span className="text-2xs text-muted-foreground">Time</span>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="text-2xs bg-transparent border border-border rounded-sm px-2 py-0.5 outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
    </div>
  );
}

function LinkEditor({
  value,
  options,
  onSave,
  onCancel,
}: {
  value: string;
  options: { value: string; label: string }[];
  onSave: (v?: unknown) => void;
  onCancel: () => void;
}) {
  const [search, setSearch] = useState('');
  const containerRef = useClickOutside<HTMLDivElement>(
    useCallback(() => onCancel(), [onCancel]),
    true,
  );
  const allOptions =
    options.length > 0
      ? options
      : [
          { value: '1', label: 'John Smith' },
          { value: '2', label: 'Jane Doe' },
          { value: '3', label: 'Bob Wilson' },
        ];
  const filtered = allOptions.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={containerRef} className="absolute top-full left-0 mt-1 z-50">
      <div className="min-w-[220px] shadow-md border border-border rounded-md bg-popover">
        <div className="px-2 py-1.5 border-b border-border">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-accent/50">
            <Icon icon={Search} size="sm" className="text-muted-foreground shrink-0" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') onCancel();
              }}
              placeholder="Search..."
              className="flex-1 bg-transparent text-2xs outline-none placeholder:text-muted-foreground/50"
            />
          </div>
        </div>
        <div className="py-1 max-h-[200px] overflow-y-auto">
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-2xs text-muted-foreground">No results</div>
          )}
          {filtered.map((opt) => (
            <div
              key={opt.value}
              className={cn(
                'px-3 py-1.5 text-2xs cursor-pointer transition-colors hover:bg-accent',
                (opt.value === value || opt.label === value) && 'bg-accent font-medium',
              )}
              onClick={() => onSave(opt.label)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getFieldIcon(type: FieldType) {
  switch (type) {
    case 'int':
    case 'decimal':
      return Hash;
    case 'money':
      return DollarSign;
    case 'date':
    case 'datetime':
      return Calendar;
    case 'enum':
      return List;
    case 'boolean':
      return ToggleLeft;
    case 'link':
      return Link2;
    default:
      return Type;
  }
}

// --- Section component ---

function RecordSection({
  title,
  children,
  defaultCollapsed = false,
  columns = 1,
}: {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  columns?: 1 | 2;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="py-1">
      <button
        className="flex items-center gap-1.5 px-3 py-1.5 w-full text-left rounded-md hover:bg-accent/50 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <Icon
          icon={collapsed ? ChevronRight : ChevronDown}
          size="sm"
          className="text-muted-foreground/60"
        />
        <span className="text-xs font-semibold text-foreground/90 uppercase tracking-wide">
          {title}
        </span>
      </button>
      {!collapsed && (
        <div className={cn('mt-0.5', columns === 2 && 'grid grid-cols-2')}>{children}</div>
      )}
    </div>
  );
}

// --- Record Header ---

function RecordHeader({
  title,
  subtitle,
  badge,
  badgeVariant = 'default',
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive';
}) {
  return (
    <div className="flex items-start justify-between px-3 py-4 border-b border-border/50">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg font-semibold text-foreground tracking-tight">{title}</h1>
          {badge && (
            <Badge variant={badgeVariant} className="text-2xs">
              {badge}
            </Badge>
          )}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

// --- Stories ---

export const OrderRecord: Story = {
  name: 'Order Record (Full Page)',
  render: () => {
    const [values, setValues] = useState({
      name: 'ORD-00142',
      customer: 'Acme Corp',
      status: 'confirmed',
      priority: 'normal',
      total: 4675,
      subtotal: 4250,
      tax: 425,
      order_date: '2026-06-20',
      due_date: '2026-07-15',
      warehouse: 'Main Warehouse',
      currency: 'USD',
      notes: '',
      created_at: '2026-06-18T10:30:00Z',
      updated_at: '2026-06-20T14:22:00Z',
    });

    const handleSave = (field: string) => (value: unknown) => {
      setValues((prev) => ({ ...prev, [field]: value }));
    };

    return (
      <PageShell module="Sales" page="Orders">
        <RecordHeader title="Acme Corp" subtitle="ORD-00142" />

        <RecordSection title="General" columns={2}>
          <RecordField
            label="Customer"
            value={values.customer}
            fieldType="link"
            icon={Link2}
            onSave={handleSave('customer')}
          />
          <RecordField
            label="Status"
            value={values.status}
            fieldType="enum"
            options={[
              { value: 'draft', label: 'Draft' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'shipped', label: 'Shipped' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            onSave={handleSave('status')}
          />
          <RecordField
            label="Priority"
            value={values.priority}
            fieldType="enum"
            options={[
              { value: 'low', label: 'Low' },
              { value: 'normal', label: 'Normal' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' },
            ]}
            onSave={handleSave('priority')}
          />
          <RecordField
            label="Warehouse"
            value={values.warehouse}
            fieldType="string"
            onSave={handleSave('warehouse')}
          />
        </RecordSection>

        <RecordSection title="Financial" columns={2}>
          <RecordField label="Subtotal" value={values.subtotal} fieldType="money" readOnly />
          <RecordField label="Tax" value={values.tax} fieldType="money" readOnly />
          <RecordField label="Total" value={values.total} fieldType="money" readOnly />
          <RecordField
            label="Currency"
            value={values.currency}
            fieldType="string"
            onSave={handleSave('currency')}
          />
        </RecordSection>

        <RecordSection title="Schedule" columns={2}>
          <RecordField
            label="Order Date"
            value={values.order_date}
            fieldType="date"
            onSave={handleSave('order_date')}
          />
          <RecordField
            label="Due Date"
            value={values.due_date}
            fieldType="date"
            onSave={handleSave('due_date')}
          />
          <RecordField
            label="Notes"
            value={values.notes}
            fieldType="string"
            onSave={handleSave('notes')}
          />
        </RecordSection>

        <RecordSection title="System" defaultCollapsed columns={2}>
          <RecordField label="Created" value={values.created_at} fieldType="datetime" readOnly />
          <RecordField
            label="Last Updated"
            value={values.updated_at}
            fieldType="datetime"
            readOnly
          />
        </RecordSection>
      </PageShell>
    );
  },
};

export const EmployeeRecord: Story = {
  name: 'Employee Record (Full Page)',
  render: () => {
    const [values, setValues] = useState({
      name: 'Sarah Johnson',
      email: 'sarah@acme.com',
      phone: '+1 555-0142',
      department: 'engineering',
      position: 'VP Engineering',
      location: 'San Francisco, CA',
      start_date: '2024-01-15',
      salary: 185000,
      status: 'active',
      manager: 'John Smith',
      created_at: '2024-01-10T09:00:00Z',
      updated_at: '2026-06-28T16:45:00Z',
    });

    const handleSave = (field: string) => (value: unknown) => {
      setValues((prev) => ({ ...prev, [field]: value }));
    };

    return (
      <PageShell module="HR" page="Employees">
        <RecordHeader title="Sarah Johnson" />

        <RecordSection title="Contact" columns={2}>
          <RecordField
            label="Email"
            value={values.email}
            fieldType="string"
            onSave={handleSave('email')}
          />
          <RecordField
            label="Phone"
            value={values.phone}
            fieldType="string"
            onSave={handleSave('phone')}
          />
          <RecordField
            label="Location"
            value={values.location}
            fieldType="string"
            onSave={handleSave('location')}
          />
        </RecordSection>

        <RecordSection title="Role" columns={2}>
          <RecordField
            label="Department"
            value={values.department}
            fieldType="enum"
            options={[
              { value: 'engineering', label: 'Engineering' },
              { value: 'sales', label: 'Sales' },
              { value: 'marketing', label: 'Marketing' },
              { value: 'hr', label: 'Human Resources' },
              { value: 'finance', label: 'Finance' },
            ]}
            onSave={handleSave('department')}
          />
          <RecordField
            label="Position"
            value={values.position}
            fieldType="string"
            onSave={handleSave('position')}
          />
          <RecordField
            label="Manager"
            value={values.manager}
            fieldType="link"
            icon={Link2}
            onSave={handleSave('manager')}
          />
          <RecordField
            label="Status"
            value={values.status}
            fieldType="enum"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'on_leave', label: 'On Leave' },
              { value: 'terminated', label: 'Terminated' },
            ]}
            onSave={handleSave('status')}
          />
          <RecordField
            label="Start Date"
            value={values.start_date}
            fieldType="date"
            onSave={handleSave('start_date')}
          />
        </RecordSection>

        <RecordSection title="Compensation" columns={2}>
          <RecordField
            label="Annual Salary"
            value={values.salary}
            fieldType="money"
            onSave={handleSave('salary')}
          />
        </RecordSection>

        <RecordSection title="System" defaultCollapsed columns={2}>
          <RecordField label="Created" value={values.created_at} fieldType="datetime" readOnly />
          <RecordField
            label="Last Updated"
            value={values.updated_at}
            fieldType="datetime"
            readOnly
          />
        </RecordSection>
      </PageShell>
    );
  },
};

export const AllFieldTypes: Story = {
  name: 'All Field Types',
  render: () => {
    const [values, setValues] = useState({
      name: 'Acme Corp',
      description:
        'A technology company specializing in enterprise software solutions for mid-market businesses.',
      employee_count: 1200,
      rating: 4.85,
      revenue: 45000000,
      founded: '2015-03-12',
      last_contacted: '2026-06-28T14:30:00Z',
      industry: 'technology',
      is_active: true,
      owner_name: 'John Smith',
      related_name: 'INV-00234',
      metadata: { region: 'APAC', tier: 'enterprise', tags: ['saas', 'b2b'] },
      webhook_template: '{\n  "event": "{{event}}",\n  "data": {{payload}}\n}',
      account_number: 'ACC-00142',
      annual_contract: 250000,
      category: ['Technology', 'Software', 'Enterprise'],
      logo: { name: 'acme-logo.png', size: 24500, type: 'image/png' },
      documents: [
        { name: 'contract-2026.pdf', size: 1200000, type: 'application/pdf' },
        { name: 'nda-signed.pdf', size: 450000, type: 'application/pdf' },
      ],
      empty_string: '',
      empty_money: null,
      empty_date: null,
      empty_enum: null,
      tags: ['Enterprise', 'SaaS', 'B2B'],
      contacts_count: 5,
    });

    const handleSave = (field: string) => (value: unknown) => {
      setValues((prev) => ({ ...prev, [field]: value }));
    };

    return (
      <PageShell module="CRM" page="Accounts">
        <RecordHeader title="Acme Corp" subtitle="ACC-00142" />

        <RecordSection title="Core" columns={2}>
          <RecordField
            label="Name"
            value={values.name}
            fieldType="string"
            onSave={handleSave('name')}
          />
          <RecordField
            label="Employees"
            value={values.employee_count}
            fieldType="int"
            onSave={handleSave('employee_count')}
          />
          <RecordField
            label="Rating"
            value={values.rating}
            fieldType="decimal"
            onSave={handleSave('rating')}
          />
          <RecordField
            label="Active"
            value={values.is_active}
            fieldType="boolean"
            onSave={handleSave('is_active')}
          />
          <RecordField
            label="Industry"
            value={values.industry}
            fieldType="enum"
            options={[
              { value: 'technology', label: 'Technology' },
              { value: 'finance', label: 'Finance' },
              { value: 'healthcare', label: 'Healthcare' },
              { value: 'retail', label: 'Retail' },
              { value: 'manufacturing', label: 'Manufacturing' },
            ]}
            onSave={handleSave('industry')}
          />
          <RecordField
            label="Account Owner"
            value={values.owner_name}
            fieldType="link"
            icon={Link2}
            onSave={handleSave('owner_name')}
          />
        </RecordSection>

        <RecordSection title="Financial" columns={2}>
          <RecordField
            label="Annual Revenue"
            value={values.revenue}
            fieldType="money"
            onSave={handleSave('revenue')}
          />
          <RecordField
            label="Contract Value"
            value={values.annual_contract}
            fieldType="money"
            onSave={handleSave('annual_contract')}
          />
        </RecordSection>

        <RecordSection title="Dates" columns={2}>
          <RecordField
            label="Founded"
            value={values.founded}
            fieldType="date"
            onSave={handleSave('founded')}
          />
          <RecordField
            label="Last Contacted"
            value={values.last_contacted}
            fieldType="datetime"
            onSave={handleSave('last_contacted')}
          />
        </RecordSection>

        <RecordSection title="Relations" columns={2}>
          <RecordField
            label="Related Invoice"
            value={values.related_name}
            fieldType="link"
            icon={Link2}
            onSave={handleSave('related_name')}
          />
          <RecordField label="Tags" value={values.tags.join(', ')} fieldType="string" readOnly />
          <RecordField
            label="Contacts"
            value={`${values.contacts_count} records`}
            fieldType="string"
            readOnly
          />
          <RecordField
            label="Category"
            value={values.category.join(' › ')}
            fieldType="string"
            readOnly
          />
        </RecordSection>

        <RecordSection title="Content" columns={2}>
          <RecordField
            label="Description"
            value={values.description}
            fieldType="string"
            onSave={handleSave('description')}
          />
          <RecordField
            label="Metadata"
            value={JSON.stringify(values.metadata)}
            fieldType="string"
            readOnly
          />
        </RecordSection>

        <RecordSection title="Files" columns={2}>
          <RecordField label="Logo" value={values.logo.name} fieldType="string" readOnly />
          <RecordField
            label="Documents"
            value={`${values.documents.length} files`}
            fieldType="string"
            readOnly
          />
        </RecordSection>

        <RecordSection title="Empty States" columns={2}>
          <RecordField
            label="Website"
            value={values.empty_string}
            fieldType="string"
            onSave={handleSave('empty_string')}
          />
          <RecordField
            label="Budget"
            value={values.empty_money}
            fieldType="money"
            onSave={handleSave('empty_money')}
          />
          <RecordField
            label="Next Follow-up"
            value={values.empty_date}
            fieldType="date"
            onSave={handleSave('empty_date')}
          />
          <RecordField
            label="Stage"
            value={values.empty_enum}
            fieldType="enum"
            options={[
              { value: 'lead', label: 'Lead' },
              { value: 'prospect', label: 'Prospect' },
              { value: 'customer', label: 'Customer' },
            ]}
            onSave={handleSave('empty_enum')}
          />
        </RecordSection>
      </PageShell>
    );
  },
};

// --- Auto-CRUD with RecordField (what the generator would produce) ---

function AutoRecordField({
  field,
  value,
  onSave,
}: {
  field: {
    name: string;
    type: string;
    label?: string;
    required?: boolean;
    readOnly?: boolean;
    options?: string[];
    relationship?: { type: string; model?: string };
  };
  value: unknown;
  onSave?: (v: unknown) => void;
}) {
  const fieldType = mapFieldType(field.type, field.relationship?.type);
  const opts = field.options?.map((o) => ({ value: o, label: o }));
  const isReadOnly = !!field.readOnly || field.type === 'sequence';
  const icon = field.relationship?.type === 'link' ? Link2 : undefined;

  return (
    <RecordField
      label={field.label ?? field.name}
      value={value}
      fieldType={fieldType}
      options={opts}
      readOnly={isReadOnly}
      icon={icon}
      onSave={onSave}
    />
  );
}

function mapFieldType(type: string, relType?: string): FieldType {
  if (relType === 'link' || relType === 'dynamicLink') return 'link';
  switch (type) {
    case 'string':
    case 'text':
    case 'code':
    case 'json':
    case 'attachment':
    case 'attachments':
    case 'tree':
    case 'manyToMany':
    case 'hasMany':
    case 'children':
      return 'string';
    case 'int':
    case 'sequence':
      return 'int';
    case 'decimal':
      return 'decimal';
    case 'money':
      return 'money';
    case 'date':
      return 'date';
    case 'datetime':
      return 'datetime';
    case 'enum':
      return 'enum';
    case 'boolean':
      return 'boolean';
    case 'link':
    case 'dynamicLink':
      return 'link';
    default:
      return 'string';
  }
}

interface AutoModelMeta {
  name: string;
  label: string;
  naming?: string;
  fields: Array<{
    name: string;
    type: string;
    label?: string;
    required?: boolean;
    readOnly?: boolean;
    hidden?: boolean;
    options?: string[];
    relationship?: { type: string; model?: string };
  }>;
}

function AutoRecordView({
  model,
  data,
  onSave,
}: {
  model: AutoModelMeta;
  data: Record<string, unknown>;
  onSave: (field: string) => (v: unknown) => void;
}) {
  const systemFields = new Set(['created_at', 'updated_at', 'deleted_at']);
  const wideTypes = new Set([
    'text',
    'json',
    'code',
    'attachment',
    'attachments',
    'hasMany',
    'children',
    'manyToMany',
  ]);
  const skipTypes = new Set(['hasMany', 'children', 'manyToMany']);

  const basic: typeof model.fields = [];
  const details: typeof model.fields = [];
  const wide: typeof model.fields = [];
  const system: typeof model.fields = [];

  for (const f of model.fields) {
    if (f.name === 'id' || f.hidden) continue;
    if (skipTypes.has(f.type)) continue;
    if (systemFields.has(f.name)) {
      system.push(f);
      continue;
    }
    if (wideTypes.has(f.type)) {
      wide.push(f);
      continue;
    }
    if (f.name === model.naming || f.type === 'sequence' || f.required) {
      basic.push(f);
      continue;
    }
    details.push(f);
  }

  return (
    <>
      {basic.length > 0 && (
        <RecordSection title="General" columns={2}>
          {basic.map((f) => (
            <AutoRecordField
              key={f.name}
              field={f}
              value={data[f.name] ?? null}
              onSave={onSave(f.name)}
            />
          ))}
        </RecordSection>
      )}
      {details.length > 0 && (
        <RecordSection title="Details" columns={2}>
          {details.map((f) => (
            <AutoRecordField
              key={f.name}
              field={f}
              value={data[f.name] ?? null}
              onSave={onSave(f.name)}
            />
          ))}
        </RecordSection>
      )}
      {wide.length > 0 && (
        <RecordSection title="Additional" columns={2}>
          {wide.map((f) => (
            <AutoRecordField
              key={f.name}
              field={f}
              value={data[f.name] ?? null}
              onSave={onSave(f.name)}
            />
          ))}
        </RecordSection>
      )}
      {system.length > 0 && (
        <RecordSection title="System" defaultCollapsed columns={2}>
          {system.map((f) => (
            <AutoRecordField key={f.name} field={f} value={data[f.name] ?? null} />
          ))}
        </RecordSection>
      )}
    </>
  );
}

const customerModel: AutoModelMeta = {
  name: 'sales.customer',
  label: 'Customer',
  naming: 'name',
  fields: [
    { name: 'name', type: 'string', label: 'Customer Name', required: true },
    { name: 'email', type: 'string', label: 'Email', required: true },
    { name: 'phone', type: 'string', label: 'Phone' },
    { name: 'is_active', type: 'boolean', label: 'Active' },
    { name: 'credit_limit', type: 'decimal', label: 'Credit Limit' },
    {
      name: 'payment_terms',
      type: 'enum',
      label: 'Payment Terms',
      options: ['Net 15', 'Net 30', 'Net 60', 'COD'],
    },
    {
      name: 'category',
      type: 'link',
      label: 'Category',
      relationship: { type: 'link', model: 'sales.customer_category' },
    },
    { name: 'notes', type: 'text', label: 'Notes' },
    { name: 'created_at', type: 'datetime', label: 'Created', readOnly: true },
    { name: 'updated_at', type: 'datetime', label: 'Updated', readOnly: true },
  ],
};

const inventoryItemModel: AutoModelMeta = {
  name: 'inventory.item',
  label: 'Item',
  naming: 'name',
  fields: [
    { name: 'item_code', type: 'sequence', label: 'Item Code', readOnly: true },
    { name: 'name', type: 'string', label: 'Item Name', required: true },
    {
      name: 'category',
      type: 'link',
      label: 'Category',
      required: true,
      relationship: { type: 'link', model: 'inventory.category' },
    },
    {
      name: 'unit',
      type: 'enum',
      label: 'Unit',
      options: ['Piece', 'Kg', 'Litre', 'Metre', 'Box'],
    },
    { name: 'cost_price', type: 'money', label: 'Cost Price', required: true },
    { name: 'selling_price', type: 'money', label: 'Selling Price', required: true },
    { name: 'weight', type: 'decimal', label: 'Weight (kg)' },
    { name: 'barcode', type: 'string', label: 'Barcode' },
    { name: 'is_stockable', type: 'boolean', label: 'Stockable' },
    { name: 'reorder_point', type: 'int', label: 'Reorder Point' },
    { name: 'description', type: 'text', label: 'Description' },
    { name: 'created_at', type: 'datetime', label: 'Created', readOnly: true },
    { name: 'updated_at', type: 'datetime', label: 'Updated', readOnly: true },
  ],
};

export const AutoCrudCustomerRecord: Story = {
  name: 'Auto CRUD — Customer Record',
  render: () => {
    const [data, setData] = useState<Record<string, unknown>>({
      name: 'Acme Corporation',
      email: 'contact@acme.com',
      phone: '+1 555-0100',
      is_active: true,
      credit_limit: 50000,
      payment_terms: 'Net 30',
      category: 'Enterprise',
      notes: 'Major enterprise customer. Preferred partner since 2020.',
      created_at: '2024-01-15T09:30:00Z',
      updated_at: '2026-06-20T14:22:00Z',
    });

    const handleSave = (field: string) => (value: unknown) => {
      setData((prev) => ({ ...prev, [field]: value }));
    };

    return (
      <PageShell module="Sales" page="Customers">
        <RecordHeader title="Acme Corporation" />
        <AutoRecordView model={customerModel} data={data} onSave={handleSave} />
      </PageShell>
    );
  },
};

export const AutoCrudItemRecord: Story = {
  name: 'Auto CRUD — Item Record',
  render: () => {
    const [data, setData] = useState<Record<string, unknown>>({
      item_code: 'ITM-00142',
      name: 'MacBook Pro 16"',
      category: 'Laptops',
      unit: 'Piece',
      cost_price: 1850,
      selling_price: 2499,
      weight: 2.14,
      barcode: '0195949185694',
      is_stockable: true,
      reorder_point: 20,
      description:
        'The most powerful MacBook Pro ever. M3 Max chip, 16-core CPU, 40-core GPU, 128GB unified memory.',
      created_at: '2025-03-10T11:00:00Z',
      updated_at: '2026-06-25T16:45:00Z',
    });

    const handleSave = (field: string) => (value: unknown) => {
      setData((prev) => ({ ...prev, [field]: value }));
    };

    return (
      <PageShell module="Inventory" page="Items">
        <RecordHeader title='MacBook Pro 16"' subtitle="ITM-00142" />
        <AutoRecordView model={inventoryItemModel} data={data} onSave={handleSave} />
      </PageShell>
    );
  },
};

export const DrawerPeek: Story = {
  name: 'Record in Drawer',
  render: () => {
    const [values] = useState({
      name: 'Acme Corp',
      domain: 'acme.com',
      industry: 'technology',
      employees: 1200,
      revenue: 45000000,
      owner: 'John Smith',
      created_at: '2025-03-12T08:00:00Z',
    });

    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 bg-foreground/3" />
        <div className="w-[420px] border-l border-border bg-card flex flex-col shadow-lg">
          <div className="flex items-center justify-between px-4 py-4 border-b border-border">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Acme Corp</h3>
                <Badge variant="secondary" className="text-2xs">
                  Technology
                </Badge>
              </div>
              <p className="text-2xs text-muted-foreground">Created Mar 12, 2025</p>
            </div>
            <button className="size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            <RecordSection title="General">
              <RecordField label="Company" value={values.name} fieldType="string" />
              <RecordField label="Domain" value={values.domain} fieldType="link" icon={Link2} />
              <RecordField
                label="Industry"
                value={values.industry}
                fieldType="enum"
                options={[
                  { value: 'technology', label: 'Technology' },
                  { value: 'finance', label: 'Finance' },
                  { value: 'healthcare', label: 'Healthcare' },
                  { value: 'retail', label: 'Retail' },
                ]}
              />
            </RecordSection>

            <RecordSection title="Business">
              <RecordField label="Employees" value={values.employees} fieldType="int" />
              <RecordField label="Revenue" value={values.revenue} fieldType="money" />
              <RecordField label="Owner" value={values.owner} fieldType="link" icon={Link2} />
            </RecordSection>

            <RecordSection title="System" defaultCollapsed>
              <RecordField
                label="Created"
                value={values.created_at}
                fieldType="datetime"
                readOnly
              />
            </RecordSection>
          </div>
          <div className="px-4 py-3 border-t border-border flex items-center justify-end">
            <button className="inline-flex items-center gap-1.5 text-2xs font-medium text-primary hover:text-primary/80 transition-colors">
              <span>Open full record</span>
              <Icon icon={ExternalLink} size="sm" />
            </button>
          </div>
        </div>
      </div>
    );
  },
};
