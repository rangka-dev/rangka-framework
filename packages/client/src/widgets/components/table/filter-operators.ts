import type { WidgetNode } from '@rangka/shared';

export interface OperatorOption {
  value: string;
  label: string;
  needsValue: boolean;
}

export const STRING_OPERATORS: OperatorOption[] = [
  { value: 'like', label: 'Contains', needsValue: true },
  { value: 'eq', label: 'Equals', needsValue: true },
  { value: 'neq', label: 'Not equals', needsValue: true },
  { value: 'empty', label: 'Empty', needsValue: false },
  { value: 'not_empty', label: 'Not empty', needsValue: false },
];

export const NUMERIC_OPERATORS: OperatorOption[] = [
  { value: 'eq', label: 'Equals', needsValue: true },
  { value: 'neq', label: 'Not equals', needsValue: true },
  { value: 'gt', label: 'Greater than', needsValue: true },
  { value: 'gte', label: 'Greater or equal', needsValue: true },
  { value: 'lt', label: 'Less than', needsValue: true },
  { value: 'lte', label: 'Less or equal', needsValue: true },
  { value: 'empty', label: 'Empty', needsValue: false },
  { value: 'not_empty', label: 'Not empty', needsValue: false },
];

export const DATE_OPERATORS: OperatorOption[] = [
  { value: 'eq', label: 'Equals', needsValue: true },
  { value: 'gt', label: 'After', needsValue: true },
  { value: 'gte', label: 'On or after', needsValue: true },
  { value: 'lt', label: 'Before', needsValue: true },
  { value: 'lte', label: 'On or before', needsValue: true },
  { value: 'empty', label: 'Empty', needsValue: false },
  { value: 'not_empty', label: 'Not empty', needsValue: false },
];

export const BOOLEAN_OPERATORS: OperatorOption[] = [
  { value: 'eq', label: 'Is true', needsValue: false },
  { value: 'neq', label: 'Is false', needsValue: false },
];

export const ENUM_OPERATORS: OperatorOption[] = [
  { value: 'eq', label: 'Equals', needsValue: true },
  { value: 'neq', label: 'Not equals', needsValue: true },
];

export function getOperatorsForType(fieldType: string): OperatorOption[] {
  switch (fieldType) {
    case 'string':
    case 'text':
      return STRING_OPERATORS;
    case 'int':
    case 'decimal':
    case 'money':
      return NUMERIC_OPERATORS;
    case 'date':
    case 'datetime':
      return DATE_OPERATORS;
    case 'boolean':
      return BOOLEAN_OPERATORS;
    case 'enum':
      return ENUM_OPERATORS;
    default:
      return STRING_OPERATORS;
  }
}

export function getDefaultOperator(fieldType: string): string {
  if (fieldType === 'string' || fieldType === 'text') return 'like';
  return 'eq';
}

export function getOperatorSymbol(operator: string): string {
  switch (operator) {
    case 'eq':
      return '=';
    case 'neq':
      return '\u2260';
    case 'gt':
      return '>';
    case 'gte':
      return '\u2265';
    case 'lt':
      return '<';
    case 'lte':
      return '\u2264';
    case 'like':
      return '\u2248';
    case 'empty':
      return 'is empty';
    case 'not_empty':
      return 'is not empty';
    default:
      return '=';
  }
}

export function getActiveFilters(
  store: { get(key: string): unknown; keys(): Iterable<string> },
  model: string,
  columns: WidgetNode[],
): { key: string; field: string; operator: string; label: string; displayValue: string }[] {
  const prefix = `$filter.${model}.`;
  const results: {
    key: string;
    field: string;
    operator: string;
    label: string;
    displayValue: string;
  }[] = [];
  for (const key of store.keys()) {
    if (!key.startsWith(prefix)) continue;
    const value = store.get(key);
    if (value === null || value === undefined) continue;
    const fieldPart = key.slice(prefix.length);
    let operator = 'eq';
    let field = fieldPart;
    const suffixMatch = fieldPart.match(/__(\w+)$/);
    if (suffixMatch) {
      operator = suffixMatch[1];
      field = fieldPart.slice(0, -suffixMatch[0].length);
    }
    const label = getLabelForField(columns, field);
    const displayValue = operator === 'empty' || operator === 'not_empty' ? '' : String(value);
    results.push({ key, field, operator, label, displayValue });
  }
  return results;
}

export function getLabelForField(columns: WidgetNode[], field: string): string {
  const col = columns.find((c) => c.bind?.field === field);
  return String(col?.props?.label ?? field);
}
