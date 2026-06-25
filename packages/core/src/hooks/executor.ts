/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Kysely } from 'kysely';
import type { HooksConfig } from '@rangka/shared';
import type { HookChain, HookContext, HookDocument } from './types.js';
import type { SchemaRegistry } from '../schema/registry.js';
import type { RequestContext } from '../auth/types.js';
import type { EventBus } from '../events/bus.js';
import type { ServiceRegistry } from '../services/registry.js';
import type { Dialect } from '../db/client.js';
import { createHookContext } from './context.js';

export type HookOperation = 'create' | 'update' | 'delete' | 'submit' | 'cancel';

export interface ExecutePipelineOptions {
  model: string;
  operation: HookOperation;
  chain: HookChain;
  doc: HookDocument;
  db: Kysely<any>;
  schema: SchemaRegistry;
  auth: RequestContext;
  eventBus?: EventBus;
  serviceRegistry?: ServiceRegistry;
  config?: Record<string, unknown>;
  dialect?: Dialect;
  execute: (doc: HookDocument, trx: Kysely<any>) => Promise<HookDocument>;
}

/**
 * Run the full hook pipeline for a mutation operation.
 * Transaction covers: validate -> beforeSave -> before{Op} -> execute -> after{Op}
 * afterSave runs AFTER the transaction commits (cannot roll back the write).
 */
export async function executeHookPipeline(opts: ExecutePipelineOptions): Promise<HookDocument> {
  const {
    chain,
    operation,
    db,
    schema,
    auth,
    eventBus,
    serviceRegistry,
    config,
    dialect,
    execute,
  } = opts;
  const doc = { ...opts.doc };

  const beforeHookKey = `before${capitalize(operation)}` as keyof HooksConfig;
  const afterHookKey = `after${capitalize(operation)}` as keyof HooksConfig;

  const result = await db.transaction().execute(async (trx) => {
    const ctx: HookContext = createHookContext({
      trx,
      schema,
      auth,
      eventBus,
      serviceRegistry,
      config,
      dialect,
    });

    // Step 1: Run synchronous validators (skip for delete)
    if (operation !== 'delete') {
      runValidators(chain, doc);
    }

    // Step 2: Run beforeSave hooks (only for create/update)
    if (operation === 'create' || operation === 'update') {
      await runHooksForKey(chain, 'beforeSave', doc, ctx);
    }

    // Step 3: Run operation-specific before hooks (e.g. beforeCreate)
    await runHooksForKey(chain, beforeHookKey, doc, ctx);

    // Step 4: Execute the actual database operation
    const txResult = await execute(doc, trx);

    // Step 5: Run operation-specific after hooks (e.g. afterCreate)
    await runHooksForKey(chain, afterHookKey, txResult, ctx);

    return txResult;
  });

  // Step 6: Run afterSave hooks OUTSIDE the transaction (data already committed)
  if (operation === 'create' || operation === 'update') {
    const ctx: HookContext = createHookContext({
      trx: db,
      schema,
      auth,
      eventBus,
      serviceRegistry,
      config,
      dialect,
    });
    await runHooksForKey(chain, 'afterSave', result, ctx);
  }

  return result;
}

// --- Helpers ---

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Run all synchronous validate hooks in the chain. */
function runValidators(chain: HookChain, doc: HookDocument): void {
  for (const entry of chain.entries) {
    if (entry.hooks.validate) {
      entry.hooks.validate(doc);
    }
  }
}

/** Run all hooks for a given key across the chain entries. */
async function runHooksForKey(
  chain: HookChain,
  key: keyof HooksConfig,
  doc: HookDocument,
  ctx: HookContext,
): Promise<void> {
  for (const entry of chain.entries) {
    const hook = entry.hooks[key] as ((doc: HookDocument, ctx: any) => Promise<void>) | undefined;
    if (hook) {
      await hook(doc, ctx);
    }
  }
}
