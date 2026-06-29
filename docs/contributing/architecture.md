---
status: stable
since: 0.1.0
last-updated: 2026-06-20
description: Internal architecture overview for contributors
---

# Architecture Internals

How Rangka boots, resolves metadata, serves APIs, and renders the frontend shell.

## Boot Sequence

The framework starts from the CLI and follows this path:

```
CLI start/dev command
  → ProjectScanner.scan(appRoot)
  → boot(options)
    → dependencySort(apps)
    → loadSchemas() + mergeSchemas()
    → SchemaRegistry (immutable)
    → HookRegistry, JobRegistry, ServiceRegistry, PermissionRegistry, ScopeRegistry
    → DatabaseClient → autoSync() → seedCoreData()
    → createServer() → generateRoutes()
    → PluginLifecycleManager → loadPlugins()
  → BootResult (registries + Fastify server)
```

### 1. Project Scanning

`ProjectScanner` (`packages/core/src/boot/`) performs filesystem discovery from the app root:

| Path pattern           | What it loads                |
| ---------------------- | ---------------------------- |
| `rangka.config.ts`     | Database and server settings |
| `apps/*/app.ts`        | App configs                  |
| `apps/*/models/*.ts`   | Model definitions            |
| `apps/*/hooks/*.ts`    | Lifecycle hooks              |
| `apps/*/roles.ts`      | Permission roles             |
| `apps/*/services/*.ts` | Injectable services          |
| `apps/*/jobs/*.ts`     | Background jobs              |
| `apps/*/fixtures/*.ts` | Seed data                    |
| `apps/*/pages/*.ts`    | Page definitions             |
| `extensions/*.ts`      | Field extensions             |

For multi-app setups, `NodeModulesDiscoverySource` finds dependent Rangka apps in `node_modules`. `MemoryDiscoverySource` is used in tests.

### 2. Schema Resolution

After scanning, `boot()` calls:

1. `dependencySort()` — resolves app load order from `depends[]` declarations
2. `loadSchemas()` — imports all model schema files
3. `mergeSchemas()` — applies extensions and overrides across apps

The result is an immutable `SchemaRegistry` with methods:

- `getModel(qualifiedName)` — returns `ResolvedModel` with fields + relationships
- `getAllModels()` — all models across all apps
- `getRelationships()` / `getRelationshipsForModel()` — relationship graph

### 3. Registry Initialization

After the schema is resolved, boot creates:

| Registry             | Source               | Purpose                              |
| -------------------- | -------------------- | ------------------------------------ |
| `HookRegistry`       | `hooks/*.ts` per app | validate/before/after CRUD lifecycle |
| `ServiceRegistry`    | `services/*.ts`      | Injectable business logic with DI    |
| `JobRegistry`        | `jobs/*.ts`          | Background jobs                      |
| `EventBus`           | Created at boot      | Transaction-scoped pub/sub           |
| `PermissionRegistry` | `roles.ts` per app   | Role-based model/field permissions   |
| `ScopeRegistry`      | Scope definitions    | Row-level tenant isolation           |
| `FixtureRegistry`    | `fixtures/*.ts`      | Seed data                            |
| `AdapterRegistry`    | Plugin definitions   | External data source adapters        |

### 4. Database Initialization

`DatabaseClient` wraps Kysely with the configured dialect (PostgreSQL or SQLite):

1. `SchemaToDesired()` builds target DDL from resolved models
2. `introspect()` reads current database state
3. `DiffEngine` compares actual vs desired, produces migration operations
4. `autoSync()` applies non-destructive migrations in development
5. `seedCoreData()` initializes `core.user`, `core.role`, `core.session` tables

### 5. API Server

`createServer()` returns a Fastify instance with OpenAPI 3.1:

- `generateRoutes()` mounts CRUD endpoints for every model
- Request pipeline: auth hook → permission guard → scope hook → field write guard → handler → field strip hook
- Handlers use `withHooksCreate/Update/Delete` from `hooks/middleware.ts` for mutations
- `listHandler`/`getHandler` from `api/handlers.ts` for reads

### 6. Meta Handler

`GET /api/meta/boot` serves the boot payload to the client:

1. Validates session token
2. Loads user permissions
3. Filters pages by access
4. Builds navigation tree
5. Collects model metadata (fields, relationships)
6. Returns `BootPayload`: `{ user, permissions, navigation, pages, models }`

## FrameworkContext

The single context object passed to all hooks, services, and jobs:

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

Built by `createHookContext()` in `hooks/context.ts`. All data access in hooks/services goes through `ctx.models`.

## Model Access Layer

`createModelAccess()` in `model-api/index.ts` provides the CRUD API:

- `models.get(model, id)` — fetch single record
- `models.query(model)` — fluent query with filter/sort/paginate/include
- `models.create(model, data)` — insert with scope enforcement
- `models.update(model, id, data)` — update with scope enforcement
- `models.delete(model, id)` — delete with scope enforcement

The query builder (`ModelQueryBuilder`) handles scope enforcement, field-level access, filter translation, and relationship includes automatically.

## Hook Pipeline

Hooks run inside a transaction via `hooks/executor.ts`:

1. `validate` — can throw to reject the operation
2. `beforeCreate` / `beforeUpdate` / `beforeSave` — mutate data before write
3. (database write)
4. `afterCreate` / `afterUpdate` / `afterSave` — side effects
5. `beforeDelete` → (delete) → `afterDelete`

`hooks/middleware.ts` wraps this pipeline into Fastify request handlers (`withHooksCreate`, `withHooksUpdate`, `withHooksDelete`).

## Frontend Shell

The client (`packages/client/`) consumes the boot payload and builds the UI:

```
App
  → BootProvider
    → useBoot() state machine: checking → login → loading → ready → error
    → BootGate (renders only when ready)
      → ShellProviders (MetaContext, UserContext, PermissionsContext)
        → QueryProvider (TanStack React Query)
          → RouterProvider (TanStack Router)
            → PageOutlet → WidgetRenderer
```

### Widget System

The client renders pages as widget trees using a three-layer architecture:

- **Layer 1 (shared):** `WidgetNode` tree definitions, `WidgetProps` contract, builder DSL
- **Layer 2 (client):** Controllers, renderer, state store, action dispatcher. Produces no DOM.
- **Layer 3 (ui):** UIKit implementation. Receives resolved data via `WidgetProps`, renders DOM.

Widget categories:

| Category       | Behavior                            | Examples                                           |
| -------------- | ----------------------------------- | -------------------------------------------------- |
| Leaf           | Render-only                         | input, button, badge, text                         |
| Container      | Pass-through children               | group, grid, card, section                         |
| Data-container | Controller-backed (fetch + context) | data, form, table, repeat, datagrid, modal, drawer |

The `WidgetRenderer` resolves each node:

1. Resolve visibility conditions (`useCondition`)
2. Resolve binding (`useBind`) via field/expression/model
3. Resolve triggers (`useTriggerHandlers`) via action dispatcher
4. Resolve props (expression interpolation, route params)
5. Dispatch to controller (if data-container) or UIKit component (if leaf/container)

Data-container widgets have controllers in `packages/client/src/widgets/controllers/`. Controllers fetch data, build `WidgetContext`, and delegate rendering to UIKit components. They never produce DOM directly.

All widgets receive the same `WidgetProps` interface from `@rangka/shared/src/types/ui-kit.ts`. Input widgets read from `bind.value` and write through `bind.setValue`. The `FormContext` integrates transparently through `useBind`.

### Data Layer

- `useModelRecord(model, id)` — fetch single record (TanStack Query)
- `useModelQuery(model, options)` — fetch list with magic variables ($filter, $sort, $page)
- `useSource()` / `useRecord()` / `useMutation()` — shell-level data hooks
- All backed by TanStack React Query with cache invalidation

## Studio

Rangka Studio is an AI-powered development environment:

```
studio-local (React UI)
  ↕ WebSocket
studio-core (Node.js server)
  → RuntimeManager (boots @rangka/core, introspects state)
  → AgentEngine (AI agent sessions)
  → FileWatcher (project file changes → runtime reboot)
```

Protocol messages are typed in `studio-core/src/protocol.ts`. The runtime manager provides introspection without duplicating core logic.

## Cross-Package Rules

These rules prevent architectural drift:

1. All data access in hooks/services goes through `ctx.models` (never raw Kysely for CRUD)
2. All widgets receive `WidgetProps` unchanged (never add custom React props)
3. All widgets read data through `useBind` (never bypass with direct context access)
4. All shared types live in `@rangka/shared` (never define cross-package types locally)
5. All registries are singletons created at boot (never duplicate their purpose)
6. All CRUD routes are auto-generated (never manually duplicate the pattern)
7. All protocol messages are typed in `studio-core/protocol.ts` (never redefine in studio-local)

When modifying a shared interface:

- Update `@rangka/shared` first
- Rebuild: `pnpm --filter @rangka/shared build`
- Fix all downstream consumers
- Run `pnpm build` to verify the full monorepo compiles
