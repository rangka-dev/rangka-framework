import { describe, it, expect } from 'vitest';
import {
  Kysely,
  DummyDriver,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from 'kysely';
import { applyModelFilters } from '../filter-applier.js';
import type { TranslatedFilter } from '../filter-translator.js';

function createTestDb() {
  return new Kysely<any>({
    dialect: {
      createAdapter: () => new PostgresAdapter(),
      createDriver: () => new DummyDriver(),
      createIntrospector: (db: any) => new PostgresIntrospector(db),
      createQueryCompiler: () => new PostgresQueryCompiler(),
    },
  });
}

function compileQuery(db: Kysely<any>, filters: TranslatedFilter[]) {
  let query = db.selectFrom('test_table').selectAll();
  query = applyModelFilters(query, filters);
  return query.compile();
}

describe('applyModelFilters', () => {
  const db = createTestDb();

  describe('eq operator', () => {
    it('generates = clause', () => {
      const compiled = compileQuery(db, [{ field: 'status', operator: 'eq', value: 'active' }]);
      expect(compiled.sql).toContain('"status" = $1');
      expect(compiled.parameters).toEqual(['active']);
    });
  });

  describe('neq operator', () => {
    it('generates != clause', () => {
      const compiled = compileQuery(db, [{ field: 'status', operator: 'neq', value: 'cancelled' }]);
      expect(compiled.sql).toContain('"status" != $1');
      expect(compiled.parameters).toEqual(['cancelled']);
    });
  });

  describe('gt operator', () => {
    it('generates > clause', () => {
      const compiled = compileQuery(db, [{ field: 'total', operator: 'gt', value: 100 }]);
      expect(compiled.sql).toContain('"total" > $1');
      expect(compiled.parameters).toEqual([100]);
    });
  });

  describe('gte operator', () => {
    it('generates >= clause', () => {
      const compiled = compileQuery(db, [{ field: 'total', operator: 'gte', value: 100 }]);
      expect(compiled.sql).toContain('"total" >= $1');
      expect(compiled.parameters).toEqual([100]);
    });
  });

  describe('lt operator', () => {
    it('generates < clause', () => {
      const compiled = compileQuery(db, [{ field: 'total', operator: 'lt', value: 50 }]);
      expect(compiled.sql).toContain('"total" < $1');
      expect(compiled.parameters).toEqual([50]);
    });
  });

  describe('lte operator', () => {
    it('generates <= clause', () => {
      const compiled = compileQuery(db, [{ field: 'total', operator: 'lte', value: 50 }]);
      expect(compiled.sql).toContain('"total" <= $1');
      expect(compiled.parameters).toEqual([50]);
    });
  });

  describe('in operator', () => {
    it('generates IN clause', () => {
      const compiled = compileQuery(db, [
        { field: 'status', operator: 'in', value: ['a', 'b', 'c'] },
      ]);
      expect(compiled.sql).toContain('"status" in ($1, $2, $3)');
      expect(compiled.parameters).toEqual(['a', 'b', 'c']);
    });

    it('generates false condition for empty array', () => {
      const compiled = compileQuery(db, [{ field: 'status', operator: 'in', value: [] }]);
      expect(compiled.sql).toContain('1 = 0');
    });
  });

  describe('notIn operator', () => {
    it('generates NOT IN clause', () => {
      const compiled = compileQuery(db, [
        { field: 'status', operator: 'notIn', value: ['x', 'y'] },
      ]);
      expect(compiled.sql).toContain('"status" not in ($1, $2)');
      expect(compiled.parameters).toEqual(['x', 'y']);
    });

    it('is no-op for empty array', () => {
      const compiled = compileQuery(db, [{ field: 'status', operator: 'notIn', value: [] }]);
      expect(compiled.sql).not.toContain('not in');
    });
  });

  describe('contains operator', () => {
    it('generates ILIKE with % wrapping', () => {
      const compiled = compileQuery(db, [
        { field: 'email', operator: 'contains', value: '@acme.com' },
      ]);
      expect(compiled.sql).toContain('"email" ilike $1');
      expect(compiled.parameters).toEqual(['%@acme.com%']);
    });

    it('escapes % and _ in the value', () => {
      const compiled = compileQuery(db, [
        { field: 'name', operator: 'contains', value: '100%_test' },
      ]);
      expect(compiled.parameters).toEqual(['%100\\%\\_test%']);
    });
  });

  describe('startsWith operator', () => {
    it('generates ILIKE with trailing %', () => {
      const compiled = compileQuery(db, [{ field: 'name', operator: 'startsWith', value: 'John' }]);
      expect(compiled.sql).toContain('"name" ilike $1');
      expect(compiled.parameters).toEqual(['John%']);
    });
  });

  describe('endsWith operator', () => {
    it('generates ILIKE with leading %', () => {
      const compiled = compileQuery(db, [{ field: 'email', operator: 'endsWith', value: '.org' }]);
      expect(compiled.sql).toContain('"email" ilike $1');
      expect(compiled.parameters).toEqual(['%.org']);
    });
  });

  describe('is null operator', () => {
    it('generates IS NULL', () => {
      const compiled = compileQuery(db, [{ field: 'deleted_at', operator: 'is', value: null }]);
      expect(compiled.sql).toContain('"deleted_at" is null');
    });

    it('generates IS NOT NULL for "not_null"', () => {
      const compiled = compileQuery(db, [
        { field: 'deleted_at', operator: 'is', value: 'not_null' },
      ]);
      expect(compiled.sql).toContain('"deleted_at" is not null');
    });
  });

  describe('multiple filters', () => {
    it('chains as AND conditions', () => {
      const compiled = compileQuery(db, [
        { field: 'status', operator: 'eq', value: 'active' },
        { field: 'total', operator: 'gt', value: 100 },
        { field: 'deleted_at', operator: 'is', value: null },
      ]);
      expect(compiled.sql).toContain('"status" = $1');
      expect(compiled.sql).toContain('"total" > $2');
      expect(compiled.sql).toContain('"deleted_at" is null');
      expect(compiled.parameters).toEqual(['active', 100]);
    });
  });

  describe('no filters', () => {
    it('returns query unchanged for empty array', () => {
      const compiled = compileQuery(db, []);
      expect(compiled.sql).not.toContain('where');
    });
  });
});
