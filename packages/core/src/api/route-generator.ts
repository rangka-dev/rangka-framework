import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { SchemaRegistry } from '../schema/registry.js';
import type { DatabaseClient } from '../db/client.js';
import type { PermissionRegistry } from '../auth/permission-registry.js';
import type { HookRegistry } from '../hooks/registry.js';
import type { ServiceRegistry } from '../services/registry.js';
import type { EventBus } from '../events/bus.js';
import type { ResolvedModel } from '../schema/types.js';
import { KyselyModelOps } from '../db/model-ops.js';
import type { ModelOps } from '../model-api/types.js';
import type { ModelAccessOptions } from '../model-api/types.js';
import {
  listHandler,
  getHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} from './handlers.js';
import { createAuthHook, createSessionHandler, deleteSessionHandler } from '../auth/session.js';
import { createModelPermissionGuard } from '../auth/model-permissions.js';
import { createScopeHook, createScopeWriteGuard } from '../auth/scopes.js';
import type { ScopeRegistry } from '../auth/scope-registry.js';
import { createFieldWriteGuard, createFieldStripHook } from '../auth/field-permissions.js';
import { withHooksCreate, withHooksUpdate, withHooksDelete } from '../hooks/middleware.js';
import {
  modelToSchemaComponent,
  modelToCreateSchema,
  modelToUpdateSchema,
} from './openapi-schema.js';
import { createMetaBootHandler } from './meta-handler.js';
import type { MetaBootContext } from './meta-handler.js';
import type { ModuleConfig, PageDefinition, WidgetDefinitionMeta } from '@rangka/shared';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RouteGeneratorOptions {
  permissionRegistry?: PermissionRegistry;
  hookRegistry?: HookRegistry;
  serviceRegistry?: ServiceRegistry;
  eventBus?: EventBus;
  scopeRegistry?: ScopeRegistry;
  config?: Record<string, unknown>;
  pages?: Array<{ module: string; page: PageDefinition }>;
  modules?: ModuleConfig[];
  widgets?: WidgetDefinitionMeta[];
  adapterRegistry?: import('../plugins/adapter-registry.js').AdapterRegistry;
  adapterCapabilities?: Record<string, import('../plugins/types.js').AdapterCapability[]>;
}

/** Context passed to lifecycle hook middleware (create/update/delete with hooks). */
interface HookMiddlewareContext {
  model: ResolvedModel;
  registry: SchemaRegistry;
  db: import('kysely').Kysely<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  ops: ModelOps;
  hookRegistry: HookRegistry;
  serviceRegistry?: ServiceRegistry;
  eventBus?: EventBus;
  config: Record<string, unknown>;
}

/** Context for registering all routes belonging to a single model. */
interface ModelRouteContext {
  registry: SchemaRegistry;
  db: DatabaseClient;
  permissionRegistry?: PermissionRegistry;
  hookRegistry?: HookRegistry;
  serviceRegistry?: ServiceRegistry;
  eventBus?: EventBus;
  scopeRegistry?: ScopeRegistry;
  config: Record<string, unknown>;
}

/** Extended context for external model routes. */
interface ExternalModelRouteContext extends ModelRouteContext {
  adapterRegistry?: import('../plugins/adapter-registry.js').AdapterRegistry;
  adapterCapabilities?: Record<string, import('../plugins/types.js').AdapterCapability[]>;
}

// ─── Main entry point ────────────────────────────────────────────────────────

/**
 * Registers all REST routes for every model in the schema registry,
 * plus session and meta routes.
 */
export function generateRoutes(
  server: FastifyInstance,
  registry: SchemaRegistry,
  db: DatabaseClient,
  options?: RouteGeneratorOptions,
): void {
  const permissionRegistry = options?.permissionRegistry;
  const hookRegistry = options?.hookRegistry;
  const serviceRegistry = options?.serviceRegistry;
  const eventBus = options?.eventBus;
  const scopeRegistry = options?.scopeRegistry;
  const config = options?.config ?? {};

  registerSessionRoutes(server, db, permissionRegistry);
  registerMetaRoute(server, db, registry, permissionRegistry, options);

  for (const [module, models] of registry.getModelsByModule()) {
    for (const model of models) {
      // Session model has dedicated routes above; skip it here.
      if (model.qualifiedName === 'core.session') continue;

      if (model.source) {
        registerExternalModelRoutes(server, model, module, {
          registry,
          db,
          permissionRegistry,
          hookRegistry,
          serviceRegistry,
          eventBus,
          scopeRegistry,
          config,
          adapterRegistry: options?.adapterRegistry,
          adapterCapabilities: options?.adapterCapabilities,
        });
      } else {
        registerModelRoutes(server, model, module, {
          registry,
          db,
          permissionRegistry,
          hookRegistry,
          serviceRegistry,
          eventBus,
          scopeRegistry,
          config,
        });
      }
    }
  }
}

// ─── Session routes (login/logout) ───────────────────────────────────────────

function registerSessionRoutes(
  server: FastifyInstance,
  db: DatabaseClient,
  permissionRegistry?: PermissionRegistry,
) {
  server.post('/api/core/session', createSessionHandler(db));

  if (permissionRegistry) {
    server.delete('/api/core/session', {
      onRequest: createAuthHook(db, permissionRegistry),
      handler: deleteSessionHandler(db),
    });
  }
}

// ─── Meta boot route (provides UI shell config) ─────────────────────────────

function registerMetaRoute(
  server: FastifyInstance,
  db: DatabaseClient,
  registry: SchemaRegistry,
  permissionRegistry?: PermissionRegistry,
  options?: RouteGeneratorOptions,
) {
  if (!permissionRegistry || !options?.pages || !options?.modules) return;

  const metaCtx: MetaBootContext = {
    schemaRegistry: registry,
    pages: options.pages,
    modules: options.modules,
    widgets: options.widgets,
  };

  server.get('/api/meta/boot', {
    onRequest: createAuthHook(db, permissionRegistry),
    schema: { tags: ['meta'] },
    handler: createMetaBootHandler(metaCtx),
  });
}

// ─── Per-model CRUD routes ───────────────────────────────────────────────────

/** Registers list, get, create, update, delete routes for a model. */
function registerModelRoutes(
  server: FastifyInstance,
  model: ResolvedModel,
  module: string,
  ctx: ModelRouteContext,
) {
  const basePath = `/api/${module}/${model.name}`;
  const authHooks = buildAuthHooks(model, ctx);
  const schemas = buildRouteSchemas(model, module);
  const modelAccessOpts: Omit<ModelAccessOptions, 'auth'> = { db: ctx.db, registry: ctx.registry };
  const handlerCtx = { model, registry: ctx.registry, db: ctx.db.kysely, modelAccessOpts };

  const modelHasHooks = ctx.hookRegistry?.hasHooks(model.qualifiedName) ?? false;
  const hookMiddlewareCtx: HookMiddlewareContext = {
    model,
    registry: ctx.registry,
    db: ctx.db.kysely,
    ops: new KyselyModelOps({ db: ctx.db, model, registry: ctx.registry }),
    hookRegistry: ctx.hookRegistry!,
    serviceRegistry: ctx.serviceRegistry,
    eventBus: ctx.eventBus,
    config: ctx.config,
  };

  // Read endpoints
  server.get(basePath, { ...authHooks, schema: schemas.list, handler: listHandler(handlerCtx) });
  server.get(`${basePath}/:id`, {
    ...authHooks,
    schema: schemas.get,
    handler: getHandler(handlerCtx),
  });

  // Write endpoints (use hook middleware when lifecycle hooks are registered)
  server.post(basePath, {
    ...authHooks,
    schema: schemas.create,
    handler: modelHasHooks ? withHooksCreate(hookMiddlewareCtx) : createHandler(handlerCtx),
  });

  server.put(`${basePath}/:id`, {
    ...authHooks,
    schema: schemas.update,
    handler: modelHasHooks ? withHooksUpdate(hookMiddlewareCtx) : updateHandler(handlerCtx),
  });

  server.delete(`${basePath}/:id`, {
    ...authHooks,
    schema: schemas.delete,
    handler: modelHasHooks ? withHooksDelete(hookMiddlewareCtx) : deleteHandler(handlerCtx),
  });
}

// ─── External model routes (capability-gated, no hooks) ────────────────────

/** Registers routes for an external model, limited by adapter capabilities. */
function registerExternalModelRoutes(
  server: FastifyInstance,
  model: ResolvedModel,
  module: string,
  ctx: ExternalModelRouteContext,
) {
  const basePath = `/api/${module}/${model.name}`;
  const authHooks = buildAuthHooks(model, ctx);
  const schemas = buildRouteSchemas(model, module);
  const modelAccessOpts: Omit<ModelAccessOptions, 'auth'> = {
    db: ctx.db,
    registry: ctx.registry,
    adapterRegistry: ctx.adapterRegistry,
    adapterCapabilities: ctx.adapterCapabilities,
  };
  const handlerCtx = { model, registry: ctx.registry, db: ctx.db.kysely, modelAccessOpts };

  const capabilities = new Set(ctx.adapterCapabilities?.[model.source!] ?? ['read']);

  // GET single is always available (read is required for all adapters)
  server.get(`${basePath}/:id`, {
    ...authHooks,
    schema: schemas.get,
    handler: getHandler(handlerCtx),
  });

  // GET list requires 'list' capability
  if (capabilities.has('list') || capabilities.has('read')) {
    server.get(basePath, { ...authHooks, schema: schemas.list, handler: listHandler(handlerCtx) });
  }

  // POST create requires 'create' capability
  if (capabilities.has('create')) {
    server.post(basePath, {
      ...authHooks,
      schema: schemas.create,
      handler: createHandler(handlerCtx),
    });
  }

  // PUT update requires 'update' capability
  if (capabilities.has('update')) {
    server.put(`${basePath}/:id`, {
      ...authHooks,
      schema: schemas.update,
      handler: updateHandler(handlerCtx),
    });
  }

  // DELETE requires 'delete' capability
  if (capabilities.has('delete')) {
    server.delete(`${basePath}/:id`, {
      ...authHooks,
      schema: schemas.delete,
      handler: deleteHandler(handlerCtx),
    });
  }
}

// ─── Auth hook assembly ──────────────────────────────────────────────────────

/** Builds the full set of Fastify auth hooks (onRequest, preHandler, onSend) for a model. */
function buildAuthHooks(model: ResolvedModel, ctx: ModelRouteContext) {
  if (!ctx.permissionRegistry) return {};

  const { db, permissionRegistry, scopeRegistry } = ctx;

  const preHandler: Array<(req: FastifyRequest, rep: FastifyReply) => Promise<void>> = [
    createModelPermissionGuard(model, permissionRegistry),
  ];

  if (scopeRegistry) {
    const scopeCtx = { model, scopeRegistry, db };
    preHandler.push(createScopeHook(scopeCtx));
    preHandler.push(createScopeWriteGuard(scopeCtx));
  }

  preHandler.push(createFieldWriteGuard(model));

  return {
    onRequest: createAuthHook(db, permissionRegistry),
    preHandler,
    onSend: createFieldStripHook(model),
  };
}

// ─── Route schema definitions ────────────────────────────────────────────────

/** Builds Fastify JSON Schema objects for each CRUD operation on a model. */
function buildRouteSchemas(model: ResolvedModel, module: string) {
  const tag = module;
  const createBody = modelToCreateSchema(model);
  const updateBody = modelToUpdateSchema(model);

  const idParams = {
    type: 'object' as const,
    properties: { id: { type: 'string' as const, description: 'Record ID' } },
    required: ['id'] as const,
  };

  const listQuerystring = {
    type: 'object' as const,
    properties: {
      page: { type: 'integer' as const, default: 1, description: 'Page number' },
      limit: {
        type: 'integer' as const,
        default: 25,
        maximum: 100,
        description: 'Records per page',
      },
      sort: {
        type: 'string' as const,
        description: 'Sort fields (prefix with - for descending, comma-separated)',
      },
      fields: {
        type: 'string' as const,
        description: 'Sparse fieldset (comma-separated field names)',
      },
      include: {
        type: 'string' as const,
        description: 'Eager-load relations (comma-separated, dot notation for nested)',
      },
      includeArchived: {
        type: 'string' as const,
        description: 'Include soft-deleted (archived) records (true/false)',
      },
      search: {
        type: 'string' as const,
        description: 'Search keyword applied across searchable fields',
      },
    },
    additionalProperties: true,
  };

  return {
    list: { tags: [tag], querystring: listQuerystring },
    get: { tags: [tag], params: idParams },
    create: { tags: [tag], body: createBody },
    update: { tags: [tag], params: idParams, body: updateBody },
    delete: { tags: [tag], params: idParams },
  };
}

// ─── OpenAPI response schemas ────────────────────────────────────────────────

/** Builds OpenAPI response schemas (200, 201, 400, 404, etc.) for a model's endpoints. */
export function buildOpenApiResponseSchemas(model: ResolvedModel) {
  const responseSchema = modelToSchemaComponent(model);

  const errorResponse = {
    type: 'object' as const,
    properties: {
      error: {
        type: 'object' as const,
        properties: {
          code: { type: 'string' as const },
          message: { type: 'string' as const },
        },
      },
    },
  };

  const paginationMeta = {
    type: 'object' as const,
    properties: {
      total: { type: 'integer' as const },
      page: { type: 'integer' as const },
      limit: { type: 'integer' as const },
      totalPages: { type: 'integer' as const },
    },
  };

  return {
    list: {
      200: {
        description: 'Paginated list',
        type: 'object' as const,
        properties: {
          data: { type: 'array' as const, items: responseSchema },
          meta: paginationMeta,
        },
      },
    },
    get: {
      200: {
        description: 'Single record',
        type: 'object' as const,
        properties: { data: responseSchema },
      },
      404: errorResponse,
    },
    create: {
      201: {
        description: 'Created record',
        type: 'object' as const,
        properties: { data: responseSchema },
      },
      400: errorResponse,
    },
    update: {
      200: {
        description: 'Updated record',
        type: 'object' as const,
        properties: { data: responseSchema },
      },
      404: errorResponse,
    },
    delete: {
      204: { description: 'No content', type: 'null' as const },
      404: errorResponse,
    },
  };
}
