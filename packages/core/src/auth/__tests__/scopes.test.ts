import { describe, it, expect } from 'vitest';
import { applyScopeFiltersToQuery } from '../scopes.js';

describe('scope system', () => {
  describe('applyScopeFiltersToQuery', () => {
    it('applies eq filters to query', () => {
      const wheres: Array<[string, string, unknown]> = [];
      const fakeQuery = {
        where(field: string, op: string, value: unknown) {
          wheres.push([field, op, value]);
          return fakeQuery;
        },
      };

      const result = applyScopeFiltersToQuery(fakeQuery, [
        { field: 'company', operator: 'eq', value: 'C-001' },
      ]);

      expect(wheres).toEqual([['company', '=', 'C-001']]);
      expect(result).toBe(fakeQuery);
    });

    it('applies in filters to query', () => {
      const wheres: Array<[string, string, unknown]> = [];
      const fakeQuery = {
        where(field: string, op: string, value: unknown) {
          wheres.push([field, op, value]);
          return fakeQuery;
        },
      };

      const result = applyScopeFiltersToQuery(fakeQuery, [
        { field: 'territory', operator: 'in', value: ['North', 'East'] },
      ]);

      expect(wheres).toEqual([['territory', 'in', ['North', 'East']]]);
      expect(result).toBe(fakeQuery);
    });

    it('applies multiple filters sequentially', () => {
      const wheres: Array<[string, string, unknown]> = [];
      const fakeQuery = {
        where(field: string, op: string, value: unknown) {
          wheres.push([field, op, value]);
          return fakeQuery;
        },
      };

      applyScopeFiltersToQuery(fakeQuery, [
        { field: 'company', operator: 'eq', value: 'C-001' },
        { field: 'territory', operator: 'in', value: ['North'] },
      ]);

      expect(wheres).toEqual([
        ['company', '=', 'C-001'],
        ['territory', 'in', ['North']],
      ]);
    });

    it('returns query unchanged when no filters', () => {
      const fakeQuery = { where: () => fakeQuery };
      const result = applyScopeFiltersToQuery(fakeQuery, []);
      expect(result).toBe(fakeQuery);
    });
  });
});
