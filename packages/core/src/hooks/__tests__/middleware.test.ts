import { describe, it, expect } from 'vitest';
import { createServer } from '../../api/server.js';
import { generateRoutes } from '../../api/route-generator.js';
import { HookRegistry } from '../registry.js';
import { ValidationError } from '../errors.js';
import type { SchemaRegistry } from '../../schema/registry.js';
import type { DatabaseClient } from '../../db/client.js';
import type { ResolvedModel } from '../../schema/types.js';

function makeModel(module: string, name: string, traits: string[] = []): ResolvedModel {
  return {
    qualifiedName: `${module}.${name}`,
    app: 'test',
    module,
    name,
    auditLog: false,
    traits,
    fields: [
      { name: 'id', config: { type: 'string' }, provenance: { source: 'base' } },
      { name: 'name', config: { type: 'string', required: true }, provenance: { source: 'base' } },
    ],
    indexes: [],
  };
}

function makeRegistry(models: ResolvedModel[]): SchemaRegistry {
  return {
    getModelsByModule: () => {
      const map = new Map<string, ResolvedModel[]>();
      for (const m of models) {
        const list = map.get(m.module) ?? [];
        list.push(m);
        map.set(m.module, list);
      }
      return map;
    },
    getRelationshipsForModel: () => [],
    getModel: (name: string) => models.find((m) => m.qualifiedName === name) ?? null,
  } as unknown as SchemaRegistry;
}

function makeMockDb(store: Record<string, any> = {}): DatabaseClient {
  const buildQuery = (op?: string) => {
    const q: any = { _where: null, _values: null, _set: null };
    q.select = () => q;
    q.selectAll = () => q;
    q.where = (_field: string, _op: string, val: any) => {
      q._where = val;
      return q;
    };
    q.orderBy = () => q;
    q.offset = () => q;
    q.limit = () => q;
    q.execute = async () => {
      return [];
    };
    q.executeTakeFirst = async () => {
      if (q._where && store[q._where]) return store[q._where];
      return { count: '0' };
    };
    q.executeTakeFirstOrThrow = async () => {
      if (op === 'insert') return { id: 'new-1', ...q._values };
      if (op === 'update') return { ...store[q._where], ...q._set };
      return {};
    };
    q.values = (v: any) => {
      q._values = v;
      return q;
    };
    q.set = (v: any) => {
      q._set = v;
      return q;
    };
    q.returningAll = () => q;
    return q;
  };

  const trxProxy: any = {
    selectFrom: () => buildQuery(),
    insertInto: () => buildQuery('insert'),
    updateTable: () => buildQuery('update'),
    deleteFrom: () => buildQuery('delete'),
  };

  return {
    selectFrom: () => buildQuery(),
    insertInto: () => buildQuery('insert'),
    updateTable: () => buildQuery('update'),
    deleteFrom: () => buildQuery('delete'),
    kysely: {
      fn: { countAll: () => ({ as: () => 'count' }) },
      transaction: () => ({
        execute: async (cb: (trx: any) => Promise<any>) => cb(trxProxy),
      }),
    },
  } as unknown as DatabaseClient;
}

describe('hooks middleware integration', () => {
  it('create with validation hook rejects invalid doc', async () => {
    const hookRegistry = new HookRegistry();
    hookRegistry.register(
      'sales.invoice',
      {
        validate: (doc) => {
          if (!doc.name) throw new ValidationError('name', 'Name is required');
        },
      },
      'sales',
    );

    const models = [makeModel('sales', 'invoice')];
    const server = await createServer();
    generateRoutes(server, makeRegistry(models), makeMockDb(), { hookRegistry });

    const res = await server.inject({
      method: 'POST',
      url: '/api/sales/invoice',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ name: '' }),
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details.field).toBe('name');
  });

  it('create succeeds when validation passes', async () => {
    const hookRegistry = new HookRegistry();
    hookRegistry.register(
      'sales.invoice',
      {
        validate: (doc) => {
          if (!doc.name) throw new ValidationError('name', 'Name is required');
        },
      },
      'sales',
    );

    const models = [makeModel('sales', 'invoice')];
    const server = await createServer();
    generateRoutes(server, makeRegistry(models), makeMockDb(), { hookRegistry });

    const res = await server.inject({
      method: 'POST',
      url: '/api/sales/invoice',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ name: 'INV-001' }),
    });

    expect(res.statusCode).toBe(201);
  });

  it('update with beforeUpdate modifies data', async () => {
    const hookRegistry = new HookRegistry();
    hookRegistry.register(
      'sales.invoice',
      {
        beforeUpdate: async (doc) => {
          doc.updated_flag = true;
        },
      },
      'sales',
    );

    const store: Record<string, any> = { '1': { id: '1', name: 'INV-001' } };
    const models = [makeModel('sales', 'invoice')];
    const server = await createServer();
    generateRoutes(server, makeRegistry(models), makeMockDb(store), { hookRegistry });

    const res = await server.inject({
      method: 'PUT',
      url: '/api/sales/invoice/1',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ name: 'INV-002' }),
    });

    expect(res.statusCode).toBe(200);
  });

  it('delete with afterDelete runs side effect', async () => {
    let sideEffectRan = false;
    const hookRegistry = new HookRegistry();
    hookRegistry.register(
      'sales.invoice',
      {
        afterDelete: async () => {
          sideEffectRan = true;
        },
      },
      'sales',
    );

    const store: Record<string, any> = { '1': { id: '1', name: 'INV-001' } };
    const models = [makeModel('sales', 'invoice')];
    const server = await createServer();
    generateRoutes(server, makeRegistry(models), makeMockDb(store), { hookRegistry });

    const res = await server.inject({
      method: 'DELETE',
      url: '/api/sales/invoice/1',
    });

    expect(res.statusCode).toBe(204);
    expect(sideEffectRan).toBe(true);
  });

  it('models without hooks use standard handlers', async () => {
    const hookRegistry = new HookRegistry();
    const models = [makeModel('sales', 'invoice')];
    const server = await createServer();
    generateRoutes(server, makeRegistry(models), makeMockDb(), { hookRegistry });

    const res = await server.inject({
      method: 'POST',
      url: '/api/sales/invoice',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ name: 'INV-001' }),
    });

    expect(res.statusCode).toBe(201);
  });
});
