import { describe, it, expect } from 'vitest';
import { translateFilters } from '../filter-translator.js';

describe('translateFilters', () => {
  describe('simple equality (shorthand)', () => {
    it('treats plain value as eq operator', () => {
      const result = translateFilters({ status: 'confirmed' });
      expect(result).toEqual([{ field: 'status', operator: 'eq', value: 'confirmed' }]);
    });

    it('handles numeric equality', () => {
      const result = translateFilters({ amount: 100 });
      expect(result).toEqual([{ field: 'amount', operator: 'eq', value: 100 }]);
    });

    it('handles boolean equality', () => {
      const result = translateFilters({ active: true });
      expect(result).toEqual([{ field: 'active', operator: 'eq', value: true }]);
    });

    it('handles multiple fields as AND', () => {
      const result = translateFilters({ status: 'confirmed', total: 500 });
      expect(result).toEqual([
        { field: 'status', operator: 'eq', value: 'confirmed' },
        { field: 'total', operator: 'eq', value: 500 },
      ]);
    });
  });

  describe('explicit eq operator', () => {
    it('handles { eq: value }', () => {
      const result = translateFilters({ status: { eq: 'draft' } });
      expect(result).toEqual([{ field: 'status', operator: 'eq', value: 'draft' }]);
    });
  });

  describe('neq operator', () => {
    it('handles { neq: value }', () => {
      const result = translateFilters({ status: { neq: 'cancelled' } });
      expect(result).toEqual([{ field: 'status', operator: 'neq', value: 'cancelled' }]);
    });
  });

  describe('comparison operators', () => {
    it('handles gt', () => {
      const result = translateFilters({ total: { gt: 100 } });
      expect(result).toEqual([{ field: 'total', operator: 'gt', value: 100 }]);
    });

    it('handles gte', () => {
      const result = translateFilters({ total: { gte: 100 } });
      expect(result).toEqual([{ field: 'total', operator: 'gte', value: 100 }]);
    });

    it('handles lt', () => {
      const result = translateFilters({ total: { lt: 50 } });
      expect(result).toEqual([{ field: 'total', operator: 'lt', value: 50 }]);
    });

    it('handles lte', () => {
      const result = translateFilters({ total: { lte: 50 } });
      expect(result).toEqual([{ field: 'total', operator: 'lte', value: 50 }]);
    });

    it('handles multiple operators on same field (range)', () => {
      const result = translateFilters({ createdAt: { gte: '2026-01-01', lt: '2026-02-01' } });
      expect(result).toEqual([
        { field: 'createdAt', operator: 'gte', value: '2026-01-01' },
        { field: 'createdAt', operator: 'lt', value: '2026-02-01' },
      ]);
    });
  });

  describe('array operators', () => {
    it('handles in', () => {
      const result = translateFilters({ status: { in: ['confirmed', 'shipped'] } });
      expect(result).toEqual([
        { field: 'status', operator: 'in', value: ['confirmed', 'shipped'] },
      ]);
    });

    it('handles notIn', () => {
      const result = translateFilters({ status: { notIn: ['cancelled', 'refunded'] } });
      expect(result).toEqual([
        { field: 'status', operator: 'notIn', value: ['cancelled', 'refunded'] },
      ]);
    });

    it('handles empty array for in', () => {
      const result = translateFilters({ status: { in: [] } });
      expect(result).toEqual([{ field: 'status', operator: 'in', value: [] }]);
    });
  });

  describe('string operators', () => {
    it('handles contains', () => {
      const result = translateFilters({ email: { contains: '@acme.com' } });
      expect(result).toEqual([{ field: 'email', operator: 'contains', value: '@acme.com' }]);
    });

    it('handles startsWith', () => {
      const result = translateFilters({ name: { startsWith: 'John' } });
      expect(result).toEqual([{ field: 'name', operator: 'startsWith', value: 'John' }]);
    });

    it('handles endsWith', () => {
      const result = translateFilters({ email: { endsWith: '.org' } });
      expect(result).toEqual([{ field: 'email', operator: 'endsWith', value: '.org' }]);
    });

    it('handles string with SQL wildcards (escapes them)', () => {
      const result = translateFilters({ name: { contains: '100%' } });
      expect(result).toEqual([{ field: 'name', operator: 'contains', value: '100%' }]);
    });
  });

  describe('null checks', () => {
    it('handles { is: null }', () => {
      const result = translateFilters({ deletedAt: { is: null } });
      expect(result).toEqual([{ field: 'deletedAt', operator: 'is', value: null }]);
    });

    it('handles { is: "not_null" }', () => {
      const result = translateFilters({ deletedAt: { is: 'not_null' } });
      expect(result).toEqual([{ field: 'deletedAt', operator: 'is', value: 'not_null' }]);
    });
  });

  describe('edge cases', () => {
    it('returns empty array for empty filter object', () => {
      const result = translateFilters({});
      expect(result).toEqual([]);
    });

    it('returns empty array for undefined input', () => {
      const result = translateFilters(undefined as unknown as Record<string, unknown>);
      expect(result).toEqual([]);
    });

    it('returns empty array for null input', () => {
      const result = translateFilters(null as unknown as Record<string, unknown>);
      expect(result).toEqual([]);
    });

    it('throws on unknown operator', () => {
      expect(() => translateFilters({ status: { banana: 'yes' } as any })).toThrow(
        /unknown filter operator.*banana/i,
      );
    });

    it('handles filter value of 0 as equality (not falsy)', () => {
      const result = translateFilters({ count: 0 });
      expect(result).toEqual([{ field: 'count', operator: 'eq', value: 0 }]);
    });

    it('handles filter value of empty string as equality', () => {
      const result = translateFilters({ name: '' });
      expect(result).toEqual([{ field: 'name', operator: 'eq', value: '' }]);
    });

    it('handles filter value of null as shorthand for is null', () => {
      const result = translateFilters({ deletedAt: null });
      expect(result).toEqual([{ field: 'deletedAt', operator: 'is', value: null }]);
    });
  });

  describe('complex combinations', () => {
    it('handles multiple fields with mixed operators', () => {
      const result = translateFilters({
        status: { in: ['confirmed', 'shipped'] },
        total: { gt: 100 },
        email: { contains: '@acme.com' },
        active: true,
      });
      expect(result).toHaveLength(4);
      expect(result).toContainEqual({
        field: 'status',
        operator: 'in',
        value: ['confirmed', 'shipped'],
      });
      expect(result).toContainEqual({ field: 'total', operator: 'gt', value: 100 });
      expect(result).toContainEqual({ field: 'email', operator: 'contains', value: '@acme.com' });
      expect(result).toContainEqual({ field: 'active', operator: 'eq', value: true });
    });
  });
});
