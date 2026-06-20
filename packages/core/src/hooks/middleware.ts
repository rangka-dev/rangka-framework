/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Kysely } from 'kysely';
import type { ResolvedModel } from '../schema/types.js';
import type { SchemaRegistry } from '../schema/registry.js';
import type { HookRegistry } from './registry.js';
import type { HookDocument } from './types.js';
import type { ServiceRegistry } from '../services/registry.js';
import type { EventBus } from '../events/bus.js';
import { executeHookPipeline, type HookOperation } from './executor.js';
import { ValidationError } from './errors.js';
import { getAuthContext } from '../auth/session.js';
import { validateFields } from '../validation/field-validator.js';
import { assertOwnership } from '../helpers/assert-ownership.js';
import { stampCreate, stampUpdate } from '../helpers/stamping.js';
import { findMissingRequiredFields } from '../helpers/validation.js';
import { BadRequestError, NotFoundError } from '../errors.js';
import type { ModelOps } from '../model-api/types.js';
import { ModelQueryBuilder } from '../model-api/query-builder.js';

// --- Types ---

interface WithHooksContext {
  model: ResolvedModel;
  registry: SchemaRegistry;
  db: Kysely<any>;
  ops: ModelOps;
  hookRegistry: HookRegistry;
  serviceRegistry?: ServiceRegistry;
  eventBus?: EventBus;
  config?: Record<string, unknown>;
}

// --- Shared helpers (internal) ---

function parseRequestBody(request: FastifyRequest): Record<string, unknown> {
  const body = request.body as Record<string, unknown> | undefined;
  if (!body || typeof body !== 'object') {
    throw new BadRequestError('VALIDATION_ERROR', 'Request body is required');
  }
  return body;
}

async function findRecordOrNotFound(
  ctx: WithHooksContext,
  id: string,
): Promise<Record<string, unknown>> {
  const record = await new ModelQueryBuilder(ctx.ops, ctx.model, ctx.registry)
    .filter({ id })
    .first();

  if (!record) {
    throw new NotFoundError(`Record not found: ${id}`);
  }
  return record;
}

function handleHookError(err: unknown): never {
  if (err instanceof ValidationError) {
    throw new BadRequestError(err.code, err.message, err.field ? { field: err.field } : undefined);
  }
  if (err instanceof Error) {
    throw new BadRequestError('VALIDATION_ERROR', err.message);
  }
  throw err;
}

function buildPipelineOptions(
  ctx: WithHooksContext,
  operation: HookOperation,
  doc: HookDocument,
  auth: any,
  execute: (doc: HookDocument, trx: Kysely<unknown>) => Promise<HookDocument>,
) {
  return {
    model: ctx.model.qualifiedName,
    operation,
    chain: ctx.hookRegistry.getChain(ctx.model.qualifiedName)!,
    doc,
    db: ctx.db,
    schema: ctx.registry,
    auth,
    eventBus: ctx.eventBus,
    serviceRegistry: ctx.serviceRegistry,
    config: ctx.config,
    execute,
  };
}

// --- Exported middleware factories ---

export function withHooksCreate(ctx: WithHooksContext) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const body = parseRequestBody(request);

    const missingFields = findMissingRequiredFields(ctx.model, body);
    if (missingFields.length > 0) {
      throw new BadRequestError(
        'VALIDATION_ERROR',
        `Missing required fields: ${missingFields.join(', ')}`,
        missingFields,
      );
    }

    const fieldViolations = validateFields(ctx.model, body, 'create');
    if (fieldViolations.length > 0) {
      throw new BadRequestError(
        'VALIDATION_ERROR',
        fieldViolations.map((v) => v.message).join('; '),
        fieldViolations,
      );
    }

    const auth = getAuthContext(request);
    stampCreate(body, ctx.model, auth);

    const chain = ctx.hookRegistry.getChain(ctx.model.qualifiedName);
    if (!chain) {
      const record = await ctx.ops.create(body, auth);
      return reply.status(201).send({ data: record });
    }

    try {
      const result = await executeHookPipeline(
        buildPipelineOptions(ctx, 'create', body as HookDocument, auth, async (doc, trx) => {
          const txOps = ctx.ops.withTransaction!(trx);
          return txOps.create(doc) as Promise<HookDocument>;
        }),
      );
      return reply.status(201).send({ data: result });
    } catch (err: unknown) {
      return handleHookError(err);
    }
  };
}

export function withHooksUpdate(ctx: WithHooksContext) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = parseRequestBody(request);

    await findRecordOrNotFound(ctx, id);

    const fieldViolations = validateFields(ctx.model, body, 'update');
    if (fieldViolations.length > 0) {
      throw new BadRequestError(
        'VALIDATION_ERROR',
        fieldViolations.map((v) => v.message).join('; '),
        fieldViolations,
      );
    }

    const authContext = getAuthContext(request);
    const existing = await findRecordOrNotFound(ctx, id);
    assertOwnership(authContext.permissions, ctx.model, existing, authContext.user?.id, 'write');

    stampUpdate(body, ctx.model, authContext);

    const chain = ctx.hookRegistry.getChain(ctx.model.qualifiedName);
    if (!chain) {
      const record = await ctx.ops.update(id, body, authContext);
      return reply.send({ data: record });
    }

    try {
      const result = await executeHookPipeline(
        buildPipelineOptions(
          ctx,
          'update',
          { ...body, id } as HookDocument,
          authContext,
          async (doc, trx) => {
            const { id: docId, ...data } = doc;
            const txOps = ctx.ops.withTransaction!(trx);
            return txOps.update(docId as string, data) as Promise<HookDocument>;
          },
        ),
      );
      return reply.send({ data: result });
    } catch (err: unknown) {
      return handleHookError(err);
    }
  };
}

export function withHooksDelete(ctx: WithHooksContext) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const existing = await findRecordOrNotFound(ctx, id);

    const authContext = getAuthContext(request);
    assertOwnership(authContext.permissions, ctx.model, existing, authContext.user?.id, 'delete');

    const chain = ctx.hookRegistry.getChain(ctx.model.qualifiedName);
    if (!chain) {
      await ctx.ops.delete(id, authContext);
      return reply.status(204).send();
    }

    try {
      await executeHookPipeline(
        buildPipelineOptions(
          ctx,
          'delete',
          existing as HookDocument,
          authContext,
          async (doc, trx) => {
            const txOps = ctx.ops.withTransaction!(trx);
            await txOps.delete(doc.id as string);
            return doc;
          },
        ),
      );
      return reply.status(204).send();
    } catch (err: unknown) {
      return handleHookError(err);
    }
  };
}
