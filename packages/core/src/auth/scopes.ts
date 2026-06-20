/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ResolvedModel } from '../schema/types.js';
import type { DatabaseClient } from '../db/client.js';
import type { ScopeFilter, RequestContext } from './types.js';
import type { ScopeRegistry } from './scope-registry.js';
import { getAuthContext } from './session.js';
import { BadRequestError, ForbiddenError } from '../errors.js';
import { isNil } from '../helpers/coerce.js';

export { applyScopeFiltersToQuery } from './scope-filters.js';

export interface ScopeHookContext {
  model: ResolvedModel;
  scopeRegistry: ScopeRegistry;
  db: DatabaseClient;
  filterProviders?: FilterProvider[];
}

export type FilterProvider = (
  model: ResolvedModel,
  authCtx: RequestContext,
  request: FastifyRequest,
) => ScopeFilter[] | Promise<ScopeFilter[]>;

export function createScopeHook(ctx: ScopeHookContext) {
  const { model, scopeRegistry, db, filterProviders } = ctx;
  const binding = scopeRegistry.getModelBinding(model.qualifiedName);

  return async function scopeHook(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    const authCtx = getAuthContext(request);
    if (!authCtx.permissions || !authCtx.user) return;

    const filters: ScopeFilter[] = [];

    if (binding) {
      const activeValue = resolveActiveScopeValue(request, binding.scopeName, authCtx.user);
      if (!activeValue) {
        throw new BadRequestError(
          'MISSING_SCOPE',
          `Active scope value for "${binding.scopeName}" is required. Set it via X-Active-Scope header or user default.`,
        );
      }

      const exists = await validateScopeValueExists(db, binding.scopeModel, activeValue);
      if (!exists) {
        throw new BadRequestError(
          'INVALID_SCOPE',
          `Scope value "${activeValue}" does not exist in "${binding.scopeModel}".`,
        );
      }

      filters.push({ field: binding.column, operator: 'eq', value: activeValue });
    }

    if (filterProviders) {
      for (const provider of filterProviders) {
        const extra = await provider(model, authCtx, request);
        filters.push(...extra);
      }
    }

    authCtx.scopeFilters = filters;
    (request as any).authContext = authCtx;
  };
}

export function createScopeWriteGuard(ctx: ScopeHookContext) {
  const { model, scopeRegistry } = ctx;
  const binding = scopeRegistry.getModelBinding(model.qualifiedName);

  return async function scopeWriteGuard(
    request: FastifyRequest,
    _reply: FastifyReply,
  ): Promise<void> {
    if (request.method === 'GET') return;
    if (!binding) return;

    const authCtx = getAuthContext(request);
    if (!authCtx.scopeFilters?.length) return;

    const body = request.body as Record<string, unknown> | undefined;
    if (!body) return;

    const scopeFilter = authCtx.scopeFilters.find((f) => f.field === binding.column);
    if (!scopeFilter) return;

    const fieldValue = body[binding.column];

    if (request.method === 'POST') {
      if (isNil(fieldValue)) {
        body[binding.column] = scopeFilter.value;
        return;
      }
    }

    if (fieldValue !== undefined && fieldValue !== scopeFilter.value) {
      throw new ForbiddenError(
        'SCOPE_VIOLATION',
        `Cannot write to scope "${binding.scopeName}": ${binding.column} must be "${scopeFilter.value}".`,
      );
    }
  };
}

function resolveActiveScopeValue(
  request: FastifyRequest,
  scopeName: string,
  user: Record<string, unknown>,
): string | undefined {
  const headerValue = parseScopeHeader(request);
  if (headerValue?.[scopeName]) {
    return String(headerValue[scopeName]);
  }

  const defaultField = `default_${scopeName}`;
  if (user[defaultField]) {
    return String(user[defaultField]);
  }

  return undefined;
}

function parseScopeHeader(request: FastifyRequest): Record<string, string> | undefined {
  const header = request.headers['x-active-scope'];
  if (!header || typeof header !== 'string') return undefined;

  try {
    return JSON.parse(header);
  } catch {
    return undefined;
  }
}

async function validateScopeValueExists(
  db: DatabaseClient,
  scopeModel: string,
  value: string,
): Promise<boolean> {
  const result = await db
    .selectFrom(scopeModel)
    .where('id', '=', value)
    .selectAll()
    .executeTakeFirst();
  return result !== undefined;
}
