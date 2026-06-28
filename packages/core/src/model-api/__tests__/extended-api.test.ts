import { describe, it, expect, vi } from 'vitest';
import { ModelQueryBuilder } from '../query-builder.js';
import type { SchemaRegistry } from '../../schema/registry.js';
import type { ResolvedModel } from '../../schema/types.js';
import type { RequestContext } from '../../auth/types.js';
import { KyselyModelOps } from '../../db/model-ops.js';

function makeModel(qualifiedName: string, traits: string[] = []): ResolvedModel {
  return {
    qualifiedName,
    app: 'test',
    name: qualifiedName.split('.')[1],
    auditLog: false,
    crud: true,
    traits,
    fields: [
      { name: 'id', config: { type: 'string' }, provenance: { source: 'base' } },
      { name: 'name', config: { type: 'string', required: true }, provenance: { source: 'base' } },
      { name: 'status', config: { type: 'string' }, provenance: { source: 'base' } },
      {
        name: 'created_by',
        config: { type: 'string' },
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

function makeMockDbAdapter(records: Record<string, unknown>[] = []): any {
  const buildQuery = () => {
    const q: any = {
      _wheres: [],
      _limit: undefined,
      _offset: undefined,
      _values: null,
      _set: null,
    };
    q.select = vi.fn((..._args: any[]) => {
      q._hasSelect = true;
      return q;
    });
    q.selectAll = vi.fn(() => q);
    q.where = vi.fn((field: string, op: string, value: any) => {
      q._wheres.push({ field, op, value });
      return q;
    });
    q.orderBy = vi.fn(() => q);
    q.limit = vi.fn((n: number) => {
      q._limit = n;
      return q;
    });
    q.offset = vi.fn((n: number) => {
      q._offset = n;
      return q;
    });
    q.execute = vi.fn(async () => {
      let data = [...records];
      for (const w of q._wheres) {
        if (w.op === '=') data = data.filter((r: any) => r[w.field] === w.value);
        if (w.op === 'is' && w.value === null) data = data.filter((r: any) => r[w.field] == null);
      }
      const offset = q._offset ?? 0;
      const limit = q._limit ?? data.length;
      return data.slice(offset, offset + limit);
    });
    q.executeTakeFirst = vi.fn(async () => {
      let data = [...records];
      for (const w of q._wheres) {
        if (w.op === '=') data = data.filter((r: any) => r[w.field] === w.value);
        if (w.op === 'is' && w.value === null) data = data.filter((r: any) => r[w.field] == null);
      }
      if (q._hasSelect && !q._selectAll) return { count: String(data.length) };
      return data[0] ?? undefined;
    });
    q.executeTakeFirstOrThrow = vi.fn(async () => {
      const result = await q.executeTakeFirst();
      if (!result) throw new Error('No result');
      return result;
    });
    q.values = vi.fn((v: any) => {
      q._values = v;
      return q;
    });
    q.set = vi.fn((v: any) => {
      q._set = v;
      return q;
    });
    q.returningAll = vi.fn(() => q);
    return q;
  };

  return {
    selectFrom: vi.fn(() => buildQuery()),
    insertInto: vi.fn(() => {
      const q = buildQuery();
      q.executeTakeFirstOrThrow = vi.fn(async () => ({ id: 'new-1', ...q._values }));
      return q;
    }),
    updateTable: vi.fn(() => {
      const q = buildQuery();
      q.executeTakeFirstOrThrow = vi.fn(async () => ({ id: 'up-1', ...q._set }));
      return q;
    }),
    deleteFrom: vi.fn(() => buildQuery()),
  };
}

describe('ModelQueryBuilder extended API', () => {
  const model = makeModel('sales.Order');
  const registry = makeRegistry([model]);

  function createBuilder(db: any, m: ResolvedModel = model, r: SchemaRegistry = registry) {
    const ops = new KyselyModelOps({ db, model: m, registry: r });
    return new ModelQueryBuilder(ops, m, r);
  }

  describe('page()', () => {
    it('sets page for execWithMeta', async () => {
      const records = Array.from({ length: 30 }, (_, i) => ({
        id: `r${i}`,
        name: `R${i}`,
        status: 'a',
      }));
      const db = makeMockDbAdapter(records);

      const result = await createBuilder(db).page(2).limit(10).execWithMeta();
      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(10);
    });
  });

  describe('includeArchived()', () => {
    it('includes archived records for soft_delete model', async () => {
      const softModel = makeModel('sales.Order', ['soft_delete']);
      const records = [
        { id: '1', name: 'Active', status: 'a', archived_at: null },
        { id: '2', name: 'Archived', status: 'a', archived_at: '2026-01-01' },
      ];
      const db = makeMockDbAdapter(records);
      const registry2 = makeRegistry([softModel]);

      const withArchived = await createBuilder(db, softModel, registry2).includeArchived().exec();

      const without = await createBuilder(db, softModel, registry2).exec();

      expect(withArchived.data).toHaveLength(2);
      expect(without.data).toHaveLength(1);
    });
  });

  describe('withAuth()', () => {
    it('applies scope filters from auth context', async () => {
      const records = [
        { id: '1', name: 'A', status: 'a', created_by: 'u1' },
        { id: '2', name: 'B', status: 'a', created_by: 'u2' },
      ];
      const db = makeMockDbAdapter(records);

      const auth: RequestContext = {
        scopeFilters: [{ field: 'created_by', operator: 'eq', value: 'u1' }],
      };

      const result = await createBuilder(db).withAuth(auth).exec();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].created_by).toBe('u1');
    });

    it('does not apply scopes when unscoped', async () => {
      const records = [
        { id: '1', name: 'A', status: 'a', created_by: 'u1' },
        { id: '2', name: 'B', status: 'a', created_by: 'u2' },
      ];
      const db = makeMockDbAdapter(records);

      const auth: RequestContext = {
        scopeFilters: [{ field: 'created_by', operator: 'eq', value: 'u1' }],
      };

      const result = await createBuilder(db).withAuth(auth).unscoped().exec();

      expect(result.data).toHaveLength(2);
    });
  });

  describe('filterRaw()', () => {
    it('accepts pre-translated filter tuples', async () => {
      const records = [
        { id: '1', name: 'Alpha', status: 'active' },
        { id: '2', name: 'Beta', status: 'draft' },
      ];
      const db = makeMockDbAdapter(records);

      const result = await createBuilder(db)
        .filterRaw([{ field: 'status', operator: 'eq', value: 'active' }])
        .exec();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Alpha');
    });
  });

  describe('execWithMeta()', () => {
    it('returns data with pagination metadata', async () => {
      const records = Array.from({ length: 50 }, (_, i) => ({
        id: `r${i}`,
        name: `R${i}`,
        status: 'a',
      }));
      const db = makeMockDbAdapter(records);

      const result = await createBuilder(db).limit(10).page(1).execWithMeta();

      expect(result.data).toHaveLength(10);
      expect(result.meta.total).toBe(50);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(5);
    });

    it('calculates totalPages correctly with remainder', async () => {
      const records = Array.from({ length: 7 }, (_, i) => ({
        id: `r${i}`,
        name: `R${i}`,
        status: 'a',
      }));
      const db = makeMockDbAdapter(records);

      const result = await createBuilder(db).limit(3).execWithMeta();

      expect(result.meta.totalPages).toBe(3);
    });
  });
});
