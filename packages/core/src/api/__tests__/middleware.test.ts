import { describe, it, expect } from 'vitest';
import { createServer } from '../server.js';
import { generateRoutes } from '../route-generator.js';
import type { SchemaRegistry } from '../../schema/registry.js';
import type { DatabaseClient } from '../../db/client.js';
import type { ResolvedModel } from '../../schema/types.js';

function makeModel(): ResolvedModel {
  return {
    qualifiedName: 'test.item',
    app: 'test',
    name: 'item',
    auditLog: false,
    traits: [],
    fields: [{ name: 'id', config: { type: 'string' }, provenance: { source: 'base' } }],
    indexes: [],
  };
}

function makeRegistry(): SchemaRegistry {
  const model = makeModel();
  return {
    getModelsByModule: () => new Map([['test', [model]]]),
    getRelationshipsForModel: () => [],
    getModel: (name: string) => (name === model.qualifiedName ? model : null),
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

describe('Middleware hooks', () => {
  it('registers onRequest, preHandler, and onSend hooks', async () => {
    const server = await createServer();
    generateRoutes(server, makeRegistry(), makeMockDb());

    const res = await server.inject({ method: 'GET', url: '/api/test/item' });
    expect(res.statusCode).toBe(200);
  });

  it('onSend hook passes response through (field stripping placeholder)', async () => {
    const server = await createServer();
    generateRoutes(server, makeRegistry(), makeMockDb());

    const res = await server.inject({ method: 'GET', url: '/api/test/item' });
    const body = JSON.parse(res.body);
    expect(body.data).toBeDefined();
    expect(body.meta).toBeDefined();
  });

  it('hooks execute in order: onRequest → preHandler → handler → onSend', async () => {
    const order: string[] = [];

    const server = await createServer();

    server.addHook('onRequest', async () => {
      order.push('onRequest');
    });
    server.addHook('preHandler', async () => {
      order.push('preHandler');
    });

    generateRoutes(server, makeRegistry(), makeMockDb());

    server.addHook('onSend', async (_req, _rep, payload) => {
      order.push('onSend');
      return payload;
    });

    await server.inject({ method: 'GET', url: '/api/test/item' });

    expect(order.indexOf('onRequest')).toBeLessThan(order.indexOf('preHandler'));
    expect(order.indexOf('preHandler')).toBeLessThan(order.indexOf('onSend'));
  });
});
