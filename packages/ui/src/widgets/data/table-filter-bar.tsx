import { useState, useCallback } from 'react';
import { FilterBar } from '../../data/filter-bar';
import { getOperatorsForType, operatorSymbol } from '../../data/filter-operators';

export interface FilterFieldDeclaration {
  field: string;
  type: string;
  label: string;
  options?: string[];
}

export interface ActiveFilter {
  field: string;
  operator: string;
  value: unknown;
}

export interface TableFilterBarProps {
  fields: FilterFieldDeclaration[];
  activeFilters: ActiveFilter[];
  onSetFilter: (field: string, operator: string, value: unknown) => void;
  onRemoveFilter: (field: string, operator: string) => void;
}

export function TableFilterBar({
  fields,
  activeFilters,
  onSetFilter,
  onRemoveFilter,
}: TableFilterBarProps) {
  const [open, setOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [step, setStep] = useState<'fields' | 'operator'>('fields');
  const [selectedField, setSelectedField] = useState<FilterFieldDeclaration | null>(null);
  const [operator, setOperator] = useState('');
  const [value, setValue] = useState('');
  const [search, setSearch] = useState('');

  const handleToggle = () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && activeFilters.length === 0) {
      setPopoverOpen(true);
    }
  };

  const resetPopover = useCallback(() => {
    setStep('fields');
    setSelectedField(null);
    setOperator('');
    setValue('');
    setSearch('');
    setPopoverOpen(false);
  }, []);

  const handleFieldSelect = (field: FilterFieldDeclaration) => {
    setSelectedField(field);
    const ops = getOperatorsForType(field.type);
    setOperator(ops[0]?.value ?? 'eq');
    setStep('operator');
  };

  const handleApply = () => {
    if (!selectedField) return;
    const ops = getOperatorsForType(selectedField.type);
    const op = ops.find((o) => o.value === operator);
    const filterValue = op?.needsValue === false ? (operator === 'eq' ? true : false) : value;
    onSetFilter(selectedField.field, operator, filterValue);
    resetPopover();
  };

  const filteredFields = fields.filter(
    (f) => !search || f.label.toLowerCase().includes(search.toLowerCase()),
  );

  const getFieldLabel = (field: string) => fields.find((f) => f.field === field)?.label ?? field;

  if (fields.length === 0) return null;

  return (
    <FilterBar>
      <div className="flex justify-end px-4 py-2">
        <FilterBar.Trigger count={activeFilters.length} active={open} onToggle={handleToggle} />
      </div>
      {(activeFilters.length > 0 || open) && (
        <FilterBar.Content className="border-t-0">
          {activeFilters.map((f) => (
            <FilterBar.Badge
              key={`${f.field}__${f.operator}`}
              label={getFieldLabel(f.field)}
              operator={operatorSymbol(f.operator)}
              value={f.value != null ? String(f.value) : undefined}
              onRemove={() => onRemoveFilter(f.field, f.operator)}
            />
          ))}
          <div className="relative">
            <FilterBar.AddButton onClick={() => setPopoverOpen(!popoverOpen)} />
            <FilterBar.Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              {step === 'fields' ? (
                <FilterBar.FieldList
                  search={search}
                  onSearchChange={setSearch}
                  placeholder="Search fields..."
                >
                  {filteredFields.map((f) => (
                    <FilterBar.FieldItem key={f.field} onClick={() => handleFieldSelect(f)}>
                      {f.label}
                    </FilterBar.FieldItem>
                  ))}
                </FilterBar.FieldList>
              ) : selectedField ? (
                <FilterBar.OperatorForm
                  fieldLabel={selectedField.label}
                  operators={getOperatorsForType(selectedField.type)}
                  operator={operator}
                  onOperatorChange={setOperator}
                  value={value}
                  onValueChange={setValue}
                  needsValue={
                    getOperatorsForType(selectedField.type).find((o) => o.value === operator)
                      ?.needsValue ?? true
                  }
                  onApply={handleApply}
                  onBack={() => setStep('fields')}
                />
              ) : null}
            </FilterBar.Popover>
          </div>
        </FilterBar.Content>
      )}
    </FilterBar>
  );
}

TableFilterBar.displayName = 'TableFilterBar';
