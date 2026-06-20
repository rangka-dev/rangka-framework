import { describe, it, expect } from 'vitest';
import { filtersToParams, sortToString } from '../data/useModelQuery.js';
import type { ParsedFilter, SortEntry } from '../reactivity/variables.js';

describe('useModelSource helpers', () => {
  describe('filtersToParams', () => {
    it('converts eq filter to simple key', () => {
      const filters: ParsedFilter[] = [
        { model: 'sales.order', field: 'status', operator: 'eq', value: 'draft' },
      ];
      expect(filtersToParams(filters)).toEqual({ 'filter[status]': 'draft' });
    });

    it('converts operator filter to nested key', () => {
      const filters: ParsedFilter[] = [
        { model: 'sales.order', field: 'total', operator: 'gt', value: 1000 },
      ];
      expect(filtersToParams(filters)).toEqual({ 'filter[total][gt]': '1000' });
    });

    it('converts multiple filters', () => {
      const filters: ParsedFilter[] = [
        { model: 'sales.order', field: 'status', operator: 'eq', value: 'paid' },
        { model: 'sales.order', field: 'total', operator: 'gte', value: 500 },
        { model: 'sales.order', field: 'name', operator: 'like', value: 'acme' },
      ];
      const result = filtersToParams(filters);
      expect(result).toEqual({
        'filter[status]': 'paid',
        'filter[total][gte]': '500',
        'filter[name][like]': 'acme',
      });
    });

    it('returns empty object for empty filters', () => {
      expect(filtersToParams([])).toEqual({});
    });
  });

  describe('sortToString', () => {
    it('converts single asc sort', () => {
      const sort: SortEntry[] = [{ field: 'name', direction: 'asc' }];
      expect(sortToString(sort)).toBe('name');
    });

    it('converts single desc sort', () => {
      const sort: SortEntry[] = [{ field: 'date', direction: 'desc' }];
      expect(sortToString(sort)).toBe('-date');
    });

    it('converts multi-field sort', () => {
      const sort: SortEntry[] = [
        { field: 'date', direction: 'desc' },
        { field: 'name', direction: 'asc' },
      ];
      expect(sortToString(sort)).toBe('-date,name');
    });

    it('returns undefined for null sort', () => {
      expect(sortToString(null)).toBeUndefined();
    });

    it('returns undefined for empty array', () => {
      expect(sortToString([])).toBeUndefined();
    });
  });
});
