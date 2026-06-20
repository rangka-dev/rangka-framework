import { describe, it, expect } from 'vitest';
import {
  applyInMemoryFilters,
  applyInMemorySort,
  applyInMemoryPagination,
} from '../in-memory-ops.js';
import type { TranslatedFilter } from '../../model-api/filter-translator.js';

describe('applyInMemoryFilters', () => {
  const records = [
    { id: '1', name: 'Alice', age: 30, email: 'alice@acme.com', status: 'active' },
    { id: '2', name: 'Bob', age: 25, email: 'bob@test.org', status: 'inactive' },
    { id: '3', name: 'Charlie', age: 35, email: 'charlie@acme.com', status: 'active' },
    { id: '4', name: 'Diana', age: 28, email: null, status: null },
  ];

  describe('eq operator', () => {
    it('filters by exact match', () => {
      const filters: TranslatedFilter[] = [{ field: 'status', operator: 'eq', value: 'active' }];
      const result = applyInMemoryFilters(records, filters);
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.name)).toEqual(['Alice', 'Charlie']);
    });

    it('handles numeric equality', () => {
      const filters: TranslatedFilter[] = [{ field: 'age', operator: 'eq', value: 25 }];
      const result = applyInMemoryFilters(records, filters);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bob');
    });
  });

  describe('neq operator', () => {
    it('excludes matching records', () => {
      const filters: TranslatedFilter[] = [{ field: 'status', operator: 'neq', value: 'active' }];
      const result = applyInMemoryFilters(records, filters);
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.name)).toEqual(['Bob', 'Diana']);
    });
  });

  describe('comparison operators', () => {
    it('gt filters greater than', () => {
      const filters: TranslatedFilter[] = [{ field: 'age', operator: 'gt', value: 28 }];
      const result = applyInMemoryFilters(records, filters);
      expect(result.map((r) => r.name)).toEqual(['Alice', 'Charlie']);
    });

    it('gte includes boundary', () => {
      const filters: TranslatedFilter[] = [{ field: 'age', operator: 'gte', value: 28 }];
      const result = applyInMemoryFilters(records, filters);
      expect(result.map((r) => r.name)).toEqual(['Alice', 'Charlie', 'Diana']);
    });

    it('lt filters less than', () => {
      const filters: TranslatedFilter[] = [{ field: 'age', operator: 'lt', value: 28 }];
      const result = applyInMemoryFilters(records, filters);
      expect(result.map((r) => r.name)).toEqual(['Bob']);
    });

    it('lte includes boundary', () => {
      const filters: TranslatedFilter[] = [{ field: 'age', operator: 'lte', value: 28 }];
      const result = applyInMemoryFilters(records, filters);
      expect(result.map((r) => r.name)).toEqual(['Bob', 'Diana']);
    });
  });

  describe('in / notIn operators', () => {
    it('in matches values in array', () => {
      const filters: TranslatedFilter[] = [
        { field: 'name', operator: 'in', value: ['Alice', 'Bob'] },
      ];
      const result = applyInMemoryFilters(records, filters);
      expect(result).toHaveLength(2);
    });

    it('notIn excludes values in array', () => {
      const filters: TranslatedFilter[] = [
        { field: 'name', operator: 'notIn', value: ['Alice', 'Bob'] },
      ];
      const result = applyInMemoryFilters(records, filters);
      expect(result.map((r) => r.name)).toEqual(['Charlie', 'Diana']);
    });
  });

  describe('string operators', () => {
    it('contains matches substring (case-insensitive)', () => {
      const filters: TranslatedFilter[] = [{ field: 'email', operator: 'contains', value: 'acme' }];
      const result = applyInMemoryFilters(records, filters);
      expect(result.map((r) => r.name)).toEqual(['Alice', 'Charlie']);
    });

    it('startsWith matches prefix (case-insensitive)', () => {
      const filters: TranslatedFilter[] = [{ field: 'name', operator: 'startsWith', value: 'al' }];
      const result = applyInMemoryFilters(records, filters);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice');
    });

    it('endsWith matches suffix (case-insensitive)', () => {
      const filters: TranslatedFilter[] = [{ field: 'email', operator: 'endsWith', value: '.org' }];
      const result = applyInMemoryFilters(records, filters);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bob');
    });

    it('contains returns false for non-string fields', () => {
      const filters: TranslatedFilter[] = [{ field: 'age', operator: 'contains', value: '3' }];
      const result = applyInMemoryFilters(records, filters);
      expect(result).toHaveLength(0);
    });
  });

  describe('null check operators', () => {
    it('is null matches null values', () => {
      const filters: TranslatedFilter[] = [{ field: 'email', operator: 'is', value: null }];
      const result = applyInMemoryFilters(records, filters);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Diana');
    });

    it('is not_null matches non-null values', () => {
      const filters: TranslatedFilter[] = [{ field: 'email', operator: 'is', value: 'not_null' }];
      const result = applyInMemoryFilters(records, filters);
      expect(result).toHaveLength(3);
    });

    it('isnull true matches null values', () => {
      const filters: TranslatedFilter[] = [{ field: 'status', operator: 'isnull', value: true }];
      const result = applyInMemoryFilters(records, filters);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Diana');
    });
  });

  describe('multiple filters (AND)', () => {
    it('applies all filters', () => {
      const filters: TranslatedFilter[] = [
        { field: 'status', operator: 'eq', value: 'active' },
        { field: 'age', operator: 'gt', value: 30 },
      ];
      const result = applyInMemoryFilters(records, filters);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Charlie');
    });
  });

  describe('empty input', () => {
    it('returns all records with empty filters', () => {
      const result = applyInMemoryFilters(records, []);
      expect(result).toHaveLength(4);
    });

    it('returns empty array for empty records', () => {
      const filters: TranslatedFilter[] = [{ field: 'name', operator: 'eq', value: 'test' }];
      const result = applyInMemoryFilters([], filters);
      expect(result).toEqual([]);
    });
  });
});

describe('applyInMemorySort', () => {
  const records = [
    { id: '1', name: 'Charlie', age: 35 },
    { id: '2', name: 'Alice', age: 30 },
    { id: '3', name: 'Bob', age: 25 },
    { id: '4', name: 'Alice', age: 28 },
  ];

  it('sorts ascending by string field', () => {
    const result = applyInMemorySort(records, [{ field: 'name', direction: 'asc' }]);
    expect(result.map((r) => r.name)).toEqual(['Alice', 'Alice', 'Bob', 'Charlie']);
  });

  it('sorts descending by string field', () => {
    const result = applyInMemorySort(records, [{ field: 'name', direction: 'desc' }]);
    expect(result.map((r) => r.name)).toEqual(['Charlie', 'Bob', 'Alice', 'Alice']);
  });

  it('sorts by numeric field', () => {
    const result = applyInMemorySort(records, [{ field: 'age', direction: 'asc' }]);
    expect(result.map((r) => r.age)).toEqual([25, 28, 30, 35]);
  });

  it('sorts by multiple fields', () => {
    const result = applyInMemorySort(records, [
      { field: 'name', direction: 'asc' },
      { field: 'age', direction: 'desc' },
    ]);
    expect(result.map((r) => ({ name: r.name, age: r.age }))).toEqual([
      { name: 'Alice', age: 30 },
      { name: 'Alice', age: 28 },
      { name: 'Bob', age: 25 },
      { name: 'Charlie', age: 35 },
    ]);
  });

  it('handles null values (nulls first in asc)', () => {
    const data = [
      { id: '1', name: 'Bob' },
      { id: '2', name: null },
      { id: '3', name: 'Alice' },
    ];
    const result = applyInMemorySort(data, [{ field: 'name', direction: 'asc' }]);
    expect(result.map((r) => r.name)).toEqual([null, 'Alice', 'Bob']);
  });

  it('returns same order with no sorts', () => {
    const result = applyInMemorySort(records, []);
    expect(result).toEqual(records);
  });

  it('does not mutate original array', () => {
    const original = [...records];
    applyInMemorySort(records, [{ field: 'age', direction: 'asc' }]);
    expect(records).toEqual(original);
  });
});

describe('applyInMemoryPagination', () => {
  const records = Array.from({ length: 10 }, (_, i) => ({ id: String(i + 1), index: i }));

  it('returns first page', () => {
    const result = applyInMemoryPagination(records, 3, 0);
    expect(result.map((r) => r.index)).toEqual([0, 1, 2]);
  });

  it('returns second page', () => {
    const result = applyInMemoryPagination(records, 3, 3);
    expect(result.map((r) => r.index)).toEqual([3, 4, 5]);
  });

  it('returns partial last page', () => {
    const result = applyInMemoryPagination(records, 3, 9);
    expect(result.map((r) => r.index)).toEqual([9]);
  });

  it('returns empty when offset exceeds length', () => {
    const result = applyInMemoryPagination(records, 3, 20);
    expect(result).toEqual([]);
  });

  it('returns all records when limit exceeds length', () => {
    const result = applyInMemoryPagination(records, 100, 0);
    expect(result).toHaveLength(10);
  });
});
