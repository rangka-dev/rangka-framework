---
status: stable
since: 0.1.0
last-updated: 2026-06-20
description: Monorepo package layout and package responsibilities
---

# Project Structure

Rangka is a pnpm monorepo managed with Turborepo.

## Top-Level Layout

```
rangka/
├── packages/
│   ├── shared/          # Contract layer: types, builders, traits (zero deps)
│   ├── core/            # Server runtime: boot, registries, DB, API, auth, hooks
│   ├── client/          # Browser shell: widget renderer, routing, data hooks
│   ├── cli/             # CLI binary: start, build, studio commands
│   ├── studio-core/     # Studio backend: WebSocket server, AI agent, runtime manager
│   ├── studio-local/    # Studio frontend: React chat UI, explorer, settings
│   └── rangka/          # Distribution package (re-exports core + shared)
├── tests/
│   ├── integration/     # Integration tests against full boot + database
│   └── fixtures/        # Test apps (basic-app, erp-app)
├── dev/                 # Local development playground (gitignored)
├── docs/                # VitePress documentation
├── .claude/             # Claude Code settings (committed)
├── docker-compose.yml   # PostgreSQL 16 for development
├── turbo.json           # Build pipeline
├── vitest.workspace.ts  # Test aggregation
├── tsconfig.json        # Project references
├── tsconfig.base.json   # Shared compiler options
└── pnpm-workspace.yaml  # Workspace definition
```

## Package Dependency Graph

```
shared ← core ← cli
shared ← client
shared ← studio-core ← studio-local
shared ← rangka (re-exports core + shared)
```

Import rules:

- `shared` imports from nothing (it is the base)
- `core` imports from `shared` only
- `client` imports from `shared` only (never from `core`)
- `cli` imports from `core`, `client`, `shared`, `studio-core`
- `studio-core` imports from `core`, `client`, `shared`
- `studio-local` imports protocol types from `studio-core` only
- Never create circular imports between packages

## Packages

### packages/shared

Types and the declarative API surface. No runtime dependencies.

```
shared/src/
├── types/             — All shared interfaces and type unions
│   ├── field.ts       — FieldConfig, FieldType (18+ types)
│   ├── schema.ts      — ModelConfig, ResolvedModel, RelationshipConfig
│   ├── widget.ts      — WidgetNode, WidgetBinding, WidgetAction, WidgetDefinitionMeta
│   ├── context.ts     — FrameworkContext (hooks/services/jobs receive this)
│   ├── page.ts        — PageDefinition, NavigationItem
│   ├── boot.ts        — BootPayload (server → client metadata)
│   ├── permissions.ts — RolesConfig, PermissionRule
│   ├── hooks.ts       — HookDefinition, HookType
│   ├── auth.ts        — Session, TokenPayload
│   └── ...            — app, service, job, fixture, extension, api, layout
├── widget.ts          — Widget node builders and types
├── action.ts          — Action builders and types
├── define.ts          — defineModel, defineApp, defineHooks, defineService, etc.
├── field.ts           — field() helper for typed FieldConfig creation
├── traits.ts          — Built-in trait definitions (timestamped, soft_delete)
└── index.ts           — Public exports
```

Key exports: `defineModel`, `defineApp`, `defineHooks`, `defineService`, `definePage`, `defineJob`, `defineFixture`, `defineRoles`, `defineConfig`, `defineWidget`, `field`, `TRAITS`.

### packages/core

Server-side engine. Depends on `@rangka/shared`.

```
core/src/
├── api/            — Fastify server, route generation, handlers, OpenAPI
├── audit/          — Audit trail recording
├── auth/           — JWT sessions, permissions, scopes, field-level access
├── boot/           — Discovery, schema loading, merging, registry initialization
├── db/             — DatabaseClient, auto-sync (DiffEngine), model-ops
├── events/         — EventBus (transaction-scoped pub/sub)
├── external-model/ — Adapter-based external data sources
├── fixtures/       — Seed data loading
├── helpers/        — Stamping, ownership checks, validation utilities
├── hooks/          — Hook registry, executor, middleware, context builder
├── jobs/           — Job registry, worker, scheduler, enqueue
├── model-api/      — Query builder, filter translation, scope enforcement
├── plugins/        — Plugin lifecycle, adapter registry
├── schema/         — SchemaRegistry, relationship resolution
├── services/       — ServiceRegistry, DI container
├── validation/     — Field-level validation
├── widgets/        — Server-side widget registry (for studio)
├── context.ts      — FrameworkContext builder
├── errors.ts       — AppError, BadRequestError, NotFoundError
└── index.ts        — Public exports
```

### packages/client

React frontend shell. Depends on `@rangka/shared`.

```
client/src/
├── api/          — HTTP client, auth headers, token management
├── auth/         — Login form, session expired screen
├── boot/         — Boot state machine (fetches metadata, gates rendering)
├── components/
│   └── ui/       — shadcn primitives (Input, ScrollArea, Collapsible, etc.)
├── context/      — React contexts (Meta, Permissions, User, ShellProviders)
├── data/         — Data hooks (useSource, useRecord, useMutation, QueryProvider)
├── router/       — Dynamic TanStack Router (builds route tree from pages)
├── shell/        — Shell layout (sidebar, panels, page outlet)
├── widgets/
│   ├── action/     — Action dispatcher and handler types
│   ├── binding/    — Binding resolver (field, expression, model)
│   ├── components/ — Widget implementations (~35 widgets, one file each)
│   ├── context/    — WidgetContext type and builder
│   ├── data/       — Shared data hooks (useModelRecord, useModelQuery)
│   ├── form/       — FormWidget, FormContext, form state/validation/submit
│   ├── hooks/      — Shared widget hooks (useBind, useAction, useCondition)
│   ├── lib/        — Layout prop resolver, spacing maps
│   ├── renderer/   — WidgetRenderer (props, binding, layout wrapper)
│   └── state/      — Page-level state store (magic variables)
├── App.tsx       — Root component
├── main.tsx      — Entry point
└── index.ts      — Public exports
```

### packages/cli

CLI entry point. Depends on `@rangka/core`, `@rangka/client`, `@rangka/studio-core`.

```
cli/src/
├── index.ts           — Entry point, registers commands with citty
├── commands/
│   ├── start.ts       — Boot framework + serve client
│   ├── build.ts       — esbuild production bundle
│   └── studio.ts      — Start studio environment
├── resolve-client.ts  — Locate @rangka/client shell dist
└── ui-scanner.ts      — Discover custom UI components
```

### packages/studio-core

Studio backend. Depends on `@rangka/core`, `@rangka/shared`.

```
studio-core/src/
├── server.ts          — WebSocket server, message routing
├── runtime-manager.ts — Boots framework, introspects state, applies DDL
├── agent-engine.ts    — AI agent session lifecycle
├── tools.ts           — AI tools (introspect, scaffold, reference docs)
├── system-prompt.ts   — System prompt for studio agent
├── protocol.ts        — ServerMessage/ClientMessage types
├── config.ts          — Settings persistence
├── file-watcher.ts    — Project file watching (chokidar)
└── generated/         — Build-time bundled reference docs
```

### packages/studio-local

Studio frontend. Imports protocol types from `@rangka/studio-core`.

```
studio-local/src/
├── components/
│   ├── chat/       — Chat interface (messages, input, tool calls)
│   ├── canvas/     — Model graph visualization
│   ├── code/       — Code viewer
│   ├── layout/     — Shell (LeftPanel, TopBar, StatusBar)
│   ├── resources/  — Model/page explorer
│   ├── settings/   — API key, model config
│   └── ui/         — Shared shadcn primitives
├── hooks/
│   └── useStudio.tsx — Central state (WebSocket, messages, runtime)
├── lib/            — WebSocket client, utilities
└── App.tsx         — Root component
```

## Configuration Files

| File                    | Purpose                                            |
| ----------------------- | -------------------------------------------------- |
| `turbo.json`            | Build pipeline (build, dev, test, lint tasks)      |
| `vitest.workspace.ts`   | Test aggregation across all packages               |
| `tsconfig.json`         | Project references to all packages                 |
| `tsconfig.base.json`    | Shared compiler options (ES2022, NodeNext, strict) |
| `pnpm-workspace.yaml`   | Workspace definition                               |
| `docker-compose.yml`    | PostgreSQL 16 for development                      |
| `.claude/settings.json` | Claude Code deny rules for build artifacts         |

## Where to Find Things

| Looking for...                       | Location                                    |
| ------------------------------------ | ------------------------------------------- |
| Type definitions                     | `packages/shared/src/types/`                |
| Declarative API (`define*`, `field`) | `packages/shared/src/define.ts`, `field.ts` |
| Widget node builders                 | `packages/shared/src/widget.ts`             |
| Boot orchestration                   | `packages/core/src/boot/`                   |
| Schema resolution                    | `packages/core/src/schema/`                 |
| Database operations                  | `packages/core/src/db/`                     |
| REST API routing                     | `packages/core/src/api/`                    |
| Authentication                       | `packages/core/src/auth/`                   |
| Hook lifecycle                       | `packages/core/src/hooks/`                  |
| Model access (CRUD)                  | `packages/core/src/model-api/`              |
| Service registry                     | `packages/core/src/services/`               |
| Background jobs                      | `packages/core/src/jobs/`                   |
| Widget system                        | `packages/client/src/widgets/`              |
| Widget hooks (useBind, useAction)    | `packages/client/src/widgets/hooks/`        |
| Widget data hooks                    | `packages/client/src/widgets/data/`         |
| Widget renderer                      | `packages/client/src/widgets/renderer/`     |
| Form system                          | `packages/client/src/widgets/form/`         |
| Frontend shell                       | `packages/client/src/shell/`                |
| Boot state machine                   | `packages/client/src/boot/`                 |
| Dynamic router                       | `packages/client/src/router/`               |
| Data fetching                        | `packages/client/src/data/`                 |
| CLI commands                         | `packages/cli/src/commands/`                |
| Studio WebSocket protocol            | `packages/studio-core/src/protocol.ts`      |
| Studio AI tools                      | `packages/studio-core/src/tools.ts`         |
| Integration tests                    | `tests/integration/`                        |
| Test fixture app                     | `tests/fixtures/basic-app/`                 |
