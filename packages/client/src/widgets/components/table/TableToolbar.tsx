import React, { useState, useCallback, useMemo } from 'react';
import {
  FilterIcon,
  XIcon,
  SearchIcon,
} from 'lucide-react';
import type { WidgetNode } from '@rangka/shared';
import { Badge } from '../../../components/ui/badge.js';
import { Button } from '../../../components/ui/button.js';
import { Input } from '../../../components/ui/input.js';
import { Popover, PopoverTrigger, PopoverContent } from '../../../components/ui/popover.js';
import { useModelMeta } from '../../../data/useModelMeta.js';
import {
  getOperatorsForType,
  getDefaultOperator,
  getOperatorSymbol,
  getActiveFilters,
  getLabelForField,
} from './filter-operators.js';

interface PageStore {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  keys(): Iterable<string>;
}

interface TableToolbarProps {
  model: string;
  store: PageStore;
  columns: WidgetNode[];
  hasSearch: boolean;
  hasFilters: boolean;
}

export function TableToolbar({ model, store, columns, hasSearch, hasFilters }: TableToolbarProps) {
  const [searchInput, setSearchInput] = useState(() => {
    const val = store.get(`$search.${model}`);
    return val ? String(val) : '';
  });
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        store.set(`$search.${model}`, value || null);
        store.set(`$page.${model}`, 1);
      }, 300);
    },
    [model, store],
  );

  const activeFilters = getActiveFilters(store, model, columns);

  return (
    <div className="flex flex-col border-b border-border/50">
      <div className="flex items-center gap-2 px-5 py-2">
        {hasSearch && (
          <div className="flex flex-1 items-center gap-2">
            <SearchIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search..."
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
            {searchInput && (
              <button
                className="rounded-sm p-0.5 hover:bg-muted"
                onClick={() => handleSearchChange('')}
                aria-label="Clear search"
              >
                <XIcon className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
        )}
        {hasFilters && <TableFilterPopover columns={columns} model={model} store={store} />}
      </div>
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-5 pb-2">
          {activeFilters.map((f) => (
            <Badge key={f.key} variant="secondary" className="gap-1 pr-1">
              <span className="text-xs">
                {f.label} {getOperatorSymbol(f.operator)} {f.displayValue}
              </span>
              <button
                className="ml-1 rounded-sm p-0.5 hover:bg-muted"
                onClick={() => {
                  store.set(f.key, null);
                  store.set(`$page.${model}`, 1);
                }}
                aria-label={`Remove ${f.label} filter`}
              >
                <XIcon className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Filter Popover ---

interface FilterPopoverProps {
  columns: WidgetNode[];
  model: string;
  store: PageStore;
}

function TableFilterPopover({ columns, model, store }: FilterPopoverProps) {
  const [adding, setAdding] = useState(false);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [filterValue, setFilterValue] = useState('');
  const [search, setSearch] = useState('');

  const { modelMeta } = useModelMeta(model);

  const getFieldType = useCallback(
    (field: string): string => {
      const meta = modelMeta?.fields.find((f) => f.name === field);
      return meta?.type ?? 'string';
    },
    [modelMeta],
  );

  const filteredColumns = useMemo(() => {
    if (!search) return columns.filter((col) => col.bind?.field);
    const q = search.toLowerCase();
    return columns.filter((col) => {
      if (!col.bind?.field) return false;
      const label = String(col.props?.label ?? col.bind.field).toLowerCase();
      return label.includes(q);
    });
  }, [columns, search]);

  const handleFieldSelect = (field: string) => {
    setSelectedField(field);
    setSelectedOperator(getDefaultOperator(getFieldType(field)));
    setFilterValue('');
    setSearch('');
  };

  const handleApply = () => {
    if (!selectedField) return;
    const operators = getOperatorsForType(getFieldType(selectedField));
    const op = operators.find((o) => o.value === selectedOperator);
    if (!op) return;
    if (op.needsValue && !filterValue) return;

    const suffix = selectedOperator === 'eq' ? '' : `__${selectedOperator}`;
    const key = `$filter.${model}.${selectedField}${suffix}`;

    let value: unknown = filterValue;
    if (selectedOperator === 'empty') value = 'true';
    else if (selectedOperator === 'not_empty') value = 'true';
    else if (selectedOperator === 'eq' && getFieldType(selectedField) === 'boolean') value = 'true';
    else if (selectedOperator === 'neq' && getFieldType(selectedField) === 'boolean')
      value = 'false';

    store.set(key, value);
    store.set(`$page.${model}`, 1);
    setAdding(false);
    setSelectedField(null);
    setSelectedOperator('');
    setFilterValue('');
  };

  const handleBack = () => {
    setSelectedField(null);
    setSelectedOperator('');
    setFilterValue('');
  };

  const handleOpenChange = (open: boolean) => {
    setAdding(open);
    if (!open) {
      setSelectedField(null);
      setSelectedOperator('');
      setFilterValue('');
      setSearch('');
    }
  };

  const currentOperators = selectedField ? getOperatorsForType(getFieldType(selectedField)) : [];
  const currentOp = currentOperators.find((o) => o.value === selectedOperator);

  return (
    <Popover open={adding} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs shrink-0">
          <FilterIcon className="h-3.5 w-3.5" />
          Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="end">
        {!selectedField ? (
          <div className="flex flex-col">
            <div className="flex items-center gap-2 border-b border-border/50 px-2.5 py-2">
              <SearchIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search fields..."
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
            <div className="flex flex-col py-1 max-h-48 overflow-auto">
              {filteredColumns.map((col) => {
                const field = col.bind?.field;
                if (!field) return null;
                return (
                  <button
                    key={field}
                    className="px-2.5 py-1.5 text-left text-xs hover:bg-muted transition-colors"
                    onClick={() => handleFieldSelect(field)}
                  >
                    {String(col.props?.label ?? field)}
                  </button>
                );
              })}
              {filteredColumns.length === 0 && (
                <p className="px-2.5 py-1.5 text-xs text-muted-foreground">No fields found</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="px-2.5 pt-2.5 pb-2">
              <p className="text-xs font-semibold">{getLabelForField(columns, selectedField)}</p>
            </div>
            <div className="flex flex-col gap-2 px-2.5 pb-2.5">
              <select
                value={selectedOperator}
                onChange={(e) => {
                  setSelectedOperator(e.target.value);
                  setFilterValue('');
                }}
                className="h-7 w-full rounded-none border border-border bg-transparent px-2 text-xs outline-none focus:border-ring"
              >
                {currentOperators.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
              {currentOp?.needsValue && (
                <Input
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  placeholder="Value..."
                  className="h-7 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApply();
                  }}
                  autoFocus
                />
              )}
            </div>
            <div className="flex items-center justify-between border-t border-border/50 px-2.5 py-2">
              <Button variant="ghost" size="xs" onClick={handleBack}>
                Back
              </Button>
              <Button
                variant="default"
                size="xs"
                onClick={handleApply}
                disabled={currentOp?.needsValue ? !filterValue : false}
              >
                Apply
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
