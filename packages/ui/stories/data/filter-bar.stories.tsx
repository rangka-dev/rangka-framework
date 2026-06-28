import type { Meta, StoryObj } from '@storybook/react';
import { useState, useRef, useEffect } from 'react';
import { FilterBar } from '../../src/data/filter-bar';

const meta: Meta = {
  title: 'Data/FilterBar',
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

const fields = [
  { field: 'customer', label: 'Customer', type: 'string' },
  { field: 'status', label: 'Status', type: 'enum' },
  { field: 'total', label: 'Total', type: 'decimal' },
  { field: 'date', label: 'Date', type: 'date' },
  { field: 'paid', label: 'Paid', type: 'boolean' },
];

const STRING_OPERATORS = [
  { value: 'like', label: 'Contains', needsValue: true },
  { value: 'eq', label: 'Equals', needsValue: true },
  { value: 'neq', label: 'Not equals', needsValue: true },
  { value: 'empty', label: 'Empty', needsValue: false },
  { value: 'not_empty', label: 'Not empty', needsValue: false },
];

const NUMERIC_OPERATORS = [
  { value: 'eq', label: 'Equals', needsValue: true },
  { value: 'neq', label: 'Not equals', needsValue: true },
  { value: 'gt', label: 'Greater than', needsValue: true },
  { value: 'gte', label: 'Greater or equal', needsValue: true },
  { value: 'lt', label: 'Less than', needsValue: true },
  { value: 'lte', label: 'Less or equal', needsValue: true },
];

const DATE_OPERATORS = [
  { value: 'eq', label: 'Equals', needsValue: true },
  { value: 'gt', label: 'After', needsValue: true },
  { value: 'lt', label: 'Before', needsValue: true },
];

const BOOLEAN_OPERATORS = [
  { value: 'eq', label: 'Is true', needsValue: false },
  { value: 'neq', label: 'Is false', needsValue: false },
];

function getOperators(type: string) {
  switch (type) {
    case 'decimal':
    case 'int':
    case 'money':
      return NUMERIC_OPERATORS;
    case 'date':
    case 'datetime':
      return DATE_OPERATORS;
    case 'boolean':
      return BOOLEAN_OPERATORS;
    default:
      return STRING_OPERATORS;
  }
}

function getSymbol(op: string) {
  switch (op) {
    case 'eq':
      return '=';
    case 'neq':
      return '≠';
    case 'gt':
      return '>';
    case 'gte':
      return '≥';
    case 'lt':
      return '<';
    case 'lte':
      return '≤';
    case 'like':
      return '≈';
    case 'empty':
      return 'is empty';
    case 'not_empty':
      return 'is not empty';
    default:
      return '=';
  }
}

interface ActiveFilter {
  field: string;
  label: string;
  operator: string;
  value: string;
}

export const Collapsed: Story = {
  name: 'Collapsed (Trigger Only)',
  render: () => (
    <div className="flex h-11 items-center gap-2 border-b border-border-subtle px-5">
      <span className="text-2xs text-foreground/50">Sales / Orders</span>
      <div className="ml-auto flex items-center gap-2">
        <FilterBar.Trigger count={0} />
      </div>
    </div>
  ),
};

export const WithActiveCount: Story = {
  name: 'Trigger with Count',
  render: () => (
    <div className="flex h-11 items-center gap-2 border-b border-border-subtle px-5">
      <span className="text-2xs text-foreground/50">Sales / Orders</span>
      <div className="ml-auto flex items-center gap-2">
        <FilterBar.Trigger count={3} active />
      </div>
    </div>
  ),
};

export const ExpandedWithFilters: Story = {
  name: 'Expanded with Filters',
  render: () => (
    <FilterBar>
      <div className="flex h-11 items-center gap-2 border-b border-border-subtle px-5">
        <span className="text-2xs text-foreground/50">Sales / Orders</span>
        <div className="ml-auto flex items-center gap-2">
          <FilterBar.Trigger count={2} active />
        </div>
      </div>
      <FilterBar.Content>
        <FilterBar.Badge label="Customer" operator={'≈'} value="Acme" onRemove={() => {}} />
        <FilterBar.Badge label="Total" operator={'≥'} value="1000" onRemove={() => {}} />
        <FilterBar.AddButton />
      </FilterBar.Content>
    </FilterBar>
  ),
};

export const FieldSelection: Story = {
  name: 'Popover — Field Selection',
  render: function FieldSelectDemo() {
    const [search, setSearch] = useState('');
    const filtered = fields.filter((f) => f.label.toLowerCase().includes(search.toLowerCase()));

    return (
      <div className="relative w-56">
        <FilterBar.Popover open>
          <FilterBar.FieldList search={search} onSearchChange={setSearch}>
            {filtered.map((f) => (
              <FilterBar.FieldItem key={f.field}>{f.label}</FilterBar.FieldItem>
            ))}
            {filtered.length === 0 && (
              <p className="px-2.5 py-1.5 text-2xs text-foreground/50">No fields found</p>
            )}
          </FilterBar.FieldList>
        </FilterBar.Popover>
      </div>
    );
  },
};

export const OperatorValueStep: Story = {
  name: 'Popover — Operator & Value',
  render: function OperatorDemo() {
    const [operator, setOperator] = useState('like');
    const [value, setValue] = useState('');
    const ops = STRING_OPERATORS;
    const currentOp = ops.find((o) => o.value === operator);

    return (
      <div className="relative w-56">
        <FilterBar.Popover open>
          <FilterBar.OperatorForm
            fieldLabel="Customer"
            operators={ops}
            operator={operator}
            onOperatorChange={setOperator}
            value={value}
            onValueChange={setValue}
            needsValue={currentOp?.needsValue}
            onApply={() => {}}
            onBack={() => {}}
          />
        </FilterBar.Popover>
      </div>
    );
  },
};

export const Interactive: Story = {
  name: 'Full Interactive',
  render: function InteractiveDemo() {
    const [open, setOpen] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [filters, setFilters] = useState<ActiveFilter[]>([
      { field: 'customer', label: 'Customer', operator: 'like', value: 'Acme' },
    ]);
    const [step, setStep] = useState<'fields' | 'operator'>('fields');
    const [selectedField, setSelectedField] = useState<(typeof fields)[0] | null>(null);
    const [operator, setOperator] = useState('');
    const [value, setValue] = useState('');
    const [search, setSearch] = useState('');
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (filters.length > 0) setOpen(true);
    }, [filters.length]);

    const handleFieldSelect = (f: (typeof fields)[0]) => {
      setSelectedField(f);
      const ops = getOperators(f.type);
      setOperator(ops[0].value);
      setValue('');
      setStep('operator');
    };

    const handleApply = () => {
      if (!selectedField) return;
      setFilters((prev) => [
        ...prev,
        { field: selectedField.field, label: selectedField.label, operator, value },
      ]);
      setPopoverOpen(false);
      setStep('fields');
      setSelectedField(null);
      setSearch('');
    };

    const handleBack = () => {
      setStep('fields');
      setSelectedField(null);
    };

    const handleRemove = (field: string) => {
      const next = filters.filter((f) => f.field !== field);
      setFilters(next);
      if (next.length === 0) setOpen(false);
    };

    const handleToggle = () => {
      if (!open && filters.length === 0) {
        setOpen(true);
        setPopoverOpen(true);
      } else {
        setOpen(!open);
      }
    };

    const handleAddClick = () => {
      setPopoverOpen(true);
      setStep('fields');
      setSelectedField(null);
      setSearch('');
    };

    const filteredFields = fields.filter((f) =>
      f.label.toLowerCase().includes(search.toLowerCase()),
    );

    const currentOps = selectedField ? getOperators(selectedField.type) : [];
    const currentOp = currentOps.find((o) => o.value === operator);

    return (
      <FilterBar>
        <div className="flex h-11 items-center gap-2 border-b border-border-subtle px-5">
          <span className="text-2xs text-foreground/50">Sales / Orders</span>
          <div className="ml-auto flex items-center gap-2">
            <FilterBar.Trigger count={filters.length} active={open} onToggle={handleToggle} />
          </div>
        </div>
        {open && (
          <FilterBar.Content>
            {filters.map((f) => (
              <FilterBar.Badge
                key={f.field}
                label={f.label}
                operator={getSymbol(f.operator)}
                value={f.value}
                onRemove={() => handleRemove(f.field)}
              />
            ))}
            <div className="relative" ref={popoverRef}>
              <FilterBar.AddButton onClick={handleAddClick} />
              <FilterBar.Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                {step === 'fields' ? (
                  <FilterBar.FieldList search={search} onSearchChange={setSearch}>
                    {filteredFields.map((f) => (
                      <FilterBar.FieldItem key={f.field} onClick={() => handleFieldSelect(f)}>
                        {f.label}
                      </FilterBar.FieldItem>
                    ))}
                    {filteredFields.length === 0 && (
                      <p className="px-2.5 py-1.5 text-2xs text-foreground/50">No fields found</p>
                    )}
                  </FilterBar.FieldList>
                ) : (
                  <FilterBar.OperatorForm
                    fieldLabel={selectedField?.label ?? ''}
                    operators={currentOps}
                    operator={operator}
                    onOperatorChange={setOperator}
                    value={value}
                    onValueChange={setValue}
                    needsValue={currentOp?.needsValue}
                    onApply={handleApply}
                    onBack={handleBack}
                  />
                )}
              </FilterBar.Popover>
            </div>
          </FilterBar.Content>
        )}
      </FilterBar>
    );
  },
};
