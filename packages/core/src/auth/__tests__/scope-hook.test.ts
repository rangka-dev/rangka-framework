import { describe, it, expect, vi } from 'vitest';
import { createScopeHook, createScopeWriteGuard } from '../scopes.js';
import type { FilterProvider } from '../scopes.js';
import { ScopeRegistry } from '../scope-registry.js';
import { SchemaRegistry } from '../../schema/registry.js';
import type { ResolvedModel } from '../../schema/types.js';
import type { AppConfig } from '@rangka/shared';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../../errors.js';

function makeModel(overrides: Partial<ResolvedModel> & { qualifiedName: string }): ResolvedModel {
  return {
    app: overrides.app ?? 'test',
    name: overrides.qualifiedName.split('.')[1],
    auditLog: false,
    crud: true,
    traits: [],
    fields: [],
    indexes: [],
    ...overrides,
  };
}

function linkField(name: string, model: string) {
  return {
    name,
    config: { type: 'link' as const, model },
    provenance: { source: 'base' as const },
  };
}

function createMockDb(existingIds: string[] = []) {
  return {
    selectFrom: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        selectAll: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockImplementation(async () => {
            return existingIds.length > 0 ? { id: existingIds[0] } : undefined;
          }),
        }),
      }),
    }),
  } as any;
}

function createMockRequest(options: {
  headers?: Record<string, string>;
  method?: string;
  body?: Record<string, unknown>;
  authContext?: Record<string, unknown>;
}): FastifyRequest {
  const req = {
    headers: options.headers ?? {},
    method: options.method ?? 'GET',
    body: options.body,
    authContext: options.authContext ?? {
      user: {
        id: 'user-1',
        email: 'test@test.com',
        full_name: 'Test',
        enabled: true,
        password_hash: '',
      },
      permissions: { models: {}, pages: [], version: 1 },
      roles: ['admin'],
    },
  } as any;
  return req;
}

function createMockReply() {
  const reply: any = {
    statusCode: 200,
    body: null,
    status: vi.fn().mockImplementation((code: number) => {
      reply.statusCode = code;
      return reply;
    }),
    send: vi.fn().mockImplementation((body: unknown) => {
      reply.body = body;
      return reply;
    }),
  };
  return reply as FastifyReply & { statusCode: number; body: any };
}

function buildScopeContext() {
  const modules: AppConfig[] = [
    {
      name: 'core',
      label: 'Core',
      scopes: {
        company: { model: 'core.company', default: 'user.default_company', switchable: true },
      },
    },
  ];
  const companyModel = makeModel({ qualifiedName: 'core.company', app: 'core' });
  const invoiceModel = makeModel({
    qualifiedName: 'sales.invoice',
    app: 'sales',
    scope: 'company',
    fields: [linkField('company', 'core.company')],
  });
  const unscopedModel = makeModel({
    qualifiedName: 'sales.customer',
    app: 'sales',
    fields: [],
  });
  const schemaRegistry = new SchemaRegistry([companyModel, invoiceModel, unscopedModel]);
  const scopeRegistry = new ScopeRegistry(modules, schemaRegistry);
  return { scopeRegistry, invoiceModel, unscopedModel, schemaRegistry };
}

describe('createScopeHook', () => {
  it('attaches scope filter from X-Active-Scope header', async () => {
    const { scopeRegistry, invoiceModel } = buildScopeContext();
    const db = createMockDb(['company-1']);

    const hook = createScopeHook({ model: invoiceModel, scopeRegistry, db });
    const request = createMockRequest({
      headers: { 'x-active-scope': JSON.stringify({ company: 'company-1' }) },
    });
    const reply = createMockReply();

    await hook(request, reply);

    const authCtx = (request as any).authContext;
    expect(authCtx.scopeFilters).toEqual([
      { field: 'company', operator: 'eq', value: 'company-1' },
    ]);
  });

  it('falls back to user default field when header is missing', async () => {
    const { scopeRegistry, invoiceModel } = buildScopeContext();
    const db = createMockDb(['company-default']);

    const hook = createScopeHook({ model: invoiceModel, scopeRegistry, db });
    const request = createMockRequest({
      authContext: {
        user: {
          id: 'user-1',
          email: 'test@test.com',
          full_name: 'Test',
          enabled: true,
          password_hash: '',
          default_company: 'company-default',
        },
        permissions: { models: {}, pages: [], version: 1 },
        roles: ['admin'],
      },
    });
    const reply = createMockReply();

    await hook(request, reply);

    const authCtx = (request as any).authContext;
    expect(authCtx.scopeFilters).toEqual([
      { field: 'company', operator: 'eq', value: 'company-default' },
    ]);
  });

  it('returns 400 when no scope value available', async () => {
    const { scopeRegistry, invoiceModel } = buildScopeContext();
    const db = createMockDb([]);

    const hook = createScopeHook({ model: invoiceModel, scopeRegistry, db });
    const request = createMockRequest({ headers: {} });
    const reply = createMockReply();

    const error = await hook(request, reply).catch((e) => e);

    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('MISSING_SCOPE');
  });

  it('returns 400 when scope value does not exist in DB', async () => {
    const { scopeRegistry, invoiceModel } = buildScopeContext();
    const db = createMockDb([]);

    const hook = createScopeHook({ model: invoiceModel, scopeRegistry, db });
    const request = createMockRequest({
      headers: { 'x-active-scope': JSON.stringify({ company: 'nonexistent' }) },
    });
    const reply = createMockReply();

    const error = await hook(request, reply).catch((e) => e);

    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('INVALID_SCOPE');
  });

  it('skips scope filtering for unscoped models', async () => {
    const { scopeRegistry, unscopedModel } = buildScopeContext();
    const db = createMockDb([]);

    const hook = createScopeHook({ model: unscopedModel, scopeRegistry, db });
    const request = createMockRequest({});
    const reply = createMockReply();

    await hook(request, reply);

    const authCtx = (request as any).authContext;
    expect(authCtx.scopeFilters).toEqual([]);
  });

  it('skips when no auth context', async () => {
    const { scopeRegistry, invoiceModel } = buildScopeContext();
    const db = createMockDb([]);

    const hook = createScopeHook({ model: invoiceModel, scopeRegistry, db });
    const request = createMockRequest({ authContext: {} });
    const reply = createMockReply();

    await hook(request, reply);

    expect(reply.status).not.toHaveBeenCalled();
  });

  it('header takes precedence over user default', async () => {
    const { scopeRegistry, invoiceModel } = buildScopeContext();
    const db = createMockDb(['from-header']);

    const hook = createScopeHook({ model: invoiceModel, scopeRegistry, db });
    const request = createMockRequest({
      headers: { 'x-active-scope': JSON.stringify({ company: 'from-header' }) },
      authContext: {
        user: {
          id: 'user-1',
          email: 'test@test.com',
          full_name: 'Test',
          enabled: true,
          password_hash: '',
          default_company: 'from-user',
        },
        permissions: { models: {}, pages: [], version: 1 },
        roles: ['admin'],
      },
    });
    const reply = createMockReply();

    await hook(request, reply);

    const authCtx = (request as any).authContext;
    expect(authCtx.scopeFilters).toEqual([
      { field: 'company', operator: 'eq', value: 'from-header' },
    ]);
  });

  it('appends filters from filter providers', async () => {
    const { scopeRegistry, invoiceModel } = buildScopeContext();
    const db = createMockDb(['company-1']);

    const territoryProvider: FilterProvider = (_model, authCtx, _request) => {
      const territory = (authCtx.user as any)?.territory;
      if (territory) {
        return [{ field: 'territory', operator: 'eq', value: territory }];
      }
      return [];
    };

    const hook = createScopeHook({
      model: invoiceModel,
      scopeRegistry,
      db,
      filterProviders: [territoryProvider],
    });
    const request = createMockRequest({
      headers: { 'x-active-scope': JSON.stringify({ company: 'company-1' }) },
      authContext: {
        user: {
          id: 'user-1',
          email: 'test@test.com',
          full_name: 'Test',
          enabled: true,
          password_hash: '',
          territory: 'North',
        },
        permissions: { models: {}, pages: [], version: 1 },
        roles: ['admin'],
      },
    });
    const reply = createMockReply();

    await hook(request, reply);

    const authCtx = (request as any).authContext;
    expect(authCtx.scopeFilters).toEqual([
      { field: 'company', operator: 'eq', value: 'company-1' },
      { field: 'territory', operator: 'eq', value: 'North' },
    ]);
  });

  it('filter providers run even on unscoped models', async () => {
    const { scopeRegistry, unscopedModel } = buildScopeContext();
    const db = createMockDb([]);

    const staticProvider: FilterProvider = () => [{ field: 'active', operator: 'eq', value: true }];

    const hook = createScopeHook({
      model: unscopedModel,
      scopeRegistry,
      db,
      filterProviders: [staticProvider],
    });
    const request = createMockRequest({});
    const reply = createMockReply();

    await hook(request, reply);

    const authCtx = (request as any).authContext;
    expect(authCtx.scopeFilters).toEqual([{ field: 'active', operator: 'eq', value: true }]);
  });
});

describe('createScopeWriteGuard', () => {
  it('auto-stamps scope value on POST when body is missing scope field', async () => {
    const { scopeRegistry, invoiceModel } = buildScopeContext();
    const db = createMockDb([]);
    const body: Record<string, unknown> = { total: 100 };

    const guard = createScopeWriteGuard({ model: invoiceModel, scopeRegistry, db });
    const request = createMockRequest({
      method: 'POST',
      body,
      authContext: {
        user: {
          id: 'user-1',
          email: 'test@test.com',
          full_name: 'Test',
          enabled: true,
          password_hash: '',
        },
        permissions: { models: {}, pages: [], version: 1 },
        roles: ['admin'],
        scopeFilters: [{ field: 'company', operator: 'eq', value: 'company-1' }],
      },
    });
    const reply = createMockReply();

    await guard(request, reply);

    expect(body.company).toBe('company-1');
    expect(reply.status).not.toHaveBeenCalled();
  });

  it('allows POST when body includes correct scope value', async () => {
    const { scopeRegistry, invoiceModel } = buildScopeContext();
    const db = createMockDb([]);
    const body: Record<string, unknown> = { total: 100, company: 'company-1' };

    const guard = createScopeWriteGuard({ model: invoiceModel, scopeRegistry, db });
    const request = createMockRequest({
      method: 'POST',
      body,
      authContext: {
        user: {
          id: 'user-1',
          email: 'test@test.com',
          full_name: 'Test',
          enabled: true,
          password_hash: '',
        },
        permissions: { models: {}, pages: [], version: 1 },
        roles: ['admin'],
        scopeFilters: [{ field: 'company', operator: 'eq', value: 'company-1' }],
      },
    });
    const reply = createMockReply();

    await guard(request, reply);

    expect(reply.status).not.toHaveBeenCalled();
  });

  it('rejects POST when body has different scope value', async () => {
    const { scopeRegistry, invoiceModel } = buildScopeContext();
    const db = createMockDb([]);
    const body: Record<string, unknown> = { total: 100, company: 'other-company' };

    const guard = createScopeWriteGuard({ model: invoiceModel, scopeRegistry, db });
    const request = createMockRequest({
      method: 'POST',
      body,
      authContext: {
        user: {
          id: 'user-1',
          email: 'test@test.com',
          full_name: 'Test',
          enabled: true,
          password_hash: '',
        },
        permissions: { models: {}, pages: [], version: 1 },
        roles: ['admin'],
        scopeFilters: [{ field: 'company', operator: 'eq', value: 'company-1' }],
      },
    });
    const reply = createMockReply();

    const error = await guard(request, reply).catch((e) => e);

    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('SCOPE_VIOLATION');
  });

  it('rejects PUT when trying to change scope field', async () => {
    const { scopeRegistry, invoiceModel } = buildScopeContext();
    const db = createMockDb([]);
    const body: Record<string, unknown> = { company: 'other-company' };

    const guard = createScopeWriteGuard({ model: invoiceModel, scopeRegistry, db });
    const request = createMockRequest({
      method: 'PUT',
      body,
      authContext: {
        user: {
          id: 'user-1',
          email: 'test@test.com',
          full_name: 'Test',
          enabled: true,
          password_hash: '',
        },
        permissions: { models: {}, pages: [], version: 1 },
        roles: ['admin'],
        scopeFilters: [{ field: 'company', operator: 'eq', value: 'company-1' }],
      },
    });
    const reply = createMockReply();

    const error = await guard(request, reply).catch((e) => e);

    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('SCOPE_VIOLATION');
  });

  it('allows PUT when scope field is not in body', async () => {
    const { scopeRegistry, invoiceModel } = buildScopeContext();
    const db = createMockDb([]);
    const body: Record<string, unknown> = { total: 200 };

    const guard = createScopeWriteGuard({ model: invoiceModel, scopeRegistry, db });
    const request = createMockRequest({
      method: 'PUT',
      body,
      authContext: {
        user: {
          id: 'user-1',
          email: 'test@test.com',
          full_name: 'Test',
          enabled: true,
          password_hash: '',
        },
        permissions: { models: {}, pages: [], version: 1 },
        roles: ['admin'],
        scopeFilters: [{ field: 'company', operator: 'eq', value: 'company-1' }],
      },
    });
    const reply = createMockReply();

    await guard(request, reply);

    expect(reply.status).not.toHaveBeenCalled();
  });

  it('skips for GET requests', async () => {
    const { scopeRegistry, invoiceModel } = buildScopeContext();
    const db = createMockDb([]);

    const guard = createScopeWriteGuard({ model: invoiceModel, scopeRegistry, db });
    const request = createMockRequest({ method: 'GET' });
    const reply = createMockReply();

    await guard(request, reply);

    expect(reply.status).not.toHaveBeenCalled();
  });

  it('skips for unscoped models', async () => {
    const { scopeRegistry, unscopedModel } = buildScopeContext();
    const db = createMockDb([]);
    const body: Record<string, unknown> = { name: 'test' };

    const guard = createScopeWriteGuard({ model: unscopedModel, scopeRegistry, db });
    const request = createMockRequest({
      method: 'POST',
      body,
      authContext: {
        user: {
          id: 'user-1',
          email: 'test@test.com',
          full_name: 'Test',
          enabled: true,
          password_hash: '',
        },
        permissions: { models: {}, pages: [], version: 1 },
        roles: ['admin'],
        scopeFilters: [],
      },
    });
    const reply = createMockReply();

    await guard(request, reply);

    expect(reply.status).not.toHaveBeenCalled();
  });
});
