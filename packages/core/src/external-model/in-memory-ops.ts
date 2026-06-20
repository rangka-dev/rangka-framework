import type { TranslatedFilter } from '../model-api/filter-translator.js';
import { toBool, isNil } from '../helpers/coerce.js';

export function applyInMemoryFilters(
  records: Record<string, unknown>[],
  filters: TranslatedFilter[],
): Record<string, unknown>[] {
  return records.filter((record) => {
    for (const { field, operator, value } of filters) {
      const fieldValue = record[field];

      switch (operator) {
        case 'eq':
          if (fieldValue !== value) return false;
          break;
        case 'neq':
          if (fieldValue === value) return false;
          break;
        case 'gt':
          if (!(fieldValue! > value!)) return false;
          break;
        case 'gte':
          if (!(fieldValue! >= value!)) return false;
          break;
        case 'lt':
          if (!(fieldValue! < value!)) return false;
          break;
        case 'lte':
          if (!(fieldValue! <= value!)) return false;
          break;
        case 'in':
          if (!(value as unknown[]).includes(fieldValue)) return false;
          break;
        case 'notIn':
          if ((value as unknown[]).includes(fieldValue)) return false;
          break;
        case 'contains':
          if (
            typeof fieldValue !== 'string' ||
            !fieldValue.toLowerCase().includes((value as string).toLowerCase())
          )
            return false;
          break;
        case 'startsWith':
          if (
            typeof fieldValue !== 'string' ||
            !fieldValue.toLowerCase().startsWith((value as string).toLowerCase())
          )
            return false;
          break;
        case 'endsWith':
          if (
            typeof fieldValue !== 'string' ||
            !fieldValue.toLowerCase().endsWith((value as string).toLowerCase())
          )
            return false;
          break;
        case 'is':
        case 'isnull':
          if (isNil(value) || toBool(value)) {
            if (!isNil(fieldValue)) return false;
          } else {
            if (isNil(fieldValue)) return false;
          }
          break;
        case 'like':
          if (
            typeof fieldValue !== 'string' ||
            !fieldValue.toLowerCase().includes((value as string).toLowerCase())
          )
            return false;
          break;
      }
    }
    return true;
  });
}

export function applyInMemorySort(
  records: Record<string, unknown>[],
  sorts: Array<{ field: string; direction: 'asc' | 'desc' }>,
): Record<string, unknown>[] {
  if (sorts.length === 0) return records;

  return [...records].sort((a, b) => {
    for (const { field, direction } of sorts) {
      const aVal = a[field];
      const bVal = b[field];

      if (aVal === bVal) continue;
      if (aVal == null) return direction === 'asc' ? -1 : 1;
      if (bVal == null) return direction === 'asc' ? 1 : -1;

      const cmp = aVal < bVal ? -1 : 1;
      return direction === 'asc' ? cmp : -cmp;
    }
    return 0;
  });
}

export function applyInMemoryPagination(
  records: Record<string, unknown>[],
  limit: number,
  offset: number,
): Record<string, unknown>[] {
  return records.slice(offset, offset + limit);
}
