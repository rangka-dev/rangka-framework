import type { OperatorOption } from './filter-bar';

const STRING_OPERATORS: OperatorOption[] = [
  { value: 'like', label: 'Contains', needsValue: true },
  { value: 'eq', label: 'Equals', needsValue: true },
  { value: 'neq', label: 'Not equals', needsValue: true },
  { value: 'empty', label: 'Empty', needsValue: false },
  { value: 'not_empty', label: 'Not empty', needsValue: false },
];

const NUMERIC_OPERATORS: OperatorOption[] = [
  { value: 'eq', label: 'Equals', needsValue: true },
  { value: 'neq', label: 'Not equals', needsValue: true },
  { value: 'gt', label: 'Greater than', needsValue: true },
  { value: 'gte', label: 'Greater or equal', needsValue: true },
  { value: 'lt', label: 'Less than', needsValue: true },
  { value: 'lte', label: 'Less or equal', needsValue: true },
];

const DATE_OPERATORS: OperatorOption[] = [
  { value: 'eq', label: 'Equals', needsValue: true },
  { value: 'gt', label: 'After', needsValue: true },
  { value: 'lt', label: 'Before', needsValue: true },
];

const BOOLEAN_OPERATORS: OperatorOption[] = [
  { value: 'eq', label: 'Is true', needsValue: false },
  { value: 'neq', label: 'Is false', needsValue: false },
];

const SELECT_OPERATORS: OperatorOption[] = [
  { value: 'eq', label: 'Is', needsValue: true },
  { value: 'neq', label: 'Is not', needsValue: true },
];

export function getOperatorsForType(fieldType: string): OperatorOption[] {
  switch (fieldType) {
    case 'int':
    case 'decimal':
    case 'money':
    case 'sequence':
      return NUMERIC_OPERATORS;
    case 'date':
    case 'datetime':
      return DATE_OPERATORS;
    case 'boolean':
      return BOOLEAN_OPERATORS;
    case 'enum':
    case 'link':
      return SELECT_OPERATORS;
    default:
      return STRING_OPERATORS;
  }
}

export function operatorSymbol(op: string): string {
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
