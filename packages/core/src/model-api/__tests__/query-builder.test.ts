import { describe, it, expect } from 'vitest';
import {
  Kysely,
  DummyDriver,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from 'kysely';
import { ModelQueryBuilder } from '../query-builder.js';
import type { SchemaRegistry } from '../../schema/registry.js';
import type { ResolvedModel } from '../../schema/types.js';
import { KyselyModelOps } from '../../db/model-ops.js';

function createTestDb(): Kysely<any> {
  return new Kysely<any>({
    dialect: {
      createAdapter: () => new PostgresAdapter(),
      createDriver: () => new DummyDriver(),
      createIntrospector: (db: any) => new PostgresIntrospector(db),
      createQueryCompiler: () => new PostgresQueryCompiler(),
    },
  });
}

function makeModel(qualifiedName: string, traits: string[] = []): ResolvedModel {
  return {
    qualifiedName,
    app: 'test',
    module: qualifiedName.split('.')[0],
    name: qualifiedName.split('.')[1],
    auditLog: false,
    traits,
    fields: [
      { name: 'id', config: { type: 'uuid' }, provenance: { source: 'base' } },
      { name: 'name', config: { type: 'string' }, provenance: { source: 'base' } },
      { name: 'status', config: { type: 'string' }, provenance: { source: 'base' } },
      { name: 'total', config: { type: 'money' }, provenance: { source: 'base' } },
      {
        name: 'created_at',
        config: { type: 'datetime' },
        provenance: { source: 'trait', trait: 'timestamped' },
      },
    ],
    indexes: [],
  } as ResolvedModel;
}

function makeRegistry(models: ResolvedModel[]): SchemaRegistry {
  return {
    getModel: (qn: string) => models.find((m) => m.qualifiedName === qn),
    getAllModels: () => models,
    getRelationshipsForModel: () => [],
    getFieldsForModel: (qn: string) => models.find((m) => m.qualifiedName === qn)?.fields ?? [],
  } as unknown as SchemaRegistry;
}

describe('ModelQueryBuilder', () => {
  const db = createTestDb();
  const model = makeModel('sales.Order');
  const registry = makeRegistry([model]);
  const ops = new KyselyModelOps({ db, model, registry });

  function createBuilder() {
    return new ModelQueryBuilder(ops, model, registry);
  }

  describe('compilation', () => {
    it('generates basic select all from table', () => {
      const builder = createBuilder();
      const compiled = builder.compile() as { sql: string; parameters: unknown[] };
      expect(compiled.sql).toContain('select * from "sales"."Order"');
    });

    it('applies filter', () => {
      const builder = createBuilder().filter({ status: 'active' });
      const compiled = builder.compile() as { sql: string; parameters: unknown[] };
      expect(compiled.sql).toContain('"status" = $1');
      expect(compiled.parameters).toContain('active');
    });

    it('applies multiple filters (chained)', () => {
      const builder = createBuilder()
        .filter({ status: 'active' })
        .filter({ total: { gt: 100 } });
      const compiled = builder.compile() as { sql: string; parameters: unknown[] };
      expect(compiled.sql).toContain('"status" = $1');
      expect(compiled.sql).toContain('"total" > $2');
    });

    it('applies sort ascending by default', () => {
      const builder = createBuilder().sort('name');
      const compiled = builder.compile() as { sql: string; parameters: unknown[] };
      expect(compiled.sql).toContain('order by "name" asc');
    });

    it('applies sort descending', () => {
      const builder = createBuilder().sort('created_at', 'desc');
      const compiled = builder.compile() as { sql: string; parameters: unknown[] };
      expect(compiled.sql).toContain('order by "created_at" desc');
    });

    it('applies multiple sorts in order', () => {
      const builder = createBuilder().sort('status', 'asc').sort('created_at', 'desc');
      const compiled = builder.compile() as { sql: string; parameters: unknown[] };
      expect(compiled.sql).toContain('order by "status" asc, "created_at" desc');
    });

    it('applies limit', () => {
      const builder = createBuilder().limit(10);
      const compiled = builder.compile() as { sql: string; parameters: unknown[] };
      expect(compiled.sql).toContain('limit $1');
      expect(compiled.parameters).toContain(10);
    });

    it('applies offset', () => {
      const builder = createBuilder().offset(20);
      const compiled = builder.compile() as { sql: string; parameters: unknown[] };
      expect(compiled.sql).toContain('offset $1');
      expect(compiled.parameters).toContain(20);
    });

    it('applies limit and offset together', () => {
      const builder = createBuilder().limit(10).offset(20);
      const compiled = builder.compile() as { sql: string; parameters: unknown[] };
      expect(compiled.sql).toContain('limit $1');
      expect(compiled.sql).toContain('offset $2');
    });

    it('applies field selection', () => {
      const builder = createBuilder().fields(['id', 'name', 'status']);
      const compiled = builder.compile() as { sql: string; parameters: unknown[] };
      expect(compiled.sql).toContain('"id"');
      expect(compiled.sql).toContain('"name"');
      expect(compiled.sql).toContain('"status"');
      expect(compiled.sql).not.toContain('*');
    });
  });

  describe('chaining order independence', () => {
    it('produces same SQL regardless of method order', () => {
      const a = createBuilder()
        .filter({ status: 'active' })
        .sort('name')
        .limit(10)
        .offset(5)
        .compile() as { sql: string };

      const b = createBuilder()
        .limit(10)
        .offset(5)
        .sort('name')
        .filter({ status: 'active' })
        .compile() as { sql: string };

      expect(a.sql).toBe(b.sql);
    });
  });

  describe('count compilation', () => {
    it('generates count query', () => {
      const builder = createBuilder().filter({ status: 'active' });
      const compiled = builder.compileCount() as { sql: string; parameters: unknown[] };
      expect(compiled.sql).toContain('count(*)');
      expect(compiled.sql).toContain('"status" = $1');
      expect(compiled.sql).not.toContain('limit');
      expect(compiled.sql).not.toContain('offset');
      expect(compiled.sql).not.toContain('order by');
    });
  });

  describe('immutability', () => {
    it('each chain call returns a new instance', () => {
      const base = createBuilder();
      const filtered = base.filter({ status: 'active' });
      const sorted = base.sort('name');

      expect(filtered).not.toBe(base);
      expect(sorted).not.toBe(base);
      expect(filtered).not.toBe(sorted);

      const filteredSql = (filtered.compile() as { sql: string }).sql;
      const sortedSql = (sorted.compile() as { sql: string }).sql;
      expect(filteredSql).toContain('"status"');
      expect(filteredSql).not.toContain('order by');
      expect(sortedSql).toContain('order by');
      expect(sortedSql).not.toContain('"status"');
    });
  });

  describe('unscoped', () => {
    it('sets unscoped flag', () => {
      const builder = createBuilder().unscoped();
      expect(builder.isUnscoped()).toBe(true);
    });

    it('defaults to scoped', () => {
      const builder = createBuilder();
      expect(builder.isUnscoped()).toBe(false);
    });
  });

  describe('include', () => {
    it('stores include relations', () => {
      const builder = createBuilder().include('customer').include('lineItems');
      expect(builder.getIncludes()).toEqual(['customer', 'lineItems']);
    });

    it('deduplicates includes', () => {
      const builder = createBuilder().include('customer').include('customer');
      expect(builder.getIncludes()).toEqual(['customer']);
    });
  });

  describe('soft_delete model', () => {
    it('adds archived_at IS NULL filter by default', () => {
      const softModel = makeModel('sales.Order', ['soft_delete']);
      const softRegistry = makeRegistry([softModel]);
      const softOps = new KyselyModelOps({ db, model: softModel, registry: softRegistry });
      const builder = new ModelQueryBuilder(softOps, softModel, softRegistry);
      const compiled = builder.compile() as { sql: string };
      expect(compiled.sql).toContain('"archived_at" is null');
    });
  });
});
