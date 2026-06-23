import type { Kysely } from 'kysely';
import type { FrameworkContext } from '@rangka/shared';
import type { SchemaRegistry } from './schema/registry.js';
import type { EventBus } from './events/bus.js';
import type { RequestContext } from './auth/types.js';
import type { ServiceRegistry } from './services/registry.js';
import type { AdapterRegistry } from './plugins/adapter-registry.js';
import type { DatabaseClient } from './db/client.js';
import { enqueue } from './jobs/enqueue.js';
import { createModelAccess } from './model-api/index.js';

export interface FrameworkContextOptions {
  db: DatabaseClient;
  schema: SchemaRegistry;
  eventBus: EventBus;
  serviceRegistry: ServiceRegistry;
  config?: Record<string, unknown>;
  adapterRegistry?: AdapterRegistry;
}

/**
 * Creates the root framework context used by services, hooks, and jobs.
 * This context has no authenticated user — use createRequestContext to add auth.
 */
export function createFrameworkContext(opts: FrameworkContextOptions): FrameworkContext {
  const { db, schema, eventBus, serviceRegistry, config = {}, adapterRegistry } = opts;

  const events = {
    emit: async (event: string, payload: unknown) => {
      await eventBus.emit(event, payload);
    },
    on: (event: string, handler: (payload: unknown) => Promise<void>) => {
      eventBus.on(event, handler);
    },
  };

  const enqueueJob = async (
    job: string,
    data: unknown,
    opts?: { delay?: number; unique?: boolean; uniqueKey?: string },
  ) => {
    await enqueue(db.kysely, job, data, opts);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const models = createModelAccess({
    db: db as any,
    registry: schema,
    adapterRegistry,
    dialect: db.dialect,
  });

  const serviceContext = {
    db: db.kysely,
    schema,
    enqueue: enqueueJob,
    events,
    config,
    models,
    auth: { user: null, roles: [] as string[] },
    scope: null,
  };

  return {
    db: db.kysely,
    schema,
    scope: null,
    models,
    events,
    auth: { user: null, roles: [] },
    config,
    service: (name: string) => serviceRegistry.get(name, serviceContext),
    enqueue: enqueueJob,
    notify: () => {},
    email: { send: async () => {} },
  };
}

export interface RequestScopedContextOptions {
  base: FrameworkContext;
  auth: RequestContext;
  roles?: string[];
  trx?: Kysely<unknown>;
  adapterRegistry?: AdapterRegistry;
  dialect?: import('./db/client.js').Dialect;
}

/**
 * Creates a request-scoped context by layering authentication info
 * and an optional transaction on top of the base framework context.
 */
export function createRequestContext(opts: RequestScopedContextOptions): FrameworkContext {
  const { base, auth, roles = [], trx, adapterRegistry, dialect } = opts;
  const dbInstance = trx ?? (base.db as Kysely<unknown>);
  const models = createModelAccess({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    db: dbInstance as any,
    registry: base.schema as unknown as SchemaRegistry,
    auth,
    adapterRegistry,
    dialect,
  });
  return {
    ...base,
    db: dbInstance,
    models,
    auth: {
      user: auth.user ?? null,
      roles,
    },
  };
}
