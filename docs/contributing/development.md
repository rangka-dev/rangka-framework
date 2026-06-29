---
status: stable
since: 0.1.0
last-updated: 2026-06-20
description: Dev environment setup for framework contributors
---

# Development Setup

How to set up your local environment for working on the Rangka framework.

## Prerequisites

- Node.js >= 20.0.0
- pnpm 9.15.4+ (corepack or standalone install)
- Docker (for PostgreSQL integration tests)
- Git

## Initial setup

```bash
git clone <repo-url> rangka
cd rangka
corepack enable
pnpm install
docker compose up -d
pnpm build
```

## Database

Docker Compose provides PostgreSQL 16:

```bash
docker compose up -d
```

This starts Postgres on port 5432 with database `rangka_dev`, user `rangka`, password `rangka`.

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

## Running tests

Tests use Vitest with a workspace config.

```bash
# All unit tests
pnpm test

# Single package
pnpm --filter @rangka/core test

# Integration tests (requires running PostgreSQL)
pnpm test:integration

# Watch mode
pnpm --filter @rangka/core test -- --watch
```

Integration tests (`tests/integration/`) boot the full framework against `tests/fixtures/basic-app/`. They require PostgreSQL. They run sequentially due to shared DB state. They import from compiled `dist/`. Always rebuild core before running them.

## Development workflow

### Working on packages/shared

Type changes require rebuilding all downstream packages:

```bash
pnpm --filter @rangka/shared build
pnpm build
```

Run `pnpm build` after any type change to catch downstream breaks immediately.

### Working on packages/core

```bash
pnpm --filter @rangka/core test -- --watch
pnpm --filter @rangka/core build && pnpm test:integration
```

Key rules:

- All data access goes through `ctx.models`
- All hooks and services receive `FrameworkContext`. Use it. Do not recreate it.
- Registries are singletons. Extend them. Do not create parallels.

### Working on packages/ui

The UI package contains all widget components in `packages/ui/src/widgets/`. It uses Tailwind CSS v4, CVA for variants, and Base UI for accessibility primitives. Design tokens live in `packages/ui/src/tokens/`.

Key rules:

- All widgets accept `WidgetComponentProps` from `@rangka/shared` (re-exported via `packages/ui/src/widgets/types.ts`)
- The UI package never imports from `@rangka/client`
- Use CVA for component variant logic
- Follow the existing category structure: `input/`, `display/`, `layout/`, `action/`, `overlay/`, `data/`

### Working on packages/client

```bash
pnpm dev:client
```

Key rules:

- All widgets use `WidgetComponentProps` unchanged
- All data binding goes through `useBind`
- All triggers fire through `on.*` handlers
- Shared hooks must be reused. Never duplicate them.

### Working on packages/cli

The CLI is a thin orchestration layer. It calls into `@rangka/core` for boot logic.

```bash
pnpm --filter @rangka/cli build
pnpm --filter @rangka/cli test
```

### Working on packages/studio-core

```bash
pnpm --filter @rangka/studio-core build
pnpm --filter @rangka/studio-core dev
```

All framework interaction goes through `RuntimeManager`. Protocol types live in `protocol.ts`.

### Working on packages/studio-local

```bash
pnpm --filter @rangka/studio-local dev
```

All state goes through `useStudio()`. Protocol types imported from `@rangka/studio-core/protocol`.

## Cross-package changes

When a change spans multiple packages:

1. Start with `@rangka/shared` if types are involved
2. Rebuild shared: `pnpm --filter @rangka/shared build`
3. Update downstream consumers (core, client, ui, etc.)
4. Run `pnpm build` to verify the full monorepo compiles
5. Run `pnpm test` to catch regressions

Common cross-package scenarios:

| Change                              | Files to update                                                         |
| ----------------------------------- | ----------------------------------------------------------------------- |
| New field on `FrameworkContext`     | `shared/types/context.ts` + `core/hooks/context.ts` + `core/context.ts` |
| New `WidgetAction` variant          | `shared/types/widget.ts` + `client/widgets/action/dispatcher.ts`        |
| New field on `WidgetComponentProps` | `shared/types/widget.ts` + all widget components in `packages/ui/`      |
| New field on `BootPayload`          | `shared/types/boot.ts` + `core/api/meta-handler.ts` + `client/boot/`    |

## TypeScript configuration

Project references with shared base config:

- Target: ES2022
- Module: NodeNext
- Strict mode enabled
- Declaration maps for cross-package go-to-definition

## Debugging tips

### API issues

Swagger UI is available at `/api/docs` when the dev server runs. Browse all generated routes and test interactively.

### Schema resolution

If models are not appearing or fields are wrong:

1. Check the scanner found the file (correct path pattern)
2. Check `mergeSchemas()` applied extensions in the right order
3. Add logging in `packages/core/src/boot/index.ts` to trace boot

### Database sync

If schema drift occurs:

1. Check `DiffEngine` output (logs planned operations)
2. Reset: `docker compose down -v && docker compose up -d`
3. Restart dev server to trigger fresh auto-sync

### Frontend boot

If the shell is not loading:

1. Check Network tab for `/api/meta/boot` response
2. Verify auth token in localStorage
3. Check `useBoot()` state transitions in React DevTools

### Widget not rendering

1. Check the widget is registered in `packages/ui/src/widgets/index.ts`
2. Check `widgetMeta.name` matches the type used in the page definition
3. Check WidgetRenderer console for `Unknown widget: ...` errors
