# CLAUDE.md — @rangka/shared

## Package overview

The contract layer between all Rangka packages. Defines TypeScript types, builder functions, and traits shared by `@rangka/core`, `@rangka/client`, `@rangka/cli`, and `@rangka/studio-core`. Changes here affect every consumer in the monorepo.

## Tech stack

- TypeScript 5 (strict, type-only exports for interfaces)
- Zero runtime dependencies

## Project structure

```
src/
├── types/           — All shared interfaces and type unions
│   ├── field.ts     — FieldConfig, FieldType, field options
│   ├── schema.ts    — ModelConfig, ResolvedModel, RelationshipConfig
│   ├── hooks.ts     — HookDefinition, HookType
│   ├── app.ts       — AppDefinition, ModuleConfig
│   ├── widget.ts    — WidgetNode, WidgetBinding, WidgetAction union, WidgetDefinitionMeta
│   ├── page.ts      — PageDefinition, NavigationItem
│   ├── layout.ts    — LayoutConfig
│   ├── context.ts   — FrameworkContext (passed to hooks/services at runtime)
│   ├── permissions.ts — RolesConfig, PermissionRule
│   ├── auth.ts      — Session, TokenPayload
│   ├── boot.ts      — BootPayload (metadata sent to client at startup)
│   ├── service.ts   — ServiceConfig
│   ├── job.ts       — JobConfig
│   ├── fixture.ts   — FixtureConfig
│   ├── extension.ts — ExtensionConfig
│   ├── api.ts       — ApiRouteConfig
│   └── schema-registry.ts — SchemaRegistryInterface
├── define.ts        — defineModel, defineModule, defineHooks, etc. (app authors use these)
├── field.ts         — field() helper for FieldConfig creation
├── widget.ts        — widget() helper for WidgetNode creation
├── action.ts        — action() helper for WidgetAction creation
├── traits.ts        — Built-in trait definitions (timestamped, soft_delete, etc.)
└── index.ts         — Public exports (re-exports everything)
```

## Key interfaces

| Interface          | File                   | Used by                                     |
| ------------------ | ---------------------- | ------------------------------------------- |
| `WidgetNode`       | `types/widget.ts`      | client (renderer), studio, page definitions |
| `WidgetBinding`    | `types/widget.ts`      | client (useBind, WidgetRenderer)            |
| `WidgetAction`     | `types/widget.ts`      | client (dispatcher), page definitions       |
| `WidgetProps`      | client only (not here) | —                                           |
| `FieldConfig`      | `types/field.ts`       | core (schema), client (field meta)          |
| `ModelConfig`      | `types/schema.ts`      | core (boot, registry)                       |
| `FrameworkContext` | `types/context.ts`     | core (hooks, services, jobs)                |
| `PageDefinition`   | `types/page.ts`        | client (router), core (boot payload)        |
| `BootPayload`      | `types/boot.ts`        | core (API), client (boot provider)          |
| `RolesConfig`      | `types/permissions.ts` | core (permission registry)                  |

## Builder factories (public API)

Three factory exports for app developers. All produce plain objects (no classes, no wrappers).

| Factory  | File        | Returns        | Pattern                                        |
| -------- | ----------- | -------------- | ---------------------------------------------- |
| `field`  | `field.ts`  | `FieldConfig`  | `field.string()`, `field.link('model')`        |
| `widget` | `widget.ts` | `WidgetNode`   | `widget.input('name')`, `widget('kanban', {})` |
| `action` | `action.ts` | `WidgetAction` | `action.navigate('/path')`, `action.submit()`  |

Rules:

- `widget(type, opts)` is the base. Named helpers (`.input()`, `.table()`) are sugar.
- `action(type, params)` is the base. Named helpers (`.navigate()`, `.service()`) are sugar.
- Adding a new built-in widget type requires adding a helper to `widget.ts`.
- Adding a new action type requires adding a helper to `action.ts`.
- All helpers must return plain `WidgetNode` or `WidgetAction` objects. No wrappers.

## Rules for modifying shared types

### Adding a field to an existing interface

Safe if the field is optional (`field?: type`). All consumers continue to compile. Add it, rebuild, done.

### Adding a required field to an existing interface

Breaking change. Every consumer that constructs that interface must be updated. Search the entire monorepo for usages before adding.

### Extending a union type (e.g., WidgetAction)

Safe for consumers that switch on `type`. They'll hit the default case. But dispatchers must handle the new variant. When adding a new action type:

1. Add the interface to `types/widget.ts`
2. Add it to the `WidgetAction` union
3. Add a named helper to `action.ts`
4. Handle it in `packages/client/src/widgets/action/dispatcher.ts`

### Renaming or removing a field/interface

Breaking change. Grep the entire monorepo. Update all consumers in the same commit.

### Adding a new built-in widget type

1. Add props schema in `validation/schemas/widget-props/`
2. Register in `validation/schemas/widget-props/index.ts`
3. Add a named helper to `widget.ts`
4. Export from `index.ts`
5. The helper must produce a valid `WidgetNode`

## Commands

```bash
pnpm --filter @rangka/shared build    # Build → dist/
pnpm --filter @rangka/shared test     # Unit tests (if any)
```

## Don'ts

- Don't add runtime logic beyond builders and helpers — this package is types and factories
- Don't import from `@rangka/core` or `@rangka/client` — shared is the base, it has no upward dependencies
- Don't make a breaking change without updating all consumers in the same PR
- Don't add optional fields "for later" — add them when the consumer code is ready
- Don't duplicate types that already exist — search before creating (e.g., don't create a new FieldType if one exists)
- Don't put React-specific types here — this package is framework-agnostic
- Don't change builder output shapes without verifying against the client renderer expectations
- Don't use `body` in PageDefinition — the field is `widgets`
- Don't add `type` to PageDefinition — it was removed (no `collection`/`record`/`dashboard`)
- Don't create wrapper classes or chainable builders — the `widget`/`action` factories return plain objects
