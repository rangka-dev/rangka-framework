import type { FilterExpression, FilterOperators, TranslatedFilter } from './types.js';
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

export function translateFilters(
  expression: FilterExpression | null | undefined,
): TranslatedFilter[] {
  if (!expression || typeof expression !== 'object') return [];

  const results: TranslatedFilter[] = [];

  for (const [field, value] of Object.entries(expression)) {
    if (value === null) {
      results.push({ field, operator: 'is', value: null });
      continue;
    }

    if (isOperatorObject(value)) {
      const ops = value as Record<string, unknown>;
      for (const [op, opValue] of Object.entries(ops)) {
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
