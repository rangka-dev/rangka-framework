import type {
  FilterExpression,
  FilterOperators,
  TranslatedFilter,
  AppliedFilter,
  OrFilter,
} from './types.js';
import { UnsupportedOperationError } from '@rangka/shared';
import { isNil } from '../helpers/coerce.js';

export type { TranslatedFilter } from './types.js';

const VALID_OPERATORS = new Set([
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'in',
  'notIn',
  'contains',
  'startsWith',
  'endsWith',
  'is',
  'between',
]);

function isOperatorObject(value: unknown): value is FilterOperators {
  if (isNil(value)) return false;
  if (typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  if (value instanceof Date) return false;
  const keys = Object.keys(value);
  if (keys.length === 0) return false;
  const hasAnyKnown = keys.some((k) => VALID_OPERATORS.has(k));
  const hasAnyUnknown = keys.some((k) => !VALID_OPERATORS.has(k));
  if (hasAnyUnknown && !hasAnyKnown) {
    throw new Error(`Unknown filter operator: ${keys.find((k) => !VALID_OPERATORS.has(k))}`);
  }
  if (hasAnyUnknown && hasAnyKnown) {
    throw new Error(`Unknown filter operator: ${keys.find((k) => !VALID_OPERATORS.has(k))}`);
  }
  return true;
}

function translateToTranslated(
  expression: FilterExpression | null | undefined,
): TranslatedFilter[] {
  if (!expression || typeof expression !== 'object') return [];
  const results: TranslatedFilter[] = [];

  for (const [field, value] of Object.entries(expression)) {
    if (field === '$or') continue;

    if (value === null) {
      results.push({ field, operator: 'is', value: null });
      continue;
    }

    if (isOperatorObject(value)) {
      const ops = value as Record<string, unknown>;
      for (const [op, opValue] of Object.entries(ops)) {
        if (op === 'between') {
          const [a, b] = opValue as [unknown, unknown];
          results.push({ field, operator: 'gte', value: a });
          results.push({ field, operator: 'lte', value: b });
          continue;
        }
        if (!VALID_OPERATORS.has(op)) {
          throw new Error(`Unknown filter operator: ${op}`);
        }
        results.push({ field, operator: op, value: opValue });
      }
      continue;
    }

    results.push({ field, operator: 'eq', value });
  }

  return results;
}

export function translateFilters(expression: FilterExpression | null | undefined): AppliedFilter[] {
  if (!expression || typeof expression !== 'object') return [];

  const results: AppliedFilter[] = [];

  if ('$or' in expression && expression.$or !== undefined) {
    const branches = expression.$or as FilterExpression[];
    const translatedBranches = branches.map((branch) => {
      if ('$or' in branch && branch.$or !== undefined) {
        throw new UnsupportedOperationError('filter', '$or', 'Nested $or is not supported');
      }
      return translateToTranslated(branch);
    });
    const orFilter: OrFilter = { operator: '$or', branches: translatedBranches };
    results.push(orFilter);
  }

  results.push(...translateToTranslated(expression));

  return results;
}
