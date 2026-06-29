import { describe, it, expect } from 'vitest';
import { createServer } from '../server.js';
import { generateRoutes } from '../route-generator.js';
import type { SchemaRegistry } from '../../schema/registry.js';
import type { DatabaseClient } from '../../db/client.js';
import type { ResolvedModel } from '../../schema/types.js';

function makeModel(): ResolvedModel {
  return {
    qualifiedName: 'sales.customer',
    app: 'test',
    name: 'customer',
    label: 'Customer',
    auditLog: false,
    crud: true,
    traits: [],
    fields: [
      {
        name: 'name',
        config: { type: 'string', required: true, label: 'Customer Name' },
        provenance: { source: 'base' },
      },
      {
        name: 'email',
        config: { type: 'string', required: true, label: 'Email' },
        provenance: { source: 'base' },
      },
      {
        name: 'status',
        config: { type: 'enum', options: ['Active', 'Inactive'], label: 'Status' },
        provenance: { source: 'base' },
      },
      {
        name: 'balance',
        config: { type: 'decimal', label: 'Balance' },
        provenance: { source: 'base' },
      },
    ],
    indexes: [],
  };
}

function makeRegistry(): SchemaRegistry {
  const model = makeModel();
  return {
    getModelsByModule: () => new Map([['sales', [model]]]),
    getRelationshipsForModel: () => [],
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

describe('Swagger API Docs', () => {
  it('registers swagger and /api/docs/json returns valid OpenAPI document', async () => {
    const server = await createServer();
    generateRoutes(server, makeRegistry(), makeMockDb());
    await server.ready();

    const res = await server.inject({ method: 'GET', url: '/api/docs/json' });
    expect(res.statusCode).toBe(200);
    const spec = JSON.parse(res.body);
    expect(spec.openapi).toBe('3.1.0');
    expect(spec.info.title).toBe('Rangka API');
    expect(spec.paths).toBeDefined();
  });

  it('includes model fields in component schemas via route body', async () => {
    const server = await createServer();
    generateRoutes(server, makeRegistry(), makeMockDb());
    await server.ready();

    const res = await server.inject({ method: 'GET', url: '/api/docs/json' });
    const spec = JSON.parse(res.body);

    const postPath = spec.paths['/api/sales/customer'];
    expect(postPath).toBeDefined();
    expect(postPath.post).toBeDefined();

    const bodySchema = postPath.post.requestBody.content['application/json'].schema;
    expect(bodySchema.properties.name).toEqual({ type: 'string', description: 'Customer Name' });
    expect(bodySchema.properties.email).toEqual({ type: 'string', description: 'Email' });
    expect(bodySchema.properties.status).toEqual({
      type: 'string',
      enum: ['Active', 'Inactive'],
      description: 'Status',
    });
    expect(bodySchema.properties.balance).toEqual({ type: 'number', description: 'Balance' });
  });

  it('documents query parameters on list endpoints', async () => {
    const server = await createServer();
    generateRoutes(server, makeRegistry(), makeMockDb());
    await server.ready();

    const res = await server.inject({ method: 'GET', url: '/api/docs/json' });
    const spec = JSON.parse(res.body);

    const listPath = spec.paths['/api/sales/customer'];
    expect(listPath.get).toBeDefined();
    const params = listPath.get.parameters;
    const paramNames = params.map((p: any) => p.name);
    expect(paramNames).toContain('page');
    expect(paramNames).toContain('limit');
    expect(paramNames).toContain('sort');
    expect(paramNames).toContain('fields');
    expect(paramNames).toContain('include');
  });

  it('does not register docs when docs: false', async () => {
    const server = await createServer({ docs: false });
    generateRoutes(server, makeRegistry(), makeMockDb());
    await server.ready();

    const res = await server.inject({ method: 'GET', url: '/api/docs/json' });
    expect(res.statusCode).toBe(404);
  });

  it('serves Swagger UI HTML at /api/docs', async () => {
    const server = await createServer();
    generateRoutes(server, makeRegistry(), makeMockDb());
    await server.ready();

    const res = await server.inject({ method: 'GET', url: '/api/docs' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.body).toContain('swagger');
  });

  it('groups endpoints by module tag', async () => {
    const server = await createServer({ tags: [{ name: 'sales' }] });
    generateRoutes(server, makeRegistry(), makeMockDb());
    await server.ready();

    const res = await server.inject({ method: 'GET', url: '/api/docs/json' });
    const spec = JSON.parse(res.body);

    const listPath = spec.paths['/api/sales/customer'];
    expect(listPath.get.tags).toContain('sales');
    expect(listPath.post.tags).toContain('sales');
  });
});
