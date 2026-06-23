import { sql } from 'kysely';
import type { TranslatedFilter, AppliedFilter, OrFilter } from '../model-api/types.js';
import { toBool } from '../helpers/coerce.js';
import type { Dialect } from './client.js';

function escapeLike(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

function likeOp(dialect?: Dialect): 'ilike' | 'like' {
  return dialect === 'sqlite' ? 'like' : 'ilike';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildWhereClause(
  eb: any,
  { field, operator, value }: TranslatedFilter,
  dialect?: Dialect,
): any {
  const like = likeOp(dialect);
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
      return eb(field, like, `%${escapeLike(value as string)}%`);
    case 'startsWith':
      return eb(field, like, `${escapeLike(value as string)}%`);
    case 'endsWith':
      return eb(field, like, `%${escapeLike(value as string)}`);
    case 'is':
      return value === null ? eb(field, 'is', null) : eb(field, 'is not', null);
    default:
      return eb(field, '=', value);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyModelFilters(query: any, filters: AppliedFilter[], dialect?: Dialect): any {
  let result = query;
  const like = likeOp(dialect);

  for (const filter of filters) {
    if (filter.operator === '$or') {
      const { branches } = filter as OrFilter;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result = result.where((eb: any) =>
        eb.or(
          branches.map((branch: TranslatedFilter[]) =>
            eb.and(branch.map((f: TranslatedFilter) => buildWhereClause(eb, f, dialect))),
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
        result = result.where(field, like, `%${escapeLike(value as string)}%`);
        break;
      case 'startsWith':
        result = result.where(field, like, `${escapeLike(value as string)}%`);
        break;
      case 'endsWith':
        result = result.where(field, like, `%${escapeLike(value as string)}`);
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
        result = result.where(field, like, `%${value}%`);
        break;
    }
  }

  return result;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function applySearchFilter(
  query: any,
  term: string,
  fields: string[],
  dialect?: Dialect,
): any {
  if (!term || fields.length === 0) return query;
  const like = likeOp(dialect);
  const escaped = `%${escapeLike(term)}%`;
  return query.where((eb: any) => eb.or(fields.map((field: string) => eb(field, like, escaped))));
}
/* eslint-enable @typescript-eslint/no-explicit-any */
