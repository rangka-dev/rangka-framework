import { describe, it, expect, vi } from 'vitest';
import { boot } from '../src/boot/index.js';
import { MemoryDiscoverySource } from '../src/boot/discovery.js';
import type { DiscoveredApp, RangkaPackageInfo } from '../src/boot/types.js';
import { field } from '@rangka/shared';

vi.mock('../src/db/client.js', () => {
  const mockUser = {
    id: 'u1',
    email: 'admin@test.com',
    full_name: 'Admin',
    enabled: true,
    password_hash: 'hashed',
  };
  const mockSession = {
    id: 's1',
    token: 'test-token',
    user_id: 'u1',
    expires_at: new Date(Date.now() + 60000).toISOString(),
  };
  const mockRole = { id: 'r1', name: 'Administrator' };
  const mockUserRole = { user_id: 'u1', role_id: 'r1' };

  return {
    DatabaseClient: class MockDatabaseClient {
      kysely = { fn: { countAll: () => ({ as: () => 'count' }) } };
      async verifyConnection() {}
      selectFrom(table: string) {
        const q: any = {};
        q.select = () => q;
        q.selectAll = () => q;
        q.where = (field: string, _op: string, value: any) => {
          q._filter = { field, value };
          return q;
        };
        q.orderBy = () => q;
        q.offset = () => q;
        q.limit = () => q;
        q.values = () => q;
        q.set = () => q;
        q.returningAll = () => q;
        q.execute = async () => {
          if (table === 'core.user_role' && q._filter?.value === 'u1') return [mockUserRole];
          if (table === 'core.role') return [mockRole];
          return [];
        };
        q.executeTakeFirst = async () => {
          if (table === 'core.session' && q._filter?.value === 'test-token') return mockSession;
          if (table === 'core.user' && q._filter?.value === 'u1') return mockUser;
          return { count: '0' };
        };
        q.executeTakeFirstOrThrow = async () => ({});
        return q;
      }
      insertInto() {
        return this.selectFrom('');
      }
      updateTable() {
        return this.selectFrom('');
      }
      deleteFrom() {
        return this.selectFrom('');
      }
    },
  };
});

vi.mock('../src/db/auto-sync.js', () => ({
  autoSync: vi.fn(async () => {}),
}));

function makeDiscoveredApp(
  name: string,
  deps: string[],
  schemas: DiscoveredApp['schemas'] = [],
  extensions: DiscoveredApp['extensions'] = [],
): DiscoveredApp {
  return {
    packageInfo: {
      packageName: `@rangka/${name}`,
      path: `/fake/${name}`,
      rangka: { type: 'app', entrypoint: './module.ts' },
    },
    config: { name, label: name, depends: deps },
    schemas,
    extensions,
  };
}

describe('boot', () => {
  it('orchestrates full pipeline: discovery → sort → load → merge → registry', async () => {
    const packages: RangkaPackageInfo[] = [
      {
        packageName: '@rangka/core',
        path: '/fake/core',
        rangka: { type: 'app', entrypoint: './app.ts' },
      },
      {
        packageName: '@rangka/sales',
        path: '/fake/sales',
        rangka: { type: 'app', entrypoint: './app.ts' },
      },
      {
        packageName: '@rangka/project',
        path: '/fake/project',
        rangka: { type: 'app', entrypoint: './app.ts' },
      },
    ];

    const apps: DiscoveredApp[] = [
      makeDiscoveredApp(
        'core',
        [],
        [
          {
            app: 'auth',
            schema: { name: 'user', fields: { email: field.string({ required: true }) } },
          },
        ],
      ),
      makeDiscoveredApp(
        'sales',
        ['core'],
        [
          {
            app: 'sales',
            schema: {
              name: 'customer',
              label: 'Customer',
              fields: { name: field.string({ required: true }), email: field.string() },
              traits: ['timestamped'],
            },
          },
          {
            app: 'sales',
            schema: {
              name: 'invoice',
              label: 'Sales Invoice',
              fields: {
                customer: field.link('customer'),
                total: field.decimal(),
              },
              traits: ['timestamped'],
            },
          },
        ],
      ),
      makeDiscoveredApp(
        'project',
        ['sales'],
        [
          {
            app: 'custom',
            schema: { name: 'task', fields: { title: field.string() } },
          },
        ],
        [
          {
            target: 'sales.customer',
            config: { fields: { loyalty_points: field.int({ default: 0 }) } },
          },
        ],
      ),
    ];

    const { registry } = await boot({
      discoverySource: new MemoryDiscoverySource(packages),
      apps,
    });

    expect(registry.getAllModels().length).toBeGreaterThanOrEqual(4);

    const customer = registry.getModel('sales.customer');
    expect(customer).toBeDefined();
    expect(customer!.label).toBe('Customer');

    const customerFields = registry.getFieldsForModel('sales.customer');
    const fieldNames = customerFields.map((f) => f.name);
    expect(fieldNames).toContain('name');
    expect(fieldNames).toContain('email');
    expect(fieldNames).toContain('created_at');
    expect(fieldNames).toContain('loyalty_points');

    const loyaltyField = customerFields.find((f) => f.name === 'loyalty_points')!;
    expect(loyaltyField.provenance).toEqual({ source: 'extension', app: 'project' });

    const invoice = registry.getModel('sales.invoice');
    expect(invoice).toBeDefined();
    const invoiceFieldNames = invoice!.fields.map((f) => f.name);
    expect(invoiceFieldNames).toContain('created_at');
    expect(invoiceFieldNames).toContain('customer');

    const rels = registry.getRelationshipsForModel('sales.invoice');
    const customerRel = rels.find((r) => r.field === 'customer');
    expect(customerRel).toBeDefined();
    expect(customerRel!.type).toBe('link');
    expect(customerRel!.to).toBe('sales.customer');

    const extSources = registry.getExtensionSources('sales.customer');
    expect(extSources).toHaveLength(1);
    expect(extSources[0].app).toBe('project');
    expect(extSources[0].fields).toContain('loyalty_points');
  });

  it('resolves traits before extensions can reference them', async () => {
    const apps: DiscoveredApp[] = [
      makeDiscoveredApp('core', [], []),
      makeDiscoveredApp(
        'sales',
        ['core'],
        [
          {
            app: 'sales',
            schema: {
              name: 'order',
              fields: { total: field.decimal() },
              traits: ['timestamped'],
            },
          },
        ],
      ),
    ];

    const { registry } = await boot({
      discoverySource: new MemoryDiscoverySource([]),
      apps,
    });

    const order = registry.getModel('sales.order')!;
    const createdAtField = order.fields.find((f) => f.name === 'created_at');
    expect(createdAtField).toBeDefined();
    expect(createdAtField!.provenance.source).toBe('trait');
  });

  it('boot with server config generates accessible routes', async () => {
    const apps: DiscoveredApp[] = [
      makeDiscoveredApp(
        'core',
        [],
        [
          {
            app: 'crm',
            schema: {
              name: 'contact',
              fields: { name: field.string({ required: true }), email: field.string() },
            },
          },
        ],
      ),
    ];

    const { registry, server } = await boot({
      discoverySource: new MemoryDiscoverySource([]),
      apps,
      database: { host: 'localhost', database: 'test', user: 'test', password: 'test' },
      server: { port: 3000 },
    });

    expect(server).toBeDefined();
    expect(registry.getModel('crm.contact')).toBeDefined();

    const listRes = await server!.inject({
      method: 'GET',
      url: '/api/crm/contact',
      headers: { authorization: 'Bearer test-token' },
    });
    expect(listRes.statusCode).toBe(200);

    const getRes = await server!.inject({
      method: 'GET',
      url: '/api/crm/contact/1',
      headers: { authorization: 'Bearer test-token' },
    });
    expect([200, 404]).toContain(getRes.statusCode);

    const postRes = await server!.inject({
      method: 'POST',
      url: '/api/crm/contact',
      headers: { 'content-type': 'application/json', authorization: 'Bearer test-token' },
      payload: JSON.stringify({ name: 'Test' }),
    });
    expect([201, 400, 500]).toContain(postRes.statusCode);
  });

  it('boot registers custom apiDefinitions on the server', async () => {
    const apps: DiscoveredApp[] = [
      {
        ...makeDiscoveredApp(
          'core',
          [],
          [
            {
              app: 'crm',
              schema: { name: 'lead', fields: { name: field.string() } },
            },
          ],
        ),
        apiDefinitions: [
          {
            method: 'GET' as const,
            path: '/api/custom/stats',
            handler: async (_request: any, reply: any) => {
              return reply.send({ count: 42 });
            },
          },
        ],
      },
    ];

    const { server } = await boot({
      discoverySource: new MemoryDiscoverySource([]),
      apps,
      database: { host: 'localhost', database: 'test', user: 'test', password: 'test' },
      server: { port: 3001 },
    });

    expect(server).toBeDefined();
    const res = await server!.inject({ method: 'GET', url: '/api/custom/stats' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.count).toBe(42);
  });
});
