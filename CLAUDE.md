# Rangka Framework

A modular ERP framework built with TypeScript. Monorepo managed with pnpm workspaces and Turborepo.

## Project Structure

```
packages/
  shared/     — Contract layer: types, builders, traits (zero runtime deps)
  core/       — Server runtime: boot, registries, DB sync, API routes, hooks, auth
  client/     — Browser SPA: widget renderer, shell, data hooks, routing
  cli/        — CLI tool for scaffolding and running apps
  studio-core/ — AI studio runtime (agent engine, tools, file watcher)
  studio-local/ — Local studio UI
  rangka/     — Distribution package (re-exports core + shared)
tests/
  integration/  — Integration tests (real PostgreSQL, run sequentially)
  fixtures/     — Test app fixtures (basic-app, erp-app)
docs/           — VitePress documentation
dev/            — Development playground app (gitignored)
```

## Package dependency graph

```
shared ← core ← cli
shared ← client
shared ← studio-core ← studio-local
shared ← rangka (re-exports core + shared)
```

Import rules:

- `shared` imports from nothing (it is the base)
- `core` imports from `shared` only
- `client` imports from `shared` only (never from `core` — browser vs server boundary)
- `cli` imports from `core` and `shared`
- `studio-core` imports from `shared` and `core`
- Never create circular imports between packages

## Public API boundary

The framework has two audiences. Know which one you're affecting:

| Audience                   | What they use                                                                                      | Packages                                               |
| -------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **App developers**         | `defineModel`, `defineHooks`, `defineService`, `definePage`, builders, `FrameworkContext` in hooks | `@rangka/shared` exports, `FrameworkContext` interface |
| **Framework contributors** | Internal registries, model-api, hook pipeline, widget renderer, boot sequence                      | Everything in `core/src/`, `client/src/`               |

Rules:

- Interfaces in `@rangka/shared/src/types/` are the public contract. Breaking them breaks every app.
- `FrameworkContext` (`shared/src/types/context.ts`) is the most sensitive interface. Every hook, service, and job receives it.
- `WidgetProps` (`client/src/widgets/types.ts`) is the widget contract. Every widget component depends on it.
- `BootPayload` (`shared/src/types/boot.ts`) bridges server and client. Changing it requires updating both.

## Cross-package modification rules

When changing code that crosses package boundaries:

1. **Changing a type in `shared`** → rebuild shared first, then check all consumers compile: `pnpm build`
2. **Adding a field to `FrameworkContext`** → update `shared/src/types/context.ts` + `core/src/hooks/context.ts` + `core/src/context.ts`
3. **Adding a field to `WidgetProps`** → update `client/src/widgets/types.ts` + verify all widget components handle it
4. **Adding a new `WidgetAction`** → update `shared/src/types/widget.ts` union + `client/src/widgets/action/dispatcher.ts`
5. **Adding a field to `BootPayload`** → update `shared/src/types/boot.ts` + `core/src/api/meta-handler.ts` + `client/src/boot/`
6. **Renaming or removing anything in `shared`** → grep the entire monorepo, update all consumers in the same commit

Always run `pnpm build` after cross-package changes. Type errors in downstream packages mean you missed a consumer.

## Reusable logic (don't reinvent)

Before writing new code, check if it already exists:

| Need                                    | Use this                           | Package                               |
| --------------------------------------- | ---------------------------------- | ------------------------------------- |
| Fetch single record (client)            | `useModelRecord`                   | `client/src/widgets/data/`            |
| Fetch list with filters (client)        | `useModelQuery`                    | `client/src/widgets/data/`            |
| Bind widget to field value              | `useBind`                          | `client/src/widgets/hooks/`           |
| Dispatch widget actions                 | `useTriggerHandlers`               | `client/src/widgets/hooks/`           |
| CRUD with scopes + permissions (server) | `ctx.models` / `createModelAccess` | `core/src/model-api/`                 |
| Build FrameworkContext for hooks        | `createHookContext`                | `core/src/hooks/context.ts`           |
| Emit events in a transaction            | `ctx.events.emit`                  | `core/src/events/bus.ts`              |
| Enqueue background jobs                 | `ctx.enqueue`                      | `core/src/jobs/enqueue.ts`            |
| Call another service                    | `ctx.service(name)`                | `core/src/services/registry.ts`       |
| Filter/sort/paginate queries            | `ModelQueryBuilder`                | `core/src/model-api/query-builder.ts` |

If you find yourself writing logic that does the same thing as one of these, stop and use the existing one.

## Tech Stack

- **Runtime:** Node.js >= 20
- **Language:** TypeScript (strict)
- **Package Manager:** pnpm (always use `pnpm`, never npm/yarn)
- **Monorepo:** Turborepo
- **Database:** PostgreSQL, Kysely query builder
- **API:** Fastify
- **Frontend:** React 19, TanStack Router, TanStack Query, Tailwind CSS v4
- **Testing:** Vitest
- **Linting:** ESLint + Prettier
- **Git Hooks:** Husky + lint-staged

## Commands

```bash
pnpm build              # Build all packages (turbo)
pnpm test               # Run unit tests across all packages
pnpm test:integration   # Run integration tests (sequential, real DB)
pnpm lint               # Lint all packages
pnpm format             # Format with prettier
pnpm dev                # Dev mode (watch)
```

Per-package (from package dir):

```bash
pnpm vitest run                    # Unit tests
pnpm vitest run src/path/file.ts   # Single test file
pnpm tsc --build                   # Type check / compile
```

## Rules

- Never commit without explicit user approval. Stage changes and describe what's ready, but wait for the user to say "commit" before running `git commit`.
- Always use `pnpm` for all package operations
- After finishing any task: run build, tests, and lint before claiming done
  - `pnpm build` must pass with 0 TS errors
  - `pnpm test` (unit tests) must pass
  - Integration tests: `pnpm test:integration` (requires running PostgreSQL)
- Integration tests import from compiled `dist/` — rebuild core before running them
- Integration tests cannot run in parallel (shared DB) — they use `tests/vitest.config.ts` with `fileParallelism: false`
- Lint-staged runs on commit (eslint --fix + prettier) — fix lint issues before committing
- Read the relevant package CLAUDE.md before modifying code in that package
- Read existing code in the same directory before writing new code — match patterns, reuse hooks

## Architecture Notes

- Models are defined declaratively in YAML fixtures, resolved at boot into `ResolvedModel`
- `SchemaRegistry` holds all resolved models, relationships, and field metadata
- `DatabaseClient` wraps Kysely and auto-resolves qualified model names (e.g., `sales.invoice`) to table names (`sales__invoice`)
- `DiffEngine` compares desired schema vs actual DB state, produces DDL operations
- `autoSync` applies DDL operations at boot (non-destructive by default)
- Traits (`timestamped`, `soft_delete`) auto-add fields and behavior to models
- Hooks (validate, beforeSave, afterSave, beforeDelete, afterDelete) run in a transactional pipeline
- Auth: JWT sessions, permission registry, scoped queries, field-level permissions
- Widgets: declarative UI nodes rendered by the client, all share `WidgetProps` contract
- Services: named business logic units receiving `FrameworkContext`, callable from hooks/jobs/other services
