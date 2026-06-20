/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Kysely } from 'kysely';
import type { ResolvedModel } from '../schema/types.js';
import type { SchemaRegistry } from '../schema/registry.js';
import type { ModelAccessOptions } from '../model-api/types.js';
import { createModelAccess } from '../model-api/index.js';
import { QueryParser, QueryValidationError } from './query-parser.js';
import { resolveIncludes } from './include-resolver.js';
import { getAuthContext } from '../auth/session.js';
import { isOwnerOnly, modelHasCreatedBy } from '../auth/model-permissions.js';
import { validateFields } from '../validation/field-validator.js';
import { toBool } from '../helpers/coerce.js';
import { assertOwnership } from '../helpers/assert-ownership.js';
import { stampCreate, stampUpdate } from '../helpers/stamping.js';
import { findMissingRequiredFields } from '../helpers/validation.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../errors.js';

// ---------- Types ----------

/** Shared dependencies passed to each handler factory. */
export interface HandlerContext {
  model: ResolvedModel;
  registry: SchemaRegistry;
  db: Kysely<any>;
  modelAccessOpts: Omit<ModelAccessOptions, 'auth'>;
}

// ---------- Internal helpers ----------

/** Creates a QueryParser configured with the model's fields and relationship names. */
function createParserForModel(ctx: HandlerContext): QueryParser {
  const relationFieldNames = ctx.registry
    .getRelationshipsForModel(ctx.model.qualifiedName)
    .map((r) => r.field);
  return new QueryParser(ctx.model.fields, relationFieldNames);
}

/** Validates that the request body is a non-null object. Throws BadRequestError if invalid. */
function parseRequestBody(request: FastifyRequest): Record<string, unknown> {
  const body = request.body as Record<string, unknown> | undefined;
  if (!body || typeof body !== 'object') {
    throw new BadRequestError('VALIDATION_ERROR', 'Request body is required');
  }
  return body;
}

// ---------- Route handler factories ----------

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

      // Apply parsed filters directly (already translated by QueryParser)
      queryBuilder = queryBuilder.filterRaw(parsed.filters);

      // Apply search across searchable fields
      if (parsed.search) {
        const searchableFields = ctx.model.fields
          .filter((f) => 'searchable' in f.config && f.config.searchable)
          .map((f) => f.name);
        if (searchableFields.length > 0) {
          queryBuilder = queryBuilder.search(parsed.search, searchableFields);
        }
      }

      // Apply owner-only filter
      if (ownerRead) {
        queryBuilder = queryBuilder.filter({ created_by: authContext.user!.id });
      }

      // Apply field selection
      if (parsed.fields.length > 0) {
        queryBuilder = queryBuilder.fields(parsed.fields);
      }

      // Apply sorting
      for (const s of parsed.sort) {
        queryBuilder = queryBuilder.sort(s.field, s.direction);
      }

      // Apply pagination
      queryBuilder = queryBuilder.limit(parsed.pagination.limit).page(parsed.pagination.page);

      const result = await queryBuilder.execWithMeta();

      if (parsed.includes.length > 0) {
        await resolveIncludes(
          result.data,
          parsed.includes,
          ctx.registry,
          ctx.db,
          ctx.model.qualifiedName,
          request,
        );
      }

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

      if (!isValidUuid(id)) {
        throw new BadRequestError('INVALID_ID', `Invalid record ID: ${id}`);
      }

      const parser = createParserForModel(ctx);
      const parsed = parser.parse(request.query as Record<string, unknown>);

      const authContext = getAuthContext(request);
      const models = createModelAccess({ ...ctx.modelAccessOpts, auth: authContext });

      let queryBuilder = models.query(ctx.model.qualifiedName).filter({ id });

      if (parsed.fields.length > 0) {
        queryBuilder = queryBuilder.fields(parsed.fields);
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

      if (parsed.includes.length > 0) {
        await resolveIncludes(
          [record],
          parsed.includes,
          ctx.registry,
          ctx.db,
          ctx.model.qualifiedName,
          request,
        );
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

/** POST /model — Creates a new record after validating required fields. */
export function createHandler(ctx: HandlerContext) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const body = parseRequestBody(request);

    // Validate required fields
    const missing = findMissingRequiredFields(ctx.model, body);
    if (missing.length > 0) {
      throw new BadRequestError(
        'VALIDATION_ERROR',
        `Missing required fields: ${missing.join(', ')}`,
        missing,
      );
    }

    // Validate field rules
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

/** PUT /model/:id — Updates an existing record after verifying it exists within auth scopes. */
export function updateHandler(ctx: HandlerContext) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    if (!isValidUuid(id)) {
      throw new BadRequestError('INVALID_ID', `Invalid record ID: ${id}`);
    }

    const body = parseRequestBody(request);

    // Validate field rules
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

    // Verify record exists within auth scopes
    const existing = await models.query(ctx.model.qualifiedName).filter({ id }).first();

    if (!existing) {
      throw new NotFoundError(`Record not found: ${id}`);
    }

    // Check owner-only permission
    assertOwnership(authContext.permissions, ctx.model, existing, authContext.user?.id, 'write');

    stampUpdate(body, ctx.model, authContext);
    const record = await models.update(ctx.model.qualifiedName, id, body);

    return reply.send({ data: record });
  };
}

/** DELETE /model/:id — Deletes a record after verifying it exists within auth scopes. */
export function deleteHandler(ctx: HandlerContext) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    if (!isValidUuid(id)) {
      throw new BadRequestError('INVALID_ID', `Invalid record ID: ${id}`);
    }

    const authContext = getAuthContext(request);
    const models = createModelAccess({ ...ctx.modelAccessOpts, auth: authContext });

    // Verify record exists within auth scopes
    const existing = await models.query(ctx.model.qualifiedName).filter({ id }).first();

    if (!existing) {
      throw new NotFoundError(`Record not found: ${id}`);
    }

    // Check owner-only permission
    assertOwnership(authContext.permissions, ctx.model, existing, authContext.user?.id, 'delete');

    await models.delete(ctx.model.qualifiedName, id);

    return reply.status(204).send();
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUuid(value: string): boolean {
  return UUID_RE.test(value);
}
