/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Kysely } from 'kysely';
import type { ResolvedModel } from '../schema/types.js';
import type { SchemaRegistry } from '../schema/registry.js';
import type { ModelAccessOptions } from '../model-api/types.js';
import type { HookRegistry } from '../hooks/registry.js';
import type { HookDocument } from '../hooks/types.js';
import type { ServiceRegistry } from '../services/registry.js';
import type { EventBus } from '../events/bus.js';
import { createModelAccess } from '../model-api/index.js';
import { KyselyModelOps } from '../db/model-ops.js';
import { modelToTableName } from '../db/field-mapper.js';
import { executeHookPipeline } from '../hooks/executor.js';
import { ValidationError } from '../hooks/errors.js';
import { QueryParser, QueryValidationError } from './query-parser.js';
import { getAuthContext } from '../auth/session.js';
import { isOwnerOnly, modelHasCreatedBy } from '../auth/model-permissions.js';
import { validateFields } from '../validation/field-validator.js';
import { toBool } from '../helpers/coerce.js';
import { assertOwnership } from '../helpers/assert-ownership.js';
import { stampCreate, stampUpdate } from '../helpers/stamping.js';
import { findMissingRequiredFields } from '../helpers/validation.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../errors.js';

// ---------- Types ----------

/** Context for read handlers and external model write handlers. */
export interface HandlerContext {
  model: ResolvedModel;
  registry: SchemaRegistry;
  modelAccessOpts: Omit<ModelAccessOptions, 'auth'>;
}

/** Context for unified write handlers (internal models). */
export interface WriteHandlerContext {
  model: ResolvedModel;
  registry: SchemaRegistry;
  modelAccessOpts: Omit<ModelAccessOptions, 'auth'>;
  db: Kysely<any>;
  hookRegistry?: HookRegistry;
  serviceRegistry?: ServiceRegistry;
  eventBus?: EventBus;
  config: Record<string, unknown>;
}

// ---------- Internal helpers ----------

function createParserForModel(ctx: HandlerContext): QueryParser {
  const relationFieldNames = ctx.registry
    .getRelationshipsForModel(ctx.model.qualifiedName)
    .map((r) => r.field);
  return new QueryParser(ctx.model.fields, relationFieldNames);
}

function parseRequestBody(request: FastifyRequest): Record<string, unknown> {
  const body = request.body as Record<string, unknown> | undefined;
  if (!body || typeof body !== 'object') {
    throw new BadRequestError('VALIDATION_ERROR', 'Request body is required');
  }
  return body;
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

// ---------- Read handlers ----------

/** GET /model — Returns a paginated list of records with filtering, sorting, and field selection. */
export function listHandler(ctx: HandlerContext) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const parser = createParserForModel(ctx);
      const parsed = parser.parse(request.query as Record<string, unknown>);
      const includeArchived = toBool((request.query as any).includeArchived);

      const authContext = getAuthContext(request);
      const models = createModelAccess({ ...ctx.modelAccessOpts, auth: authContext });

      const ownerRead = isOwnerOnly(authContext.permissions, ctx.model.qualifiedName, 'read');
      if (ownerRead && !modelHasCreatedBy(ctx.model)) {
        throw new ForbiddenError(
          'FORBIDDEN',
          `Owner-based read requires created_by field on ${ctx.model.qualifiedName}`,
        );
      }

      let queryBuilder = models.query(ctx.model.qualifiedName);

      if (includeArchived) {
        queryBuilder = queryBuilder.includeArchived();
      }

      queryBuilder = queryBuilder.filterRaw(parsed.filters);

      if (parsed.search) {
        const searchableFields = ctx.model.fields
          .filter((f) => 'searchable' in f.config && f.config.searchable)
          .map((f) => f.name);
        if (searchableFields.length > 0) {
          queryBuilder = queryBuilder.search(parsed.search, searchableFields);
        } else {
          return reply.send({
            data: [],
            meta: { total: 0, page: parsed.pagination.page, limit: parsed.pagination.limit },
          });
        }
      }

      if (ownerRead) {
        queryBuilder = queryBuilder.filter({ created_by: authContext.user!.id });
      }

      if (parsed.fields.length > 0) {
        queryBuilder = queryBuilder.fields(parsed.fields);
      }

      for (const s of parsed.sort) {
        queryBuilder = queryBuilder.sort(s.field, s.direction);
      }

      for (const inc of parsed.includes) {
        queryBuilder = queryBuilder.include(
          inc.nested && inc.nested.length > 0
            ? { relation: inc.relation, nested: inc.nested.map((n) => n.relation) }
            : inc.relation,
        );
      }

      queryBuilder = queryBuilder.limit(parsed.pagination.limit).page(parsed.pagination.page);

      const result = await queryBuilder.execWithMeta();

      return reply.send({ data: result.data, meta: result.meta });
    } catch (err: any) {
      if (err instanceof QueryValidationError) {
        throw new BadRequestError(err.code, err.message);
      }
      throw err;
    }
  };
}

/** GET /model/:id — Returns a single record by ID with optional field selection. */
export function getHandler(ctx: HandlerContext) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };

      const parser = createParserForModel(ctx);
      const parsed = parser.parse(request.query as Record<string, unknown>);

      const authContext = getAuthContext(request);
      const models = createModelAccess({ ...ctx.modelAccessOpts, auth: authContext });

      let queryBuilder = models.query(ctx.model.qualifiedName).filter({ id });

      if (parsed.fields.length > 0) {
        queryBuilder = queryBuilder.fields(parsed.fields);
      }

      for (const inc of parsed.includes) {
        queryBuilder = queryBuilder.include(
          inc.nested && inc.nested.length > 0
            ? { relation: inc.relation, nested: inc.nested.map((n) => n.relation) }
            : inc.relation,
        );
      }

      const record = await queryBuilder.first();

      if (!record) {
        throw new NotFoundError(`Record not found: ${id}`);
      }

      if (isOwnerOnly(authContext.permissions, ctx.model.qualifiedName, 'read')) {
        if (!modelHasCreatedBy(ctx.model) || record.created_by !== authContext.user?.id) {
          throw new NotFoundError(`Record not found: ${id}`);
        }
      }

      return reply.send({ data: record });
    } catch (err: any) {
      if (err instanceof QueryValidationError) {
        throw new BadRequestError(err.code, err.message);
      }
      throw err;
    }
  };
}

// ---------- Unified write handlers (internal models) ----------

/** POST /model — Creates a new record. Runs hook pipeline if hooks are registered. */
export function createHandler(ctx: WriteHandlerContext) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const body = parseRequestBody(request);

    const missing = findMissingRequiredFields(ctx.model, body);
    if (missing.length > 0) {
      throw new BadRequestError(
        'VALIDATION_ERROR',
        `Missing required fields: ${missing.join(', ')}`,
        missing,
      );
    }

    const violations = validateFields(ctx.model, body, 'create');
    if (violations.length > 0) {
      throw new BadRequestError(
        'VALIDATION_ERROR',
        violations.map((v) => v.message).join('; '),
        violations,
      );
    }

    const authContext = getAuthContext(request);
    stampCreate(body, ctx.model, authContext);

    const chain = ctx.hookRegistry?.getChain(ctx.model.qualifiedName);

    if (!chain) {
      const models = createModelAccess({ ...ctx.modelAccessOpts, auth: authContext });
      const record = await models.create(ctx.model.qualifiedName, body);
      return reply.status(201).send({ data: record });
    }

    try {
      const ops = new KyselyModelOps({
        db: ctx.db,
        model: ctx.model,
        registry: ctx.registry,
        tableName: modelToTableName(ctx.model.qualifiedName),
        dialect: ctx.modelAccessOpts.dialect,
      });
      const result = await executeHookPipeline({
        model: ctx.model.qualifiedName,
        operation: 'create',
        chain,
        doc: body as HookDocument,
        db: ctx.db,
        schema: ctx.registry,
        auth: authContext,
        eventBus: ctx.eventBus,
        serviceRegistry: ctx.serviceRegistry,
        config: ctx.config,
        dialect: ctx.modelAccessOpts.dialect,
        execute: async (doc, trx) => {
          const txOps = ops.withTransaction!(trx);
          return txOps.create(doc) as Promise<HookDocument>;
        },
      });
      return reply.status(201).send({ data: result });
    } catch (err: unknown) {
      return handleHookError(err);
    }
  };
}

/** PUT /model/:id — Updates an existing record. Runs hook pipeline if hooks are registered. */
export function updateHandler(ctx: WriteHandlerContext) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = parseRequestBody(request);

    const violations = validateFields(ctx.model, body, 'update');
    if (violations.length > 0) {
      throw new BadRequestError(
        'VALIDATION_ERROR',
        violations.map((v) => v.message).join('; '),
        violations,
      );
    }

    const authContext = getAuthContext(request);
    const models = createModelAccess({ ...ctx.modelAccessOpts, auth: authContext });

    const existing = await models.query(ctx.model.qualifiedName).filter({ id }).first();
    if (!existing) {
      throw new NotFoundError(`Record not found: ${id}`);
    }

    assertOwnership(authContext.permissions, ctx.model, existing, authContext.user?.id, 'write');
    stampUpdate(body, ctx.model, authContext);

    const chain = ctx.hookRegistry?.getChain(ctx.model.qualifiedName);

    if (!chain) {
      const record = await models.update(ctx.model.qualifiedName, id, body);
      return reply.send({ data: record });
    }

    try {
      const ops = new KyselyModelOps({
        db: ctx.db,
        model: ctx.model,
        registry: ctx.registry,
        tableName: modelToTableName(ctx.model.qualifiedName),
        dialect: ctx.modelAccessOpts.dialect,
      });
      const result = await executeHookPipeline({
        model: ctx.model.qualifiedName,
        operation: 'update',
        chain,
        doc: { ...body, id } as HookDocument,
        db: ctx.db,
        schema: ctx.registry,
        auth: authContext,
        eventBus: ctx.eventBus,
        serviceRegistry: ctx.serviceRegistry,
        config: ctx.config,
        dialect: ctx.modelAccessOpts.dialect,
        execute: async (doc, trx) => {
          const { id: docId, ...data } = doc;
          const txOps = ops.withTransaction!(trx);
          return txOps.update(docId as string, data) as Promise<HookDocument>;
        },
      });
      return reply.send({ data: result });
    } catch (err: unknown) {
      return handleHookError(err);
    }
  };
}

/** DELETE /model/:id — Deletes a record. Runs hook pipeline if hooks are registered. */
export function deleteHandler(ctx: WriteHandlerContext) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const authContext = getAuthContext(request);
    const models = createModelAccess({ ...ctx.modelAccessOpts, auth: authContext });

    const existing = await models.query(ctx.model.qualifiedName).filter({ id }).first();
    if (!existing) {
      throw new NotFoundError(`Record not found: ${id}`);
    }

    assertOwnership(authContext.permissions, ctx.model, existing, authContext.user?.id, 'delete');

    const chain = ctx.hookRegistry?.getChain(ctx.model.qualifiedName);

    if (!chain) {
      await models.delete(ctx.model.qualifiedName, id);
      return reply.status(204).send();
    }

    try {
      const ops = new KyselyModelOps({
        db: ctx.db,
        model: ctx.model,
        registry: ctx.registry,
        tableName: modelToTableName(ctx.model.qualifiedName),
        dialect: ctx.modelAccessOpts.dialect,
      });
      await executeHookPipeline({
        model: ctx.model.qualifiedName,
        operation: 'delete',
        chain,
        doc: existing as HookDocument,
        db: ctx.db,
        schema: ctx.registry,
        auth: authContext,
        eventBus: ctx.eventBus,
        serviceRegistry: ctx.serviceRegistry,
        config: ctx.config,
        dialect: ctx.modelAccessOpts.dialect,
        execute: async (doc, trx) => {
          const txOps = ops.withTransaction!(trx);
          await txOps.delete(doc.id as string);
          return doc;
        },
      });
      return reply.status(204).send();
    } catch (err: unknown) {
      return handleHookError(err);
    }
  };
}

// ---------- External model write handlers (no hooks, no transactions) ----------

/** POST /model — Creates a record on an external adapter-backed model. */
export function externalCreateHandler(ctx: HandlerContext) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const body = parseRequestBody(request);

    const missing = findMissingRequiredFields(ctx.model, body);
    if (missing.length > 0) {
      throw new BadRequestError(
        'VALIDATION_ERROR',
        `Missing required fields: ${missing.join(', ')}`,
        missing,
      );
    }

    const violations = validateFields(ctx.model, body, 'create');
    if (violations.length > 0) {
      throw new BadRequestError(
        'VALIDATION_ERROR',
        violations.map((v) => v.message).join('; '),
        violations,
      );
    }

    const authContext = getAuthContext(request);
    stampCreate(body, ctx.model, authContext);

    const models = createModelAccess({ ...ctx.modelAccessOpts, auth: authContext });
    const record = await models.create(ctx.model.qualifiedName, body);

    return reply.status(201).send({ data: record });
  };
}

/** PUT /model/:id — Updates a record on an external adapter-backed model. */
export function externalUpdateHandler(ctx: HandlerContext) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = parseRequestBody(request);

    const violations = validateFields(ctx.model, body, 'update');
    if (violations.length > 0) {
      throw new BadRequestError(
        'VALIDATION_ERROR',
        violations.map((v) => v.message).join('; '),
        violations,
      );
    }

    const authContext = getAuthContext(request);
    const models = createModelAccess({ ...ctx.modelAccessOpts, auth: authContext });

    const existing = await models.query(ctx.model.qualifiedName).filter({ id }).first();
    if (!existing) {
      throw new NotFoundError(`Record not found: ${id}`);
    }

    assertOwnership(authContext.permissions, ctx.model, existing, authContext.user?.id, 'write');
    stampUpdate(body, ctx.model, authContext);

    const record = await models.update(ctx.model.qualifiedName, id, body);
    return reply.send({ data: record });
  };
}

/** DELETE /model/:id — Deletes a record on an external adapter-backed model. */
export function externalDeleteHandler(ctx: HandlerContext) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const authContext = getAuthContext(request);
    const models = createModelAccess({ ...ctx.modelAccessOpts, auth: authContext });

    const existing = await models.query(ctx.model.qualifiedName).filter({ id }).first();
    if (!existing) {
      throw new NotFoundError(`Record not found: ${id}`);
    }

    assertOwnership(authContext.permissions, ctx.model, existing, authContext.user?.id, 'delete');

    await models.delete(ctx.model.qualifiedName, id);
    return reply.status(204).send();
  };
}
