/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ScopeFilter } from './types.js';

export function applyScopeFiltersToQuery(query: any, scopeFilters: ScopeFilter[]): any {
  let result = query;
  for (const filter of scopeFilters) {
    const operator = filter.operator === 'in' ? 'in' : '=';
    result = result.where(filter.field, operator, filter.value);
  }
  return result;
}
