# @rangka/shared

Contract layer for the Rangka framework. Defines TypeScript interfaces, builder functions, and traits consumed by all other packages.

## How it works

This package is the dependency root. It has zero runtime dependencies. Every other Rangka package imports types and builders from here. Changes to this package affect the entire monorepo.

## Architecture

```
src/
├── types/            — All shared interfaces and type unions
│   ├── field.ts      — FieldConfig, FieldType, field options
│   ├── schema.ts     — ModelConfig, ResolvedModel, RelationshipConfig
│   ├── widget.ts     — WidgetNode, WidgetBinding, WidgetAction, WidgetDefinitionMeta
│   ├── context.ts    — FrameworkContext (hooks/services/jobs receive this)
│   ├── page.ts       — PageDefinition, NavigationItem
│   ├── boot.ts       — BootPayload (server → client metadata)
│   ├── permissions.ts — RolesConfig, PermissionRule
│   ├── hooks.ts      — HookDefinition, HookType
│   ├── auth.ts       — Session, TokenPayload
│   └── ...           — app, service, job, fixture, extension, api, layout
├── builders.ts       — Functional widget node builders (input, text, button, etc.)
├── widget-builder.ts — Fluent WidgetBuilder and PageBuilder ($input, $text, etc.)
├── define.ts         — defineModel, defineModule, defineHooks, etc.
├── field.ts          — field() helper for typed FieldConfig creation
├── traits.ts         — Built-in trait definitions (timestamped, soft_delete)
└── index.ts          — Public exports
```

## Key interfaces for contributors

| Interface          | Consumers                    | Impact of change              |
| ------------------ | ---------------------------- | ----------------------------- |
| `FrameworkContext` | core (hooks, services, jobs) | Every hook/service breaks     |
| `WidgetNode`       | client (renderer), studio    | Widget rendering breaks       |
| `WidgetAction`     | client (dispatcher)          | Action dispatch breaks        |
| `WidgetBinding`    | client (useBind)             | Binding resolution breaks     |
| `BootPayload`      | core (API), client (boot)    | Server-client contract breaks |
| `FieldConfig`      | core (schema), client (meta) | Model resolution breaks       |
| `PageDefinition`   | client (router), core (boot) | Page rendering breaks         |

## Commands

```bash
pnpm --filter @rangka/shared build   # Compile TypeScript
pnpm --filter @rangka/shared test    # Run tests
```

## Contributing

- Adding an optional field to an interface is safe. Adding a required field is a breaking change.
- Extending a union (e.g., adding a new WidgetAction variant) is safe for consumers but requires handling in dispatchers.
- Renaming or removing anything requires updating all consumers in the same commit.
- Always rebuild shared first, then run `pnpm build` from root to catch downstream breaks.
- Don't add runtime logic beyond builders and factory functions.
- Don't import from any other Rangka package. This is the base.
