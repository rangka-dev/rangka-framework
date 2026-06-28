import { describe, it, expect } from 'vitest';
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
    traits: [],
    fields: [{ name: 'id', config: { type: 'string' }, provenance: { source: 'base' } }],
    indexes: [],
  };
}

function makeRegistry(models: ResolvedModel[]): SchemaRegistry {
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
    getModel: (name: string) => models.find((m) => m.qualifiedName === name) ?? null,
  } as unknown as SchemaRegistry;
}

function makeMockDb(): DatabaseClient {
  const buildQuery = () => {
    const q: any = {};
    q.select = () => q;
    q.selectAll = () => q;
    q.where = () => q;
    q.orderBy = () => q;
    q.offset = () => q;
    q.limit = () => q;
    q.execute = async () => [];
    q.executeTakeFirst = async () => ({ count: '0' });
    q.executeTakeFirstOrThrow = async () => ({});
    q.values = () => q;
    q.set = () => q;
    q.returningAll = () => q;
    return q;
  };

  return {
    selectFrom: () => buildQuery(),
    insertInto: () => buildQuery(),
    updateTable: () => buildQuery(),
    deleteFrom: () => buildQuery(),
    kysely: { fn: { countAll: () => ({ as: () => 'count' }) } },
  } as unknown as DatabaseClient;
}

describe('generateRoutes', () => {
  it('registers all five CRUD routes per model', async () => {
    const models = [makeModel('sales', 'invoice')];
    const server = await createServer();
    generateRoutes(server, makeRegistry(models), makeMockDb());

    const list = await server.inject({ method: 'GET', url: '/api/sales/invoice' });
    expect(list.statusCode).toBe(200);
    const get = await server.inject({ method: 'GET', url: '/api/sales/invoice/1' });
    expect([200, 404]).toContain(get.statusCode);
    const post = await server.inject({
      method: 'POST',
      url: '/api/sales/invoice',
      headers: { 'content-type': 'application/json' },
      payload: '{}',
    });
    expect([201, 400]).toContain(post.statusCode);
    const put = await server.inject({
      method: 'PUT',
      url: '/api/sales/invoice/1',
      headers: { 'content-type': 'application/json' },
      payload: '{}',
    });
    expect([200, 404]).toContain(put.statusCode);
    const del = await server.inject({ method: 'DELETE', url: '/api/sales/invoice/1' });
    expect([204, 404]).toContain(del.statusCode);
  });

  it('registers routes for multiple models across modules', async () => {
    const models = [
      makeModel('sales', 'invoice'),
      makeModel('sales', 'customer'),
      makeModel('accounting', 'journal_entry'),
    ];
    const server = await createServer();
    generateRoutes(server, makeRegistry(models), makeMockDb());

    const r1 = await server.inject({ method: 'GET', url: '/api/sales/invoice' });
    expect(r1.statusCode).toBe(200);
    const r2 = await server.inject({ method: 'GET', url: '/api/sales/customer' });
    expect(r2.statusCode).toBe(200);
    const r3 = await server.inject({ method: 'GET', url: '/api/accounting/journal_entry' });
    expect(r3.statusCode).toBe(200);
  });

  it('uses correct URL pattern from qualified name', async () => {
    const models = [makeModel('hr', 'employee')];
    const server = await createServer();
    generateRoutes(server, makeRegistry(models), makeMockDb());

    const listRes = await server.inject({ method: 'GET', url: '/api/hr/employee' });
    expect(listRes.statusCode).toBe(200);

    const getRes = await server.inject({ method: 'GET', url: '/api/hr/employee/123' });
    expect([200, 404]).toContain(getRes.statusCode);
  });

  it('handles multi-word model names', async () => {
    const models = [makeModel('sales', 'invoice_item')];
    const server = await createServer();
    generateRoutes(server, makeRegistry(models), makeMockDb());

    const res = await server.inject({ method: 'GET', url: '/api/sales/invoice_item' });
    expect(res.statusCode).toBe(200);
  });

  it('registers no routes when registry is empty', async () => {
    const server = await createServer();
    generateRoutes(server, makeRegistry([]), makeMockDb());

    const res = await server.inject({ method: 'GET', url: '/api/anything' });
    expect(res.statusCode).toBe(404);
  });
});
