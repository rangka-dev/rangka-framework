import { describe, it, expect } from 'vitest';
import {
  createModelPermissionGuard,
  isOwnerOnly,
  modelHasCreatedBy,
} from '../model-permissions.js';
import { PermissionRegistry } from '../permission-registry.js';
import { createTestServer } from '../../__tests__/helpers.js';
import type { ResolvedModel } from '../../schema/types.js';
import type { ResolvedPermissions } from '../types.js';

const mockModel: ResolvedModel = {
  qualifiedName: 'sales.customer',
  app: 'sales',
  module: 'sales',
  name: 'customer',
  auditLog: false,
  traits: [],
  fields: [],
  indexes: [],
};

const mockModelWithTimestamped: ResolvedModel = {
  qualifiedName: 'sales.order',
  app: 'sales',
  module: 'sales',
  name: 'order',
  auditLog: false,
  traits: ['timestamped'],
  fields: [
    { name: 'id', config: { type: 'string' }, provenance: { source: 'base' } },
    {
      name: 'created_by',
      config: { type: 'link', model: 'core.user' },
      provenance: { source: 'trait', trait: 'timestamped' },
    },
    {
      name: 'updated_by',
      config: { type: 'link', model: 'core.user' },
      provenance: { source: 'trait', trait: 'timestamped' },
    },
    {
      name: 'created_at',
      config: { type: 'datetime' },
      provenance: { source: 'trait', trait: 'timestamped' },
    },
    {
      name: 'updated_at',
      config: { type: 'datetime' },
      provenance: { source: 'trait', trait: 'timestamped' },
    },
  ] as ResolvedModel['fields'],
  indexes: [],
};

function setupServer(permissions: any) {
  const registry = new PermissionRegistry();
  const server = createTestServer();

  server.get('/test', {
    preHandler: createModelPermissionGuard(mockModel, registry),
    handler: async () => ({ ok: true }),
  });

  server.addHook('onRequest', async (request) => {
    (request as any).authContext = { permissions };
  });

  return server;
}

describe('model permission hook', () => {
  it('allows access when permission is granted', async () => {
    const server = setupServer({
      models: { 'sales.customer': { read: true } },
      scopes: [],
      version: 1,
    });

    const res = await server.inject({ method: 'GET', url: '/test' });
    expect(res.statusCode).toBe(200);
  });

  it('returns 403 when permission is not granted', async () => {
    const server = setupServer({
      models: { 'sales.customer': { write: true } },
      scopes: [],
      version: 1,
    });

    const res = await server.inject({ method: 'GET', url: '/test' });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.message).toContain('read');
    expect(res.json().error.message).toContain('sales.customer');
  });

  it('returns 403 when no permissions resolved', async () => {
    const server = setupServer(undefined);

    const res = await server.inject({ method: 'GET', url: '/test' });
    expect(res.statusCode).toBe(403);
  });

  it('checks create permission for POST', async () => {
    const registry = new PermissionRegistry();
    const server = createTestServer();

    server.post('/test', {
      preHandler: createModelPermissionGuard(mockModel, registry),
      handler: async () => ({ ok: true }),
    });

    server.addHook('onRequest', async (request) => {
      (request as any).authContext = {
        permissions: {
          models: { 'sales.customer': { read: true, write: true } },
          scopes: [],
          version: 1,
        },
      };
    });

    const res = await server.inject({ method: 'POST', url: '/test', payload: {} });
    expect(res.statusCode).toBe(403);
  });

  it('allows multi-role union: if one role grants access', async () => {
    const server = setupServer({
      models: { 'sales.customer': { read: true, write: true, delete: true } },
      scopes: [],
      version: 1,
    });

    const res = await server.inject({ method: 'GET', url: '/test' });
    expect(res.statusCode).toBe(200);
  });

  it('allows access through pre-handler when permission is own', async () => {
    const server = setupServer({
      models: { 'sales.customer': { read: 'own' } },
      scopes: [],
      version: 1,
    });

    const res = await server.inject({ method: 'GET', url: '/test' });
    expect(res.statusCode).toBe(200);
  });
});

describe('isOwnerOnly', () => {
  const permsWithOwn: ResolvedPermissions = {
    models: {
      'sales.order': { read: 'own', write: 'own', delete: 'own', create: true },
    },
    pages: [],
    version: 1,
  };

  const permsWithTrue: ResolvedPermissions = {
    models: {
      'sales.order': { read: true, write: true, delete: true, create: true },
    },
    pages: [],
    version: 1,
  };

  it('returns true when permission is own', () => {
    expect(isOwnerOnly(permsWithOwn, 'sales.order', 'read')).toBe(true);
    expect(isOwnerOnly(permsWithOwn, 'sales.order', 'write')).toBe(true);
    expect(isOwnerOnly(permsWithOwn, 'sales.order', 'delete')).toBe(true);
  });

  it('returns false when permission is true', () => {
    expect(isOwnerOnly(permsWithTrue, 'sales.order', 'read')).toBe(false);
    expect(isOwnerOnly(permsWithTrue, 'sales.order', 'write')).toBe(false);
    expect(isOwnerOnly(permsWithTrue, 'sales.order', 'delete')).toBe(false);
  });

  it('returns false when permissions are undefined', () => {
    expect(isOwnerOnly(undefined, 'sales.order', 'read')).toBe(false);
  });

  it('returns false when model has no permissions', () => {
    expect(isOwnerOnly(permsWithOwn, 'sales.unknown', 'read')).toBe(false);
  });

  it('returns false when action is unset', () => {
    const perms: ResolvedPermissions = {
      models: { 'sales.order': { read: 'own' } },
      pages: [],
      version: 1,
    };
    expect(isOwnerOnly(perms, 'sales.order', 'write')).toBe(false);
  });
});

describe('modelHasCreatedBy', () => {
  it('returns true when model has created_by field', () => {
    expect(modelHasCreatedBy(mockModelWithTimestamped)).toBe(true);
  });

  it('returns false when model lacks created_by field', () => {
    expect(modelHasCreatedBy(mockModel)).toBe(false);
  });
});
