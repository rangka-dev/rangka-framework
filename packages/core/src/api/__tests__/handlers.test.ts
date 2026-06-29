import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServer } from '../server.js';
import { generateRoutes } from '../route-generator.js';
import type { SchemaRegistry } from '../../schema/registry.js';
import type { DatabaseClient } from '../../db/client.js';
import type { ResolvedModel } from '../../schema/types.js';

function makeModel(app: string, name: string): ResolvedModel {
  return {
    qualifiedName: `${app}.${name}`,
    app,
    name,
    auditLog: false,
    crud: true,
    traits: [],
    fields: [
      { name: 'id', config: { type: 'string' }, provenance: { source: 'base' } },
      { name: 'name', config: { type: 'string', required: true }, provenance: { source: 'base' } },
      {
        name: 'amount',
        config: { type: 'decimal', precision: 10, scale: 2 },
        provenance: { source: 'base' },
      },
    ],
    indexes: [],
  };
}

function makeSoftDeleteModel(module: string, name: string): ResolvedModel {
  return {
    ...makeModel(module, name),
    traits: ['soft_delete'],
    fields: [
      ...makeModel(module, name).fields,
      {
        name: 'archived_at',
        config: { type: 'datetime' },
        provenance: { source: 'trait', trait: 'soft_delete' },
      },
    ],
  };
}

function makeRegistry(models: ResolvedModel[]): SchemaRegistry {
  const modelMap = new Map<string, ResolvedModel>();
  for (const m of models) modelMap.set(m.qualifiedName, m);

  return {
    getModelsByModule: () => {
      const map = new Map<string, ResolvedModel[]>();
      for (const m of models) {
        const list = map.get(m.app) ?? [];
        list.push(m);
        map.set(m.app, list);
      }
      return map;
    },
    getRelationshipsForModel: () => [],
    getModel: (qn: string) => modelMap.get(qn),
    getAllModels: () => models,
    getFieldsForModel: (qn: string) => modelMap.get(qn)?.fields ?? [],
  } as unknown as SchemaRegistry;
}

function makeMockDb(): DatabaseClient {
  const records: Record<string, any[]> = {};

  function applyWhereFilters(data: any[], wheres: any[]): any[] {
    for (const w of wheres) {
      if (w.op === '=' && w.field !== 'id') {
        data = data.filter((r) => r[w.field] === w.value);
      } else if (w.op === 'is' && w.value === null) {
        data = data.filter((r) => r[w.field] == null);
      }
    }
    return data;
  }

  const buildQuery = (table: string) => {
    const q: any = {
      _table: table,
      _wheres: [] as any[],
      _selects: [] as string[],
      _selectAll: false,
      _offset: 0,
      _limit: 25,
    };
    q.select = vi.fn((...args: any[]) => {
      q._selects.push(...args);
      return q;
    });
    q.selectAll = vi.fn(() => {
      q._selectAll = true;
      return q;
    });
    q.where = vi.fn((field: string, op: string, value: any) => {
      q._wheres.push({ field, op, value });
      return q;
    });
    q.orderBy = vi.fn(() => q);
    q.offset = vi.fn((n: number) => {
      q._offset = n;
      return q;
    });
    q.limit = vi.fn((n: number) => {
      q._limit = n;
      return q;
    });
    q.execute = vi.fn(async () => {
      let data = records[table] ?? [];
      data = applyWhereFilters(data, q._wheres);
      return data.slice(q._offset, q._offset + q._limit);
    });
    q.executeTakeFirst = vi.fn(async () => {
      const idFilter = q._wheres.find((w: any) => w.field === 'id');
      if (idFilter) {
        let data = records[table] ?? [];
        data = applyWhereFilters(data, q._wheres);
        return data.find((r: any) => r.id === idFilter.value);
      }
      let data = records[table] ?? [];
      data = applyWhereFilters(data, q._wheres);
      return { count: String(data.length) };
    });
    q.executeTakeFirstOrThrow = vi.fn(async () => {
      const result = await q.executeTakeFirst();
      if (!result) throw new Error('No result');
      return result;
    });
    q.values = vi.fn((body: any) => {
      const rec = { id: 'new-id', ...body };
      if (!records[table]) records[table] = [];
      records[table].push(rec);
      return q;
    });
    q.set = vi.fn((body: any) => {
      const idFilter = q._wheres.find((w: any) => w.field === 'id');
      if (idFilter) {
        const data = records[table] ?? [];
        const idx = data.findIndex((r: any) => r.id === idFilter.value);
        if (idx >= 0) data[idx] = { ...data[idx], ...body };
      }
      return q;
    });
    q.returningAll = vi.fn(() => q);
    return q;
  };

  const db: any = {
    selectFrom: vi.fn((model: string) => buildQuery(model)),
    insertInto: vi.fn((model: string) => buildQuery(model)),
    updateTable: vi.fn((model: string) => buildQuery(model)),
    deleteFrom: vi.fn((model: string) => buildQuery(model)),
    kysely: { fn: { countAll: () => ({ as: (alias: string) => `count_${alias}` }) } },
    _records: records,
  };

  return db as unknown as DatabaseClient;
}

describe('CRUD handlers via route generation', () => {
  let server: Awaited<ReturnType<typeof createServer>>;
  let db: ReturnType<typeof makeMockDb>;
  let registry: ReturnType<typeof makeRegistry>;

  beforeEach(async () => {
    const models = [makeModel('sales', 'invoice')];
    registry = makeRegistry(models);
    db = makeMockDb();
    server = await createServer();
    generateRoutes(server, registry, db);
  });

  describe('GET /api/sales/invoice (list)', () => {
    it('returns paginated response', async () => {
      (db as any)._records['sales.invoice'] = [
        { id: '1', name: 'INV-001', amount: 100 },
        { id: '2', name: 'INV-002', amount: 200 },
      ];

      const res = await server.inject({ method: 'GET', url: '/api/sales/invoice' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toBeDefined();
      expect(body.meta).toBeDefined();
      expect(body.meta.page).toBe(1);
      expect(body.meta.limit).toBe(25);
    });

    it('returns empty result when search is provided but no fields are searchable', async () => {
      (db as any)._records['sales.invoice'] = [
        { id: '1', name: 'INV-001', amount: 100 },
        { id: '2', name: 'INV-002', amount: 200 },
      ];

      const res = await server.inject({
        method: 'GET',
        url: '/api/sales/invoice?search=test',
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toEqual([]);
      expect(body.meta.total).toBe(0);
    });

    it('returns 400 for invalid filter field', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/sales/invoice?filter[nonexistent][eq]=x',
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.error.code).toBe('QUERY_VALIDATION_ERROR');
    });
  });

  describe('GET /api/sales/invoice/:id (get)', () => {
    it('returns record when found', async () => {
      (db as any)._records['sales.invoice'] = [{ id: '1', name: 'INV-001', amount: 100 }];

      const res = await server.inject({ method: 'GET', url: '/api/sales/invoice/1' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.id).toBe('1');
    });

    it('returns 404 when not found', async () => {
      (db as any)._records['sales.invoice'] = [];

      const res = await server.inject({ method: 'GET', url: '/api/sales/invoice/missing' });
      expect(res.statusCode).toBe(404);
      const body = JSON.parse(res.body);
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/sales/invoice (create)', () => {
    it('creates record and returns 201', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/sales/invoice',
        headers: { 'content-type': 'application/json' },
        payload: JSON.stringify({ name: 'INV-003', amount: 500 }),
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.data).toBeDefined();
    });

    it('returns 400 for missing required field', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/sales/invoice',
        headers: { 'content-type': 'application/json' },
        payload: JSON.stringify({ amount: 500 }),
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.details).toContain('name');
    });

    it('returns 400 for empty body', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/sales/invoice',
        headers: { 'content-type': 'application/json' },
        payload: '',
      });
      expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('PUT /api/sales/invoice/:id (update)', () => {
    it('updates record when found', async () => {
      (db as any)._records['sales.invoice'] = [{ id: '1', name: 'INV-001', amount: 100 }];

      const res = await server.inject({
        method: 'PUT',
        url: '/api/sales/invoice/1',
        headers: { 'content-type': 'application/json' },
        payload: JSON.stringify({ amount: 999 }),
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toBeDefined();
    });

    it('returns 404 when record not found', async () => {
      (db as any)._records['sales.invoice'] = [];

      const res = await server.inject({
        method: 'PUT',
        url: '/api/sales/invoice/missing',
        headers: { 'content-type': 'application/json' },
        payload: JSON.stringify({ amount: 999 }),
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/sales/invoice/:id (delete)', () => {
    it('returns 204 when record exists', async () => {
      (db as any)._records['sales.invoice'] = [{ id: '1', name: 'INV-001', amount: 100 }];

      const res = await server.inject({ method: 'DELETE', url: '/api/sales/invoice/1' });
      expect(res.statusCode).toBe(204);
      expect(res.body).toBe('');
    });

    it('returns 404 when record not found', async () => {
      (db as any)._records['sales.invoice'] = [];

      const res = await server.inject({ method: 'DELETE', url: '/api/sales/invoice/missing' });
      expect(res.statusCode).toBe(404);
    });
  });
});

describe('Soft-delete behavior', () => {
  let server: Awaited<ReturnType<typeof createServer>>;
  let db: ReturnType<typeof makeMockDb>;
  let registry: ReturnType<typeof makeRegistry>;

  beforeEach(async () => {
    const models = [makeSoftDeleteModel('sales', 'invoice')];
    registry = makeRegistry(models);
    db = makeMockDb();
    server = await createServer();
    generateRoutes(server, registry, db);
  });

  describe('DELETE with soft_delete trait', () => {
    it('sets archived_at instead of deleting the record', async () => {
      (db as any)._records['sales.invoice'] = [
        { id: '1', name: 'INV-001', amount: 100, archived_at: null },
      ];

      const res = await server.inject({ method: 'DELETE', url: '/api/sales/invoice/1' });
      expect(res.statusCode).toBe(204);
      expect(db.updateTable).toHaveBeenCalledWith('sales.invoice');
      expect(db.deleteFrom).not.toHaveBeenCalled();
    });

    it('returns 404 for already-archived record', async () => {
      (db as any)._records['sales.invoice'] = [
        { id: '1', name: 'INV-001', amount: 100, archived_at: '2026-01-01T00:00:00.000Z' },
      ];

      const res = await server.inject({ method: 'DELETE', url: '/api/sales/invoice/1' });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET list with soft_delete trait', () => {
    it('excludes archived records by default', async () => {
      (db as any)._records['sales.invoice'] = [
        { id: '1', name: 'INV-001', amount: 100, archived_at: null },
        { id: '2', name: 'INV-002', amount: 200, archived_at: '2026-01-01T00:00:00.000Z' },
      ];

      const res = await server.inject({ method: 'GET', url: '/api/sales/invoice' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.every((r: any) => r.archived_at === null)).toBe(true);
    });

    it('includes archived records when includeArchived=true', async () => {
      (db as any)._records['sales.invoice'] = [
        { id: '1', name: 'INV-001', amount: 100, archived_at: null },
        { id: '2', name: 'INV-002', amount: 200, archived_at: '2026-01-01T00:00:00.000Z' },
      ];

      const res = await server.inject({
        method: 'GET',
        url: '/api/sales/invoice?includeArchived=true',
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toHaveLength(2);
    });
  });

  describe('GET by ID with soft_delete trait', () => {
    it('returns 404 for archived record', async () => {
      (db as any)._records['sales.invoice'] = [
        { id: '1', name: 'INV-001', amount: 100, archived_at: '2026-01-01T00:00:00.000Z' },
      ];

      const res = await server.inject({ method: 'GET', url: '/api/sales/invoice/1' });
      expect(res.statusCode).toBe(404);
    });

    it('returns active record normally', async () => {
      (db as any)._records['sales.invoice'] = [
        { id: '1', name: 'INV-001', amount: 100, archived_at: null },
      ];

      const res = await server.inject({ method: 'GET', url: '/api/sales/invoice/1' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.id).toBe('1');
    });
  });
});
