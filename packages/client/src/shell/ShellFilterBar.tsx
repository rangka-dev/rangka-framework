import { useMemo, useState } from 'react';
import { FilterBar, getOperatorsForType, operatorSymbol } from '@rangka/ui';
import type { FilterFieldDeclaration } from './extractFilterFields.js';

interface ParsedFilter {
  field: string;
  operator: string;
  value: unknown;
}

interface ShellFilterBarProps {
  fields: FilterFieldDeclaration[];
  activeFilters: ParsedFilter[];
  onSetFilter: (field: string, operator: string, value: unknown) => void;
  onRemoveFilter: (field: string, operator: string) => void;
}

export function ShellFilterBar({
  fields,
  activeFilters,
  onSetFilter,
  onRemoveFilter,
}: ShellFilterBarProps) {
  const [popoverOpen, setPopoverOpen] = useState(activeFilters.length === 0);
  const [step, setStep] = useState<'fields' | 'operator'>('fields');
  const [selectedField, setSelectedField] = useState<FilterFieldDeclaration | null>(null);
  const [operator, setOperator] = useState('');
  const [value, setValue] = useState('');
  const [search, setSearch] = useState('');

  const handleFieldSelect = (f: FilterFieldDeclaration) => {
    setSelectedField(f);
    const ops = getOperatorsForType(f.type);
    setOperator(ops[0]?.value ?? 'eq');
    setValue('');
    setStep('operator');
  };

  const handleApply = () => {
    if (!selectedField) return;
    const ops = getOperatorsForType(selectedField.type);
    const currentOp = ops.find((o) => o.value === operator);
    const filterValue = currentOp?.needsValue ? value : true;
    onSetFilter(selectedField.field, operator, filterValue);
    setPopoverOpen(false);
    setStep('fields');
    setSelectedField(null);
    setSearch('');
  };

  const handleAddClick = () => {
    setPopoverOpen(true);
    setStep('fields');
    setSelectedField(null);
    setSearch('');
  };

  const filteredFields = useMemo(
    () => fields.filter((f) => f.label.toLowerCase().includes(search.toLowerCase())),
    [fields, search],
  );

  const currentOps = selectedField ? getOperatorsForType(selectedField.type) : [];
  const currentOp = currentOps.find((o) => o.value === operator);

  const getFieldLabel = (field: string) => {
    return fields.find((f) => f.field === field)?.label ?? field;
  };

  return (
    <FilterBar>
      <FilterBar.Content>
        {activeFilters.map((f) => (
          <FilterBar.Badge
            key={`${f.field}__${f.operator}`}
            label={getFieldLabel(f.field)}
            operator={operatorSymbol(f.operator)}
            value={f.value != null && f.value !== true ? String(f.value) : undefined}
            onRemove={() => onRemoveFilter(f.field, f.operator)}
          />
        ))}
        <div className="relative">
          <FilterBar.AddButton onClick={handleAddClick} />
          <FilterBar.Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            {step === 'fields' ? (
              <FilterBar.FieldList search={search} onSearchChange={setSearch}>
                {filteredFields.map((f) => (
                  <FilterBar.FieldItem key={f.field} onClick={() => handleFieldSelect(f)}>
                    {f.label}
                  </FilterBar.FieldItem>
                ))}
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
                onBack={() => {
                  setStep('fields');
                  setSelectedField(null);
                }}
              />
            )}
          </FilterBar.Popover>
        </div>
      </FilterBar.Content>
    </FilterBar>
  );
}
