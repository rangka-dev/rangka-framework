import { sql } from 'kysely';
import type { TranslatedFilter } from '../model-api/types.js';
import { toBool } from '../helpers/coerce.js';

function escapeLike(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyModelFilters(query: any, filters: TranslatedFilter[]): any {
  let result = query;

  for (const { field, operator, value } of filters) {
    switch (operator) {
      case 'eq':
        result = result.where(field, '=', value);
        break;
      case 'neq':
        result = result.where(field, '!=', value);
        break;
      case 'gt':
        result = result.where(field, '>', value);
        break;
      case 'gte':
        result = result.where(field, '>=', value);
        break;
      case 'lt':
        result = result.where(field, '<', value);
        break;
      case 'lte':
        result = result.where(field, '<=', value);
        break;
      case 'in': {
        const arr = value as unknown[];
        if (arr.length === 0) {
          result = result.where(sql`1 = 0`);
        } else {
          result = result.where(field, 'in', arr);
        }
        break;
      }
      case 'notIn': {
        const arr = value as unknown[];
        if (arr.length > 0) {
          result = result.where(field, 'not in', arr);
        }
        break;
      }
      case 'contains':
        result = result.where(field, 'ilike', `%${escapeLike(value as string)}%`);
        break;
      case 'startsWith':
        result = result.where(field, 'ilike', `${escapeLike(value as string)}%`);
        break;
      case 'endsWith':
        result = result.where(field, 'ilike', `%${escapeLike(value as string)}`);
        break;
      case 'is':
        if (value === null) {
          result = result.where(field, 'is', null);
        } else {
          result = result.where(field, 'is not', null);
        }
        break;
      case 'isnull':
        if (toBool(value)) {
          result = result.where(field, 'is', null);
        } else {
          result = result.where(field, 'is not', null);
        }
        break;
      case 'like':
        result = result.where(field, 'ilike', `%${value}%`);
        break;
    }
  }

  return result;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function applySearchFilter(query: any, term: string, fields: string[]): any {
  if (!term || fields.length === 0) return query;
  const escaped = `%${escapeLike(term)}%`;
  return query.where((eb: any) =>
    eb.or(fields.map((field: string) => eb(field, 'ilike', escaped))),
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
