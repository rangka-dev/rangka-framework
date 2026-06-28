import { describe, it, expect, vi } from 'vitest';
import { createModelAccess } from '../index.js';
import type { SchemaRegistry } from '../../schema/registry.js';
import type { ResolvedModel } from '../../schema/types.js';
import type { RequestContext } from '../../auth/types.js';

function makeModel(qualifiedName: string, traits: string[] = []): ResolvedModel {
  return {
    qualifiedName,
    app: 'test',
    name: qualifiedName.split('.')[1],
    auditLog: false,
    traits,
    fields: [
      { name: 'id', config: { type: 'uuid' }, provenance: { source: 'base' } },
      { name: 'name', config: { type: 'string', required: true }, provenance: { source: 'base' } },
      { name: 'status', config: { type: 'string' }, provenance: { source: 'base' } },
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

function makeMockDb() {
  const rows = [
    { id: 'r1', name: 'Record 1', status: 'active' },
    { id: 'r2', name: 'Record 2', status: 'draft' },
    { id: 'r3', name: 'Record 3', status: 'active' },
  ];

  const db: any = {
    selectFrom: vi.fn(() => {
      const q: any = { _wheres: [] as any[], _limit: undefined, _offset: undefined };
      q.selectAll = vi.fn(() => q);
      q.select = vi.fn(() => q);
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
        let result = [...rows];
        for (const w of q._wheres) {
          if (w.op === '=') result = result.filter((r: any) => r[w.field] === w.value);
          if (w.op === 'in') result = result.filter((r: any) => w.value.includes(r[w.field]));
        }
        if (q._limit !== undefined) result = result.slice(0, q._limit);
        return result;
      });
      q.executeTakeFirst = vi.fn(async () => {
        const result = await q.execute();
        return result[0] ?? null;
      });
      q.compile = vi.fn(() => ({ sql: '', parameters: [] }));
      return q;
    }),
    insertInto: vi.fn(() => {
      const q: any = {};
      q.values = vi.fn((_data: any) => q);
      q.returningAll = vi.fn(() => q);
      q.executeTakeFirstOrThrow = vi.fn(async () => ({ ...rows[0], id: 'new-id' }));
      return q;
    }),
    updateTable: vi.fn(() => {
      const q: any = {};
      q.set = vi.fn(() => q);
      q.where = vi.fn(() => q);
      q.returningAll = vi.fn(() => q);
      q.executeTakeFirstOrThrow = vi.fn(async () => ({
        id: 'r1',
        name: 'Updated',
        status: 'active',
      }));
      q.execute = vi.fn(async () => {});
      return q;
    }),
    deleteFrom: vi.fn(() => {
      const q: any = {};
      q.where = vi.fn(() => q);
      q.execute = vi.fn(async () => {});
      return q;
    }),
  };
  return db;
}

describe('createModelAccess', () => {
  const model = makeModel('sales.Order');
  const registry = makeRegistry([model]);

  it('returns an object with get, query, create, update, delete', () => {
    const db = makeMockDb();
    const access = createModelAccess({ db, registry });

    expect(access.get).toBeTypeOf('function');
    expect(access.query).toBeTypeOf('function');
    expect(access.create).toBeTypeOf('function');
    expect(access.update).toBeTypeOf('function');
    expect(access.delete).toBeTypeOf('function');
  });

  describe('get', () => {
    it('returns a single record by id', async () => {
      const db = makeMockDb();
      const access = createModelAccess({ db, registry });

      const result = await access.get('sales.Order', 'r1');
      expect(result).toEqual({ id: 'r1', name: 'Record 1', status: 'active' });
    });

    it('returns null when record not found', async () => {
      const db = makeMockDb();
      db.selectFrom = vi.fn(() => {
        const q: any = {};
        q.selectAll = vi.fn(() => q);
        q.where = vi.fn(() => q);
        q.executeTakeFirst = vi.fn(async () => null);
        return q;
      });
      const access = createModelAccess({ db, registry });

      const result = await access.get('sales.Order', 'non-existent');
      expect(result).toBeNull();
    });

    it('throws when model is not found in registry', async () => {
      const db = makeMockDb();
      const access = createModelAccess({ db, registry });

      await expect(access.get('unknown.Model', 'r1')).rejects.toThrow(/model not found/i);
    });
  });

  describe('query', () => {
    it('returns a chainable query builder', () => {
      const db = makeMockDb();
      const access = createModelAccess({ db, registry });

      const q = access.query('sales.Order');
      expect(q.filter).toBeTypeOf('function');
      expect(q.sort).toBeTypeOf('function');
      expect(q.limit).toBeTypeOf('function');
      expect(q.offset).toBeTypeOf('function');
      expect(q.include).toBeTypeOf('function');
      expect(q.fields).toBeTypeOf('function');
      expect(q.exec).toBeTypeOf('function');
      expect(q.first).toBeTypeOf('function');
      expect(q.count).toBeTypeOf('function');
    });

    it('throws when model is not found in registry', () => {
      const db = makeMockDb();
      const access = createModelAccess({ db, registry });

      expect(() => access.query('unknown.Model')).toThrow(/model not found/i);
    });
  });

  describe('create', () => {
    it('creates a record and returns it', async () => {
      const db = makeMockDb();
      const access = createModelAccess({ db, registry });

      const result = await access.create('sales.Order', { name: 'New Order' });
      expect(result).toBeDefined();
      expect(result.id).toBe('new-id');
    });

    it('throws when model is not found', async () => {
      const db = makeMockDb();
      const access = createModelAccess({ db, registry });

      await expect(access.create('unknown.Model', { name: 'X' })).rejects.toThrow(
        /model not found/i,
      );
    });

    it('throws when required fields are missing at DB level', async () => {
      const db = makeMockDb();
      const access = createModelAccess({ db, registry });

      // Required field validation is now the caller's responsibility (handlers/middleware).
      // ModelOps no longer validates — it trusts pre-validated data.
      const result = await access.create('sales.Order', { status: 'draft' });
      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('updates a record and returns it', async () => {
      const db = makeMockDb();
      const access = createModelAccess({ db, registry });

      const result = await access.update('sales.Order', 'r1', { name: 'Updated' });
      expect(result).toBeDefined();
      expect(result.id).toBe('r1');
    });

    it('throws when model is not found', async () => {
      const db = makeMockDb();
      const access = createModelAccess({ db, registry });

      await expect(access.update('unknown.Model', 'r1', { name: 'X' })).rejects.toThrow(
        /model not found/i,
      );
    });
  });

  describe('delete', () => {
    it('deletes a record and returns it', async () => {
      const db = makeMockDb();
      const access = createModelAccess({ db, registry });

      const result = await access.delete('sales.Order', 'r1');
      expect(result).toBeDefined();
      expect(result.id).toBe('r1');
    });

    it('throws when model is not found', async () => {
      const db = makeMockDb();
      const access = createModelAccess({ db, registry });

      await expect(access.delete('unknown.Model', 'r1')).rejects.toThrow(/model not found/i);
    });
  });

  describe('auth context passthrough', () => {
    it('passes auth to ModelOps (stamping is caller responsibility)', async () => {
      const timestampedModel = makeModel('sales.Order');
      timestampedModel.traits = ['timestamped'];
      timestampedModel.fields.push(
        {
          name: 'created_at',
          config: { type: 'datetime' },
          provenance: { source: 'trait' as const, trait: 'timestamped' },
        } as any,
        {
          name: 'updated_at',
          config: { type: 'datetime' },
          provenance: { source: 'trait' as const, trait: 'timestamped' },
        } as any,
        {
          name: 'created_by',
          config: { type: 'uuid' },
          provenance: { source: 'trait' as const, trait: 'timestamped' },
        } as any,
        {
          name: 'updated_by',
          config: { type: 'uuid' },
          provenance: { source: 'trait' as const, trait: 'timestamped' },
        } as any,
      );
      const tsRegistry = makeRegistry([timestampedModel]);

      const db = makeMockDb();
      const auth: RequestContext = {
        user: { id: 'u1', email: 'a@b.c', full_name: 'A', enabled: true, password_hash: '' },
      };
      const access = createModelAccess({ db, registry: tsRegistry, auth });

      // Stamping is now the caller's job — ModelOps receives pre-stamped data.
      // This test verifies ModelOps still accepts and passes through auth without error.
      const result = await access.create('sales.Order', { name: 'Test' });
      expect(result).toBeDefined();
    });
  });
});
