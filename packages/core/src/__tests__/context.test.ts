import { describe, it, expect } from 'vitest';
import { createFrameworkContext, createRequestContext } from '../context.js';
import { ServiceRegistry } from '../services/registry.js';
import { EventBus } from '../events/bus.js';
import { SchemaRegistry } from '../schema/registry.js';

describe('createFrameworkContext', () => {
  function setup() {
    const kysely = { fake: 'db' } as any;
    const db = {
      kysely,
      selectFrom: () => {},
      insertInto: () => {},
      updateTable: () => {},
      deleteFrom: () => {},
    } as any;
    const schema = new SchemaRegistry([]);
    const eventBus = new EventBus();
    const serviceRegistry = new ServiceRegistry();
    return { db, kysely, schema, eventBus, serviceRegistry };
  }

  it('returns context with all fields populated', () => {
    const { db, kysely, schema, eventBus, serviceRegistry } = setup();
    const ctx = createFrameworkContext({
      db,
      schema,
      eventBus,
      serviceRegistry,
      config: { env: 'test' },
    });

    expect(ctx.db).toBe(kysely);
    expect(ctx.schema).toBe(schema);
    expect(ctx.events.emit).toBeTypeOf('function');
    expect(ctx.events.on).toBeTypeOf('function');
    expect(ctx.auth).toEqual({ user: null, roles: [] });
    expect(ctx.config).toEqual({ env: 'test' });
    expect(ctx.service).toBeTypeOf('function');
    expect(ctx.enqueue).toBeTypeOf('function');
    expect(ctx.notify).toBeTypeOf('function');
    expect(ctx.email.send).toBeTypeOf('function');
  });

  it('service() resolves registered services', () => {
    const { db, schema, eventBus, serviceRegistry } = setup();
    serviceRegistry.register({
      name: 'pricing',
      factory: () => ({ calculate: (x: unknown) => x }),
    });

    const ctx = createFrameworkContext({ db, schema, eventBus, serviceRegistry });
    const pricing = ctx.service('pricing');
    expect(pricing.calculate(100)).toBe(100);
  });

  it('defaults config to empty object', () => {
    const { db, schema, eventBus, serviceRegistry } = setup();
    const ctx = createFrameworkContext({ db, schema, eventBus, serviceRegistry });
    expect(ctx.config).toEqual({});
  });
});

describe('createRequestContext', () => {
  function setup() {
    const kysely = { fake: 'db' } as any;
    const db = {
      kysely,
      selectFrom: () => {},
      insertInto: () => {},
      updateTable: () => {},
      deleteFrom: () => {},
    } as any;
    const schema = new SchemaRegistry([]);
    const eventBus = new EventBus();
    const serviceRegistry = new ServiceRegistry();
    const base = createFrameworkContext({ db, schema, eventBus, serviceRegistry });
    return { base, kysely };
  }

  it('inherits from base context', () => {
    const { base } = setup();
    const auth = { user: { id: '1', email: 'admin@test.com' } } as any;
    const reqCtx = createRequestContext({ base, auth, roles: ['Administrator'] });

    expect(reqCtx.schema).toBe(base.schema);
    expect(reqCtx.service).toBe(base.service);
    expect(reqCtx.auth).toEqual({
      user: { id: '1', email: 'admin@test.com' },
      roles: ['Administrator'],
    });
  });

  it('uses transaction db when provided', () => {
    const { base } = setup();
    const trx = { fake: 'trx' } as any;
    const auth = {} as any;
    const reqCtx = createRequestContext({ base, auth, trx });

    expect(reqCtx.db).toBe(trx);
    expect(reqCtx.db).not.toBe(base.db);
  });

  it('uses base db when no transaction provided', () => {
    const { base } = setup();
    const auth = {} as any;
    const reqCtx = createRequestContext({ base, auth });

    expect(reqCtx.db).toBe(base.db);
  });
});
