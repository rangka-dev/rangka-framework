---
name: extend-core
description: Extending or modifying @rangka/core internals (registries, handlers, boot, context). Use when contributing to the framework itself.
---

## Before you write any code

You are modifying framework internals. App developers depend on the public API staying stable. Every change must preserve existing behavior unless intentionally breaking (with migration path).

1. Identify what you are changing:
   - A registry (SchemaRegistry, HookRegistry, PermissionRegistry, etc.)
   - The boot sequence (`src/boot/index.ts`)
   - The route generator (`src/api/route-generator.ts`)
   - The hook pipeline (`src/hooks/executor.ts`, `src/hooks/middleware.ts`)
   - FrameworkContext (`@rangka/shared` types/context.ts + `src/hooks/context.ts`)
   - Model access layer (`src/model-api/`)

2. Read the public API surface that consumers use:
   - `FrameworkContext` in `@rangka/shared/src/types/context.ts` — hooks, services, and jobs receive this
   - `ModelAccessInterface` / `ModelQueryInterface` in the same file — the query API app devs call
   - `defineHooks`, `defineService`, `defineJob` in `@rangka/shared/src/define.ts` — app definition API
   - `BootPayload` in `@rangka/shared/src/types/boot.ts` — what the client receives at startup

3. Search for all consumers before modifying:
   ```bash
   grep -r "ctx.models" packages/core/src/
   grep -r "FrameworkContext" packages/
   grep -r "SchemaRegistry" packages/core/src/
   ```

## Extending a registry

Registries are singleton objects created during boot. They hold runtime state.

Pattern for adding a method:

1. Add the method to the registry class (e.g., `src/schema/registry.ts`)
2. If the method is exposed to app devs via FrameworkContext, update the interface in `@rangka/shared`
3. Verify all existing tests still pass
4. Add a test for the new method

Pattern for adding a new registry:

1. Create in its own file under the relevant domain (e.g., `src/notifications/registry.ts`)
2. Instantiate in `src/boot/index.ts` during the boot sequence
3. Wire into `FrameworkContext` if app devs need access
4. Update `@rangka/shared` types if the interface is public

## Modifying FrameworkContext

This is the most sensitive change. Every hook, service, and job receives this object.

Adding a new field:

1. Add the field to `FrameworkContext` in `@rangka/shared/src/types/context.ts`
2. Make it optional if not all consumers need it (backward compatible)
3. Build it in `src/hooks/context.ts` (`createHookContext`) AND `src/context.ts` (`createFrameworkContext`)
4. Rebuild shared first, then core: `pnpm --filter @rangka/shared build && pnpm --filter @rangka/core build`
5. Verify no type errors across the monorepo: `pnpm build`

Modifying an existing field's type:

- Breaking change. Grep all usages across the monorepo. Update every consumer in the same PR.

## Modifying the hook pipeline

The hook pipeline is in `src/hooks/executor.ts` and `src/hooks/middleware.ts`.

- `executor.ts` — runs hook chains (validate → before → after) in sequence
- `middleware.ts` — Fastify request handlers that orchestrate the full CRUD + hooks flow

Rules:

- Hook phases are fixed: validate, beforeCreate, beforeUpdate, beforeSave, afterCreate, afterUpdate, afterSave, beforeDelete, afterDelete
- Do NOT add new phases without updating `HookLifecycle` type in `src/hooks/types.ts` AND the executor
- The middleware functions (`withHooksCreate`, `withHooksUpdate`, `withHooksDelete`) are the authoritative CRUD handlers. Never create a parallel CRUD path.

## Modifying the route generator

`src/api/route-generator.ts` auto-generates REST routes for all models.

- It uses `withHooksCreate/Update/Delete` from `src/hooks/middleware.ts` for mutations
- It uses `listHandler/getHandler` from `src/api/handlers.ts` for reads
- Auth/scope/permission guards are applied as Fastify preHandler hooks

To add a new capability to all model routes (e.g., new query parameter, new response field):

1. Modify the relevant handler in `src/api/handlers.ts`
2. Update OpenAPI schema generation if applicable (`src/api/openapi-schema.ts`)
3. Test with integration tests

To add a non-model route (e.g., `/api/meta/...`):

- Add it inside `generateRoutes()` alongside the existing meta/session routes

## Modifying model-api

The model access layer (`src/model-api/`) is the query engine.

- `query-builder.ts` — ModelQueryBuilder (fluent API for filtering/sorting/pagination)
- `filter-translator.ts` — converts API filter syntax to Kysely where clauses
- `filter-applier.ts` — applies filter conditions to a query
- `scope-enforcer.ts` — enforces tenant/scope/field-level permissions
- `include-resolver.ts` — resolves relationship includes
- `field-access.ts` — strips hidden fields, enforces readOnly

Rules:

- New filter operators go in `filter-translator.ts`
- New query capabilities go as methods on `ModelQueryBuilder`
- Never bypass scope enforcement — if you need unscoped access, use `.unscoped()` explicitly
- The `ModelAccessInterface` in `@rangka/shared` is the public contract. Adding a method there is fine (additive). Changing signatures is breaking.

## Anti-patterns

| Anti-pattern                                                       | Correct approach                                   |
| ------------------------------------------------------------------ | -------------------------------------------------- |
| New CRUD handler that skips hooks                                  | Use `withHooksCreate/Update/Delete`                |
| Custom filter logic in a route handler                             | Add to `filter-translator.ts`                      |
| Direct Kysely queries for model CRUD in handlers                   | Use model-api through the existing handler pattern |
| New singleton that duplicates a registry's purpose                 | Extend the existing registry                       |
| Modifying `FrameworkContext` in core without updating shared types | Always update `@rangka/shared` first               |
| Adding a field to `BootPayload` without updating client consumer   | Check `packages/client/src/boot/`                  |

## Checklist

- [ ] Identified all consumers of the changed API (grep across monorepo)
- [ ] Public interfaces in `@rangka/shared` updated if needed
- [ ] `createHookContext()` and `createFrameworkContext()` both updated if FrameworkContext changed
- [ ] No parallel code paths introduced (no duplicate CRUD, no duplicate registries)
- [ ] Existing tests pass: `pnpm test`
- [ ] Integration tests pass: `pnpm test:integration`
- [ ] Full monorepo builds: `pnpm build`
