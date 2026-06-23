import { sql } from 'kysely';
import type { TranslatedFilter, AppliedFilter, OrFilter } from '../model-api/types.js';
import { toBool } from '../helpers/coerce.js';

function escapeLike(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildWhereClause(eb: any, { field, operator, value }: TranslatedFilter): any {
  switch (operator) {
    case 'eq':
      return eb(field, '=', value);
    case 'neq':
      return eb(field, '!=', value);
    case 'gt':
      return eb(field, '>', value);
    case 'gte':
      return eb(field, '>=', value);
    case 'lt':
      return eb(field, '<', value);
    case 'lte':
      return eb(field, '<=', value);
    case 'in': {
      const arr = value as unknown[];
      return arr.length === 0 ? eb.lit(false) : eb(field, 'in', arr);
    }
    case 'notIn': {
      const arr = value as unknown[];
      return arr.length > 0 ? eb(field, 'not in', arr) : eb.lit(true);
    }
    case 'contains':
      return eb(field, 'ilike', `%${escapeLike(value as string)}%`);
    case 'startsWith':
      return eb(field, 'ilike', `${escapeLike(value as string)}%`);
    case 'endsWith':
      return eb(field, 'ilike', `%${escapeLike(value as string)}`);
    case 'is':
      return value === null ? eb(field, 'is', null) : eb(field, 'is not', null);
    default:
      return eb(field, '=', value);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyModelFilters(query: any, filters: AppliedFilter[]): any {
  let result = query;

  for (const filter of filters) {
    if (filter.operator === '$or') {
      const { branches } = filter as OrFilter;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result = result.where((eb: any) =>
        eb.or(
          branches.map((branch: TranslatedFilter[]) =>
            eb.and(branch.map((f: TranslatedFilter) => buildWhereClause(eb, f))),
          ),
        ),
      );
      continue;
    }

    const { field, operator, value } = filter as TranslatedFilter;
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
