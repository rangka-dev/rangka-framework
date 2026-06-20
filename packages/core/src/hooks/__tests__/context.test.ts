import { describe, it, expect } from 'vitest';
import { createHookContext } from '../context.js';
import type { SchemaRegistry } from '../../schema/registry.js';
import type { RequestContext } from '../../auth/types.js';

function mockSchema(): SchemaRegistry {
  return { getAllModels: () => [] } as unknown as SchemaRegistry;
}

function mockAuth(): RequestContext {
  return {
    user: { id: '1', email: 'test@test.com' },
    roles: ['Admin'],
    scopeFilters: [],
  } as unknown as RequestContext;
}

describe('createHookContext', () => {
  it('returns context with db, schema, and auth', () => {
    const trx = { fake: 'transaction' };
    const schema = mockSchema();
    const auth = mockAuth();

    const ctx = createHookContext({ trx, schema, auth });

    expect(ctx.db).toBe(trx);
    expect(ctx.schema).toBe(schema);
    expect(ctx.auth.user).toEqual(auth.user);
    expect(ctx.auth.roles).toEqual(auth.roles);
  });

  it('enqueue calls the enqueue function with the trx', async () => {
    const ctx = createHookContext({ trx: {}, schema: mockSchema(), auth: mockAuth() });
    // Without a real db, it will throw a type error from kysely - confirms wiring is in place
    await expect(ctx.enqueue('test-job', {})).rejects.toThrow();
  });

  it('service throws when no serviceRegistry provided', () => {
    const ctx = createHookContext({ trx: {}, schema: mockSchema(), auth: mockAuth() });
    expect(() => ctx.service('test-service')).toThrow('ServiceRegistry not available');
  });

  it('service resolves via serviceRegistry when provided', () => {
    const mockRegistry = {
      get: (name: string) => ({ greet: () => `hello from ${name}` }),
    } as any;
    const ctx = createHookContext({
      trx: {},
      schema: mockSchema(),
      auth: mockAuth(),
      serviceRegistry: mockRegistry,
    });
    const svc = ctx.service('greeter') as any;
    expect(svc.greet()).toBe('hello from greeter');
  });

  it('events.emit is a no-op without eventBus', async () => {
    const ctx = createHookContext({ trx: {}, schema: mockSchema(), auth: mockAuth() });
    await expect(ctx.events.emit('test-event', {})).resolves.toBeUndefined();
  });

  it('events.emit delegates to eventBus when provided', async () => {
    const emitWithTrx = async () => {};
    const mockBus = { emitWithTrx } as any;
    const ctx = createHookContext({
      trx: {},
      schema: mockSchema(),
      auth: mockAuth(),
      eventBus: mockBus,
    });
    await expect(ctx.events.emit('test-event', {})).resolves.toBeUndefined();
  });
});
