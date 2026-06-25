import type { Kysely } from 'kysely';
import type { FrameworkContext } from '@rangka/shared';
import type { SchemaRegistry } from '../schema/registry.js';
import type { RequestContext } from '../auth/types.js';
import type { EventBus } from '../events/bus.js';
import type { ServiceRegistry } from '../services/registry.js';
import type { AdapterRegistry } from '../plugins/adapter-registry.js';
import type { Dialect } from '../db/client.js';
import { enqueue } from '../jobs/enqueue.js';
import { createModelAccess } from '../model-api/index.js';

export interface HookContextOptions {
  trx: unknown;
  schema: SchemaRegistry;
  auth: RequestContext;
  eventBus?: EventBus;
  serviceRegistry?: ServiceRegistry;
  config?: Record<string, unknown>;
  adapterRegistry?: AdapterRegistry;
  dialect?: Dialect;
}

/**
 * Build a full FrameworkContext for hooks, scoped to the current transaction and auth.
 */
export function createHookContext(opts: HookContextOptions): FrameworkContext {
  const {
    trx,
    schema,
    auth,
    eventBus,
    serviceRegistry,
    config = {},
    adapterRegistry,
    dialect,
  } = opts;

  const transaction = trx as Kysely<unknown>;

  const events = {
    emit: async (event: string, payload: unknown) => {
      if (eventBus) {
        await eventBus.emitWithTrx(event, payload, transaction);
      }
    },
    on: (event: string, handler: (payload: unknown) => Promise<void>) => {
      eventBus?.on(event, handler);
    },
  };

  const enqueueJob = async (
    job: string,
    data: unknown,
    opts?: { delay?: number; unique?: boolean; uniqueKey?: string },
  ) => {
    await enqueue(transaction, job, data, opts);
  };

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const models = createModelAccess({
    db: transaction as any,
    registry: schema,
    auth,
    adapterRegistry,
    dialect,
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const service = (name: string) => {
    if (!serviceRegistry) {
      throw new Error('ServiceRegistry not available in this context');
    }
    return serviceRegistry.get(name, {
      db: transaction,
      schema,
      enqueue: enqueueJob,
      events,
      config,
      models,
      auth: { user: auth.user ?? null, roles: auth.roles ?? [] },
      scope: auth.scopeFilters?.[0]?.value ?? null,
    });
  };

  return {
    db: transaction,
    schema,
    auth: {
      user: auth.user ?? null,
      roles: auth.roles ?? [],
    },
    scope: auth.scopeFilters?.[0]?.value ?? null,
    models,
    events,
    config,
    service,
    enqueue: enqueueJob,
    notify: () => {},
    email: { send: async () => {} },
  };
}
