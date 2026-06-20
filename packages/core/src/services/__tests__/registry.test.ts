import { describe, it, expect } from 'vitest';
import {
  ServiceRegistry,
  ServiceCircularDependencyError,
  ServiceNotFoundError,
  DuplicateServiceError,
} from '../registry.js';
import type { ServiceDefinition, ServiceContext } from '../types.js';

const baseContext: Omit<ServiceContext, 'service'> = {
  db: {} as ServiceContext['db'],
  schema: {} as ServiceContext['schema'],
  enqueue: async () => {},
  events: { emit: async () => {}, on: () => {} },
  config: {},
};

describe('ServiceRegistry', () => {
  it('registers and retrieves a service', () => {
    const registry = new ServiceRegistry();
    const def: ServiceDefinition = {
      name: 'notifications',
      factory: () => ({
        send: async (msg: unknown) => msg,
      }),
    };

    registry.register(def);
    expect(registry.has('notifications')).toBe(true);

    const instance = registry.get('notifications', baseContext);
    expect(instance.send).toBeTypeOf('function');
  });

  it('returns the same instance on repeated get (lazy singleton)', () => {
    const registry = new ServiceRegistry();
    let callCount = 0;
    registry.register({
      name: 'counter',
      factory: () => {
        callCount++;
        return { count: () => callCount };
      },
    });

    const a = registry.get('counter', baseContext);
    const b = registry.get('counter', baseContext);
    expect(a).toBe(b);
    expect(callCount).toBe(1);
  });

  it('throws on duplicate registration', () => {
    const registry = new ServiceRegistry();
    registry.register({ name: 'svc', factory: () => ({}) });

    expect(() => registry.register({ name: 'svc', factory: () => ({}) })).toThrow(
      DuplicateServiceError,
    );
  });

  it('throws when getting an unregistered service', () => {
    const registry = new ServiceRegistry();

    expect(() => registry.get('nonexistent', baseContext)).toThrow(ServiceNotFoundError);
  });

  it('detects circular dependencies at registration time', () => {
    const registry = new ServiceRegistry();
    registry.register({ name: 'a', deps: ['b'], factory: () => ({}) });
    registry.register({ name: 'b', deps: ['c'], factory: () => ({}) });
    registry.register({ name: 'c', deps: ['a'], factory: () => ({}) });

    expect(() => registry.detectCircularDependencies()).toThrow(ServiceCircularDependencyError);
  });

  it('does not throw for valid dependency graph', () => {
    const registry = new ServiceRegistry();
    registry.register({ name: 'a', deps: ['b'], factory: () => ({}) });
    registry.register({ name: 'b', deps: ['c'], factory: () => ({}) });
    registry.register({ name: 'c', factory: () => ({}) });

    expect(() => registry.detectCircularDependencies()).not.toThrow();
  });

  it('injects dependencies via service() in context', () => {
    const registry = new ServiceRegistry();
    registry.register({
      name: 'logger',
      factory: () => ({ log: (msg: unknown) => `logged: ${msg}` }),
    });
    registry.register({
      name: 'mailer',
      deps: ['logger'],
      factory: (ctx: ServiceContext) => ({
        send: (to: unknown) => {
          const logger = ctx.service('logger');
          return (logger as any).log(`email to ${to}`);
        },
      }),
    });

    const mailer = registry.get('mailer', baseContext);
    expect(mailer.send('user@test.com')).toBe('logged: email to user@test.com');
  });

  it('resolves deep dependency chains', () => {
    const registry = new ServiceRegistry();
    registry.register({
      name: 'c',
      factory: () => ({ value: () => 42 }),
    });
    registry.register({
      name: 'b',
      deps: ['c'],
      factory: (ctx) => ({ value: () => (ctx.service('c') as any).value() + 1 }),
    });
    registry.register({
      name: 'a',
      deps: ['b'],
      factory: (ctx) => ({ value: () => (ctx.service('b') as any).value() + 1 }),
    });

    const a = registry.get('a', baseContext);
    expect(a.value()).toBe(44);
  });

  it('detects circular dependency at runtime during resolution', () => {
    const registry = new ServiceRegistry();
    registry.register({
      name: 'x',
      deps: ['y'],
      factory: (ctx) => {
        ctx.service('y');
        return {};
      },
    });
    registry.register({
      name: 'y',
      deps: ['x'],
      factory: (ctx) => {
        ctx.service('x');
        return {};
      },
    });

    expect(() => registry.get('x', baseContext)).toThrow(ServiceCircularDependencyError);
  });

  it('reset clears cached instances', () => {
    const registry = new ServiceRegistry();
    let callCount = 0;
    registry.register({
      name: 'svc',
      factory: () => {
        callCount++;
        return {};
      },
    });

    registry.get('svc', baseContext);
    expect(callCount).toBe(1);

    registry.reset();
    registry.get('svc', baseContext);
    expect(callCount).toBe(2);
  });

  it('getAll returns all definitions', () => {
    const registry = new ServiceRegistry();
    registry.register({ name: 'a', factory: () => ({}) });
    registry.register({ name: 'b', factory: () => ({}) });

    expect(registry.getAll()).toHaveLength(2);
  });
});
