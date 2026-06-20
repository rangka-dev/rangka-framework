import { describe, it, expect } from 'vitest';
import { QueryParser, QueryValidationError } from '../query-parser.js';
import type { ResolvedField } from '../../schema/types.js';

function makeFields(): ResolvedField[] {
  return [
    { name: 'id', config: { type: 'string' }, provenance: { source: 'base' } },
    { name: 'status', config: { type: 'string' }, provenance: { source: 'base' } },
    { name: 'name', config: { type: 'string' }, provenance: { source: 'base' } },
    {
      name: 'grand_total',
      config: { type: 'decimal', precision: 10, scale: 2 },
      provenance: { source: 'base' },
    },
    { name: 'quantity', config: { type: 'int' }, provenance: { source: 'base' } },
    { name: 'created_at', config: { type: 'datetime' }, provenance: { source: 'base' } },
    { name: 'is_active', config: { type: 'boolean' }, provenance: { source: 'base' } },
    { name: 'deleted_at', config: { type: 'datetime' }, provenance: { source: 'base' } },
    { name: 'description', config: { type: 'text' }, provenance: { source: 'base' } },
  ];
}

const relations = ['customer', 'items'];

describe('QueryParser', () => {
  describe('parseFilters', () => {
    it('parses equality filter', () => {
      const parser = new QueryParser(makeFields(), relations);
      const result = parser.parseFilters({ filter: { status: { eq: 'posted' } } });
      expect(result).toEqual([{ field: 'status', operator: 'eq', value: 'posted' }]);
    });

    it('parses gt filter on numeric field', () => {
      const parser = new QueryParser(makeFields(), relations);
      const result = parser.parseFilters({ filter: { grand_total: { gt: '1000' } } });
      expect(result).toEqual([{ field: 'grand_total', operator: 'gt', value: 1000 }]);
    });

    it('parses in filter with multiple values', () => {
      const parser = new QueryParser(makeFields(), relations);
      const result = parser.parseFilters({ filter: { status: { in: 'draft,posted' } } });
      expect(result).toEqual([{ field: 'status', operator: 'in', value: ['draft', 'posted'] }]);
    });

    it('parses like filter', () => {
      const parser = new QueryParser(makeFields(), relations);
      const result = parser.parseFilters({ filter: { name: { like: 'acme' } } });
      expect(result).toEqual([{ field: 'name', operator: 'like', value: 'acme' }]);
    });

    it('parses isnull filter', () => {
      const parser = new QueryParser(makeFields(), relations);
      const result = parser.parseFilters({ filter: { deleted_at: { isnull: 'true' } } });
      expect(result).toEqual([{ field: 'deleted_at', operator: 'isnull', value: true }]);
    });

    it('parses multiple filters', () => {
      const parser = new QueryParser(makeFields(), relations);
      const result = parser.parseFilters({
        filter: { status: { eq: 'posted' }, grand_total: { gte: '500' } },
      });
      expect(result).toHaveLength(2);
    });

    it('rejects unknown field', () => {
      const parser = new QueryParser(makeFields(), relations);
      expect(() => parser.parseFilters({ filter: { nonexistent: { eq: 'x' } } })).toThrow(
        QueryValidationError,
      );
    });

    it('rejects unknown operator', () => {
      const parser = new QueryParser(makeFields(), relations);
      expect(() => parser.parseFilters({ filter: { status: { badop: 'x' } } })).toThrow(
        QueryValidationError,
      );
    });

    it('rejects gt operator on string field', () => {
      const parser = new QueryParser(makeFields(), relations);
      expect(() => parser.parseFilters({ filter: { status: { gt: '5' } } })).toThrow(
        QueryValidationError,
      );
    });

    it('rejects like operator on numeric field', () => {
      const parser = new QueryParser(makeFields(), relations);
      expect(() => parser.parseFilters({ filter: { grand_total: { like: 'abc' } } })).toThrow(
        QueryValidationError,
      );
    });

    it('allows gt on date field', () => {
      const parser = new QueryParser(makeFields(), relations);
      const result = parser.parseFilters({ filter: { created_at: { gt: '2024-01-01' } } });
      expect(result).toEqual([{ field: 'created_at', operator: 'gt', value: '2024-01-01' }]);
    });

    it('returns empty for missing filter param', () => {
      const parser = new QueryParser(makeFields(), relations);
      expect(parser.parseFilters({})).toEqual([]);
    });
  });

  describe('parseSort', () => {
    it('parses ascending sort', () => {
      const parser = new QueryParser(makeFields(), relations);
      const result = parser.parseSort({ sort: 'created_at' });
      expect(result).toEqual([{ field: 'created_at', direction: 'asc' }]);
    });

    it('parses descending sort', () => {
      const parser = new QueryParser(makeFields(), relations);
      const result = parser.parseSort({ sort: '-grand_total' });
      expect(result).toEqual([{ field: 'grand_total', direction: 'desc' }]);
    });

    it('parses multiple sort fields', () => {
      const parser = new QueryParser(makeFields(), relations);
      const result = parser.parseSort({ sort: 'status,-created_at' });
      expect(result).toEqual([
        { field: 'status', direction: 'asc' },
        { field: 'created_at', direction: 'desc' },
      ]);
    });

    it('rejects unknown sort field', () => {
      const parser = new QueryParser(makeFields(), relations);
      expect(() => parser.parseSort({ sort: 'nonexistent' })).toThrow(QueryValidationError);
    });

    it('returns empty for missing sort param', () => {
      const parser = new QueryParser(makeFields(), relations);
      expect(parser.parseSort({})).toEqual([]);
    });
  });

  describe('parsePagination', () => {
    it('returns defaults when no params', () => {
      const parser = new QueryParser(makeFields(), relations);
      const result = parser.parsePagination({});
      expect(result).toEqual({ page: 1, limit: 25, offset: 0 });
    });

    it('parses explicit page and limit', () => {
      const parser = new QueryParser(makeFields(), relations);
      const result = parser.parsePagination({ page: '2', limit: '10' });
      expect(result).toEqual({ page: 2, limit: 10, offset: 10 });
    });

    it('caps limit at 100', () => {
      const parser = new QueryParser(makeFields(), relations);
      const result = parser.parsePagination({ limit: '500' });
      expect(result.limit).toBe(100);
    });

    it('floors page at 1', () => {
      const parser = new QueryParser(makeFields(), relations);
      const result = parser.parsePagination({ page: '-1' });
      expect(result.page).toBe(1);
    });

    it('floors limit at 1', () => {
      const parser = new QueryParser(makeFields(), relations);
      const result = parser.parsePagination({ limit: '0' });
      expect(result.limit).toBe(1);
    });
  });

  describe('parseIncludes', () => {
    it('parses single include', () => {
      const parser = new QueryParser(makeFields(), relations);
      const result = parser.parseIncludes({ include: 'customer' });
      expect(result).toEqual([{ relation: 'customer' }]);
    });

    it('parses multiple includes', () => {
      const parser = new QueryParser(makeFields(), relations);
      const result = parser.parseIncludes({ include: 'customer,items' });
      expect(result).toEqual([{ relation: 'customer' }, { relation: 'items' }]);
    });

    it('parses nested include', () => {
      const parser = new QueryParser(makeFields(), ['items']);
      const result = parser.parseIncludes({ include: 'items.tax_type' });
      expect(result).toEqual([{ relation: 'items', nested: [{ relation: 'tax_type' }] }]);
    });

    it('rejects depth > 2', () => {
      const parser = new QueryParser(makeFields(), ['items']);
      expect(() => parser.parseIncludes({ include: 'items.tax_type.category' })).toThrow(
        QueryValidationError,
      );
    });

    it('rejects unknown relation', () => {
      const parser = new QueryParser(makeFields(), relations);
      expect(() => parser.parseIncludes({ include: 'nonexistent' })).toThrow(QueryValidationError);
    });

    it('returns empty for missing include param', () => {
      const parser = new QueryParser(makeFields(), relations);
      expect(parser.parseIncludes({})).toEqual([]);
    });
  });

  describe('parseFields', () => {
    it('parses field list', () => {
      const parser = new QueryParser(makeFields(), relations);
      const result = parser.parseFields({ fields: 'id,status,grand_total' });
      expect(result).toEqual(['id', 'status', 'grand_total']);
    });

    it('always includes id', () => {
      const parser = new QueryParser(makeFields(), relations);
      const result = parser.parseFields({ fields: 'status' });
      expect(result).toContain('id');
      expect(result).toContain('status');
    });

    it('rejects unknown field', () => {
      const parser = new QueryParser(makeFields(), relations);
      expect(() => parser.parseFields({ fields: 'id,nonexistent' })).toThrow(QueryValidationError);
    });

    it('returns empty for missing fields param', () => {
      const parser = new QueryParser(makeFields(), relations);
      expect(parser.parseFields({})).toEqual([]);
    });
  });

  describe('parse (full)', () => {
    it('parses combined query', () => {
      const parser = new QueryParser(makeFields(), relations);
      const result = parser.parse({
        filter: { status: { eq: 'draft' } },
        sort: '-created_at',
        page: '2',
        limit: '10',
        include: 'customer',
        fields: 'id,status',
      });
      expect(result.filters).toHaveLength(1);
      expect(result.sort).toHaveLength(1);
      expect(result.pagination).toEqual({ page: 2, limit: 10, offset: 10 });
      expect(result.includes).toHaveLength(1);
      expect(result.fields).toContain('status');
    });
  });

  describe('parseSearch', () => {
    it('returns trimmed string for valid search', () => {
      const parser = new QueryParser(makeFields(), relations);
      const result = parser.parseSearch({ search: '  hello  ' });
      expect(result).toBe('hello');
    });

    it('returns undefined for empty string', () => {
      const parser = new QueryParser(makeFields(), relations);
      expect(parser.parseSearch({ search: '' })).toBeUndefined();
    });

    it('returns undefined for whitespace-only string', () => {
      const parser = new QueryParser(makeFields(), relations);
      expect(parser.parseSearch({ search: '   ' })).toBeUndefined();
    });

    it('returns undefined when search param is missing', () => {
      const parser = new QueryParser(makeFields(), relations);
      expect(parser.parseSearch({})).toBeUndefined();
    });

    it('returns undefined for non-string values', () => {
      const parser = new QueryParser(makeFields(), relations);
      expect(parser.parseSearch({ search: 123 })).toBeUndefined();
      expect(parser.parseSearch({ search: null })).toBeUndefined();
    });

    it('is included in parse() result', () => {
      const parser = new QueryParser(makeFields(), relations);
      const result = parser.parse({ search: 'keyword' });
      expect(result.search).toBe('keyword');
    });

    it('parse() returns undefined search when not provided', () => {
      const parser = new QueryParser(makeFields(), relations);
      const result = parser.parse({});
      expect(result.search).toBeUndefined();
    });
  });
});
