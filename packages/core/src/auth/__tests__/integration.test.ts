import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import { PermissionRegistry } from '../permission-registry.js';
import { createAuthHook } from '../session.js';
import { createModelPermissionGuard } from '../model-permissions.js';
import { createScopeHook, createScopeWriteGuard } from '../scopes.js';
import { ScopeRegistry } from '../scope-registry.js';
import { createFieldWriteGuard, createFieldStripHook } from '../field-permissions.js';
import { SchemaRegistry } from '../../schema/registry.js';
import type { ResolvedModel } from '../../schema/types.js';
import { hashPassword } from '../password.js';
import type { AppConfig } from '@rangka/shared';

const invoiceModel: ResolvedModel = {
  qualifiedName: 'sales.invoice',
  app: 'sales',
  name: 'invoice',
  auditLog: false,
  crud: true,
  traits: [],
  fields: [
    {
      name: 'id',
      config: { type: 'string', required: true } as any,
      provenance: { source: 'base' },
    },
    { name: 'total', config: { type: 'decimal' } as any, provenance: { source: 'base' } },
    { name: 'cost_price', config: { type: 'decimal' } as any, provenance: { source: 'base' } },
    { name: 'territory', config: { type: 'string' } as any, provenance: { source: 'base' } },
  ],
  indexes: [],
};

function createMockDb() {
  const users = [
    {
      id: 'u1',
      email: 'sales@test.com',
      full_name: 'Sales User',
      enabled: true,
      password_hash: hashPassword('pass'),
      territories: ['North', 'East'],
    },
  ];
  const roles = [{ id: 'r1', name: 'Sales User' }];
  const userRoles = [{ user_id: 'u1', role_id: 'r1' }];
  const sessions = [
    {
      id: 's1',
      token: 'test-token',
      user_id: 'u1',
      expires_at: new Date(Date.now() + 60000).toISOString(),
    },
  ];

  return {
    selectFrom(table: string) {
      const store =
        table === 'core.user'
          ? users
          : table === 'core.role'
            ? roles
            : table === 'core.user_role'
              ? userRoles
              : table === 'core.session'
                ? sessions
                : [];

      return {
        selectAll() {
          return this;
        },
        select(..._a: any[]) {
          return this;
        },
        where(field: string, op: string, value: any) {
          const filtered = (store as any[]).filter((r) => {
            if (op === '=') return r[field] === value;
            if (op === 'in') return value.includes(r[field]);
            return false;
          });
          return {
            executeTakeFirst: async () => filtered[0],
            execute: async () => filtered,
            where(f2: string, o2: string, v2: any) {
              const f = filtered.filter((r: any) => {
                if (o2 === '=') return r[f2] === v2;
                if (o2 === 'in') return v2.includes(r[f2]);
                return false;
              });
              return { executeTakeFirst: async () => f[0], execute: async () => f };
            },
          };
        },
        executeTakeFirst: async () => undefined,
        execute: async () => [],
      };
    },
  } as any;
}

describe('integration: auth + permissions + scopes + field stripping', () => {
  it('full pipeline works end-to-end', async () => {
    const permissionRegistry = new PermissionRegistry();
    permissionRegistry.registerRoles(
      {
        'Sales User': {
          label: 'Sales User',
          models: {
            'sales.invoice': {
              read: true,
              write: true,
              create: true,
              fieldPermissions: {
                cost_price: { read: false },
              },
            },
          },
        },
      },
      'sales',
    );

    const schemaRegistry = new SchemaRegistry([invoiceModel]);
    const db = createMockDb();

    const modules: AppConfig[] = [];
    const scopeRegistry = new ScopeRegistry(modules, schemaRegistry);

    const server = Fastify();
    const authHook = createAuthHook(db, permissionRegistry);
    const modelPermHook = createModelPermissionGuard(invoiceModel, permissionRegistry);
    const scopeCtx = { model: invoiceModel, scopeRegistry, db };
    const scopeHook = createScopeHook(scopeCtx);
    const scopeValidationHook = createScopeWriteGuard(scopeCtx);
    const fieldWriteHook = createFieldWriteGuard(invoiceModel);
    const fieldStripHook = createFieldStripHook(invoiceModel);

    server.get('/api/sales/invoice', {
      onRequest: authHook,
      preHandler: [modelPermHook, scopeHook, scopeValidationHook, fieldWriteHook],
      onSend: fieldStripHook as any,
      handler: async (request: any) => {
        const ctx = request.authContext;
        return {
          data: [{ id: '1', total: 100, cost_price: 50, territory: 'North' }],
          scopeFilters: ctx.scopeFilters,
        };
      },
    });

    // Successful authenticated + authorized request
    const res = await server.inject({
      method: 'GET',
      url: '/api/sales/invoice',
      headers: { authorization: 'Bearer test-token' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    // cost_price should be stripped
    expect(body.data[0].cost_price).toBeUndefined();
    expect(body.data[0].total).toBe(100);
    // scope filters should be present
    expect(body.scopeFilters).toHaveLength(0);
  });

  it('returns 401 without auth', async () => {
    const permissionRegistry = new PermissionRegistry();
    permissionRegistry.registerRoles({ X: { label: 'X', models: {} } }, 'app');
    const db = createMockDb();

    const server = Fastify();
    server.get('/test', {
      onRequest: createAuthHook(db, permissionRegistry),
      handler: async () => ({ ok: true }),
    });

    const res = await server.inject({ method: 'GET', url: '/test' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 403 without model permission', async () => {
    const permissionRegistry = new PermissionRegistry();
    permissionRegistry.registerRoles(
      {
        'Sales User': { label: 'Sales User', models: { 'other.model': { read: true } } },
      },
      'sales',
    );

    const db = createMockDb();
    const server = Fastify();

    server.get('/test', {
      onRequest: createAuthHook(db, permissionRegistry),
      preHandler: [createModelPermissionGuard(invoiceModel, permissionRegistry)],
      handler: async () => ({ ok: true }),
    });

    const res = await server.inject({
      method: 'GET',
      url: '/test',
      headers: { authorization: 'Bearer test-token' },
    });
    expect(res.statusCode).toBe(403);
  });
});
