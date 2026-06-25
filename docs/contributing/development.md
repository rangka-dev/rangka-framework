---
status: stable
since: 0.1.0
last-updated: 2026-06-20
description: Dev environment setup for framework contributors
---

# Development Setup

How to set up your local environment for working on the Rangka framework.

## Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** 9.15.4+ (corepack or standalone install)
- **Docker** (for PostgreSQL, only needed for integration tests)
- **Git**

## Initial Setup

```bash
git clone <repo-url> rangka
cd rangka

# Enable corepack for pnpm version management
corepack enable

# Install dependencies
pnpm install

# Start PostgreSQL
docker compose up -d

# Build all packages
pnpm build
```

## Database

Docker Compose provides PostgreSQL 16:

```bash
docker compose up -d
```

This starts Postgres on port 5432 with:

- Database: `rangka_dev`
- User: `rangka`
- Password: `rangka`

The dev server auto-syncs the database schema on boot. No manual migrations needed.

To reset the database:

```bash
docker compose down -v
docker compose up -d
```

## Commands

| Command                 | Purpose                              |
| ----------------------- | ------------------------------------ |
| `pnpm build`            | Build all packages (Turborepo)       |
| `pnpm test`             | Run unit tests across all packages   |
| `pnpm test:integration` | Integration tests (needs PostgreSQL) |
| `pnpm lint`             | Lint all packages                    |
| `pnpm format`           | Format with Prettier                 |
| `pnpm dev`              | Dev mode (watch)                     |
| `pnpm dev:client`       | Vite dev server on port 5173         |
| `pnpm docs:dev`         | Documentation dev server             |

Per-package:

```bash
pnpm --filter @rangka/core build
pnpm --filter @rangka/core test
pnpm --filter @rangka/core test -- --watch
pnpm --filter @rangka/core test -- src/__tests__/schema-registry.test.ts
```

## Running Tests

Tests use Vitest with a workspace config:

```bash
# All unit tests
pnpm test

# Single package
pnpm --filter @rangka/core test

# Integration tests (requires running PostgreSQL)
pnpm test:integration

# Watch mode
pnpm --filter @rangka/core test -- --watch

# Single file
pnpm --filter @rangka/core test -- src/__tests__/schema-registry.test.ts
```

Integration tests (`tests/integration/`) boot the full framework against `tests/fixtures/basic-app/` and require PostgreSQL. They run sequentially (shared DB state) and import from compiled `dist/`. Always rebuild core before running them.

## Development Workflow

### Working on packages/shared

Type changes require rebuilding all downstream packages:

```bash
pnpm --filter @rangka/shared build
pnpm build  # Rebuild everything that depends on shared
```

Run `pnpm build` after any type change to catch downstream breaks immediately.

### Working on packages/core

```bash
# Watch tests while editing
pnpm --filter @rangka/core test -- --watch

# Run integration tests after changes
pnpm --filter @rangka/core build && pnpm test:integration
```

Read the `packages/core/CLAUDE.md` for internal patterns. Key rules:

- All data access goes through `ctx.models`
- All hooks/services receive `FrameworkContext`. Use it, don't recreate it.
- Registries are singletons. Extend them, don't create parallels.

### Working on packages/client

```bash
# Start dev server with HMR
pnpm dev:client
```

Read `packages/client/CLAUDE.md` for widget system internals. Key rules:

- All widgets use `WidgetProps` unchanged
- All data binding goes through `useBind`
- All triggers fire through `on.*` handlers
- Shared hooks must be reused, never duplicated

### Working on packages/cli

The CLI is a thin orchestration layer. It calls into `@rangka/core` for boot logic.

```bash
pnpm --filter @rangka/cli build
pnpm --filter @rangka/cli test
```

### Working on packages/studio-core

```bash
pnpm --filter @rangka/studio-core build
pnpm --filter @rangka/studio-core dev    # Direct dev server
```

All framework interaction goes through `RuntimeManager`. Protocol types live in `protocol.ts`.

### Working on packages/studio-local

```bash
pnpm --filter @rangka/studio-local dev   # Vite HMR
```

All state goes through `useStudio()`. Protocol types imported from `@rangka/studio-core/protocol`.

## Cross-Package Changes

When a change spans multiple packages:

1. Start with `@rangka/shared` if types are involved
2. Rebuild shared: `pnpm --filter @rangka/shared build`
3. Update downstream consumers (core, client, etc.)
4. Run `pnpm build` to verify the full monorepo compiles
5. Run `pnpm test` to catch regressions

Common cross-package scenarios:

| Change                          | Files to update                                                         |
| ------------------------------- | ----------------------------------------------------------------------- |
| New field on `FrameworkContext` | `shared/types/context.ts` + `core/hooks/context.ts` + `core/context.ts` |
| New `WidgetAction` variant      | `shared/types/widget.ts` + `client/widgets/action/dispatcher.ts`        |
| New field on `WidgetProps`      | `client/widgets/types.ts` + all widget components                       |
| New field on `BootPayload`      | `shared/types/boot.ts` + `core/api/meta-handler.ts` + `client/boot/`    |

## TypeScript Configuration

Project references with shared base config:

- Target: ES2022
- Module: NodeNext
- Strict mode enabled
- Declaration maps for cross-package go-to-definition

## Debugging Tips

### API issues

Swagger UI is available at `/api/docs` when the dev server runs. Browse all generated routes and test interactively.

### Schema resolution

If models aren't appearing or fields are wrong:

1. Check the scanner found the file (correct path pattern)
2. Check `mergeSchemas()` applied extensions in the right order
3. Add logging in `packages/core/src/boot/index.ts` to trace boot

### Database sync

If schema drift occurs:

1. Check `DiffEngine` output (logs planned operations)
2. Reset: `docker compose down -v && docker compose up -d`
3. Restart dev server to trigger fresh auto-sync

### Frontend boot

If the shell isn't loading:

1. Check Network tab for `/api/meta/boot` response
2. Verify auth token in localStorage
3. Check `useBoot()` state transitions in React DevTools

### Widget not rendering

1. Check the widget is registered in `widgets/components/register.ts`
2. Check `widgetMeta.name` matches the type used in the page definition
3. Check WidgetRenderer console for `Unknown widget: ...` errors
