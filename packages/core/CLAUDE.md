# CLAUDE.md — @rangka/core

## Package overview

The Rangka server runtime. Handles boot, schema resolution, database sync, API routing, authentication, hooks, services, jobs, events, and plugins. This is the single source of truth for all server-side behavior.

## Tech stack

- Node.js >= 20, TypeScript 5
- Fastify (HTTP server, routing, plugins)
- Kysely (query builder, migrations, transactions)
- PostgreSQL (only supported database)

## Project structure

```
src/
├── api/            — Fastify server creation, route generation, request handling
├── audit/          — Audit trail recording
├── auth/           — JWT sessions, permissions, scopes, field-level access, seed
├── boot/           — Boot sequence: discovery, schema loading, merging, registry init
├── db/             — DatabaseClient, auto-sync (DiffEngine), model-ops (Kysely CRUD)
├── events/         — EventBus (in-process pub/sub with transaction support)
├── external-model/ — Adapter-based external data sources
├── fixtures/       — Seed data loading
├── helpers/        — Shared utilities
├── hooks/          — Hook registry, executor, middleware pipeline, context builder
├── jobs/           — Job registry, worker, scheduler, enqueue
├── model-api/      — Model access layer (query builder, filters, scopes, includes)
├── plugins/        — Plugin lifecycle, adapter registry, loader
├── schema/         — SchemaRegistry, relationship resolution, types
├── services/       — ServiceRegistry, service definitions
├── validation/     — Model-level validation rules
├── widgets/        — Server-side widget registry (for studio)
├── context.ts      — FrameworkContext builder
├── errors.ts       — AppError base class
└── index.ts        — Public exports
```

## Key registries (MUST reuse, never recreate)

| Registry             | Location                      | Purpose                                                                             |
| -------------------- | ----------------------------- | ----------------------------------------------------------------------------------- |
| `SchemaRegistry`     | `schema/registry.ts`          | Holds all resolved models, relationships, field metadata. Single instance per boot. |
| `PermissionRegistry` | `auth/permission-registry.ts` | Maps roles to model/field permissions.                                              |
| `ScopeRegistry`      | `auth/scope-registry.ts`      | Defines scope filters per role (tenant isolation, ownership).                       |
| `HookRegistry`       | `hooks/registry.ts`           | Stores validate/beforeSave/afterSave/beforeDelete/afterDelete hooks per model.      |
| `ServiceRegistry`    | `services/registry.ts`        | Named service definitions, instantiated with context on call.                       |
| `JobRegistry`        | `jobs/registry.ts`            | Background job handlers.                                                            |
| `EventBus`           | `events/bus.ts`               | In-process event pub/sub with transaction-scoped emit.                              |
| `AdapterRegistry`    | `plugins/adapter-registry.ts` | External data source adapters (REST, GraphQL, etc).                                 |
| `WidgetRegistry`     | `widgets/widget-registry.ts`  | Server-side widget definitions for studio.                                          |

## Model access layer

All CRUD operations go through `createModelAccess()` in `model-api/index.ts`. This provides:

- `models.get(model, id)` — fetch single record
- `models.query(model)` — returns a `ModelQueryBuilder` with filter/sort/paginate/include
- `models.create(model, data)` — insert with auth context
- `models.update(model, id, data)` — update with auth context
- `models.delete(model, id)` — delete with auth context

The query builder handles:

- Scope enforcement (`scope-enforcer.ts`) — auto-applies tenant/ownership filters
- Field-level access (`field-access.ts`) — strips hidden fields, enforces readOnly
- Filter translation (`filter-translator.ts`) — converts API filter syntax to Kysely where clauses
- Include resolution (`include-resolver.ts`) — resolves relationships and external model joins

Never write raw Kysely queries for model CRUD. Use `createModelAccess` or the existing `KyselyModelOps`.

## Hook pipeline

Hooks run inside a transaction via `hooks/executor.ts`:

1. `validate` — can throw to reject the operation
2. `beforeCreate` / `beforeUpdate` / `beforeSave` — can mutate the data before write
3. (database write happens here)
4. `afterCreate` / `afterUpdate` / `afterSave` — side effects after successful write
5. `beforeDelete` / `afterDelete` — same pattern for deletes

Hooks receive a `FrameworkContext` built by `hooks/context.ts`. This context provides: `db` (transaction), `schema`, `auth`, `models`, `events`, `config`, `service`, `enqueue`.

Never create a parallel context builder. Use `createHookContext()`.

## FrameworkContext (quick reference)

This is the single object passed to all hooks, services, and jobs. Defined in `@rangka/shared/src/types/context.ts`, built by `src/hooks/context.ts`.

```typescript
interface FrameworkContext {
  db: Kysely<unknown>; // transaction-scoped connection
  schema: SchemaRegistryInterface; // model/field/relationship lookups
  scope: unknown; // current tenant/scope value
  models: ModelAccessInterface; // CRUD with scopes + permissions
  events: { emit; on }; // transaction-scoped pub/sub
  auth: { user; roles }; // current user identity
  config: Record<string, unknown>; // app configuration
  service: (name) => ServiceInstance; // call other services
  enqueue: (job, data, opts?) => Promise<void>; // background jobs
  notify: (channel, message) => void;
  email: { send: (template, options) => Promise<void> };
}
```

Rules:

- All data access goes through `ctx.models` (not raw Kysely for CRUD)
- All events go through `ctx.events.emit` (not custom pub/sub)
- All background work goes through `ctx.enqueue` (not custom dispatchers)
- All cross-service calls go through `ctx.service(name)` (not direct imports)
- Use `ctx.db` directly ONLY for queries ModelQueryInterface cannot express (aggregations, complex joins)

## Helper utilities (MUST reuse)

| Utility                             | Location                        | Purpose                                       |
| ----------------------------------- | ------------------------------- | --------------------------------------------- |
| `stampCreate`                       | `helpers/stamping.ts`           | Adds `created_at`, `created_by` fields        |
| `stampUpdate`                       | `helpers/stamping.ts`           | Adds `updated_at`, `updated_by` fields        |
| `assertOwnership`                   | `helpers/assert-ownership.ts`   | Verifies record belongs to current user/scope |
| `findMissingRequiredFields`         | `helpers/validation.ts`         | Checks required fields before write           |
| `validateFields`                    | `validation/field-validator.ts` | Validates field values against schema         |
| `BadRequestError` / `NotFoundError` | `errors.ts`                     | Standard error classes for API responses      |
| `AppError`                          | `errors.ts`                     | Base error class with code + status           |

Never recreate validation, stamping, or ownership logic. These helpers are used by the middleware layer and must be consistent.

## Boot sequence

`boot/index.ts` orchestrates startup:

1. Discover apps (file system or programmatic)
2. Load and merge schemas (YAML model definitions)
3. Build SchemaRegistry with resolved relationships
4. Create DatabaseClient, run autoSync (DDL diff)
5. Create Fastify server
6. Register all registries (hooks, services, jobs, permissions, scopes, events)
7. Generate API routes from resolved models
8. Load and initialize plugins

## API route generation

`api/route-generator.ts` auto-generates REST endpoints for every model:

- `GET /api/{module}/{model}` — list with filters, sort, pagination
- `GET /api/{module}/{model}/:id` — get by ID
- `POST /api/{module}/{model}` — create
- `PATCH /api/{module}/{model}/:id` — update
- `DELETE /api/{module}/{model}/:id` — delete

Custom routes are added via services or plugins. Never duplicate the auto-generated CRUD pattern.

## Commands

```bash
pnpm --filter @rangka/core build    # Build → dist/
pnpm --filter @rangka/core test     # Unit tests
pnpm test:integration               # Integration tests (from repo root, needs PostgreSQL)
pnpm test:integration -- tests/integration/path/to/file.test.ts  # Single integration test
```

## Skills available

- **`extend-core`** — step-by-step for modifying core internals (registries, hook pipeline, route generator, FrameworkContext)

Read this skill before modifying any core internal.

## Don'ts

- Don't write raw SQL — use Kysely query builder via `DatabaseClient` or `KyselyModelOps`
- Don't bypass `createModelAccess` for CRUD — it enforces scopes and permissions
- Don't create new registries — extend existing ones or add methods to them
- Don't build a new context object — use `createHookContext()` or `createFrameworkContext()`
- Don't add Fastify routes manually — use the route generator or service system
- Don't duplicate filter/sort/pagination logic — use `ModelQueryBuilder`
- Don't access `SchemaRegistry` fields directly — use its methods (`getModel`, `getRelationships`, etc.)
- Don't add new hook phases — use the existing validate/beforeSave/afterSave/beforeDelete/afterDelete
- Don't create new transaction boundaries inside hooks — hooks already run in a transaction
- Don't import from `@rangka/client` — this is a server package, client is browser-only
