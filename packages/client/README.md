# @rangka/client

Frontend application shell for the Rangka framework.

## How it works

A pre-built React SPA that renders the entire Rangka admin interface from server metadata. It fetches models, pages, navigation, and permissions from the boot API, then dynamically renders widgets without per-screen code. Custom views and fields are loaded as async chunks.

## Architecture

```
src/
├── api/          — HTTP client, auth headers, token refresh
├── auth/         — Login form, session expired screen
├── boot/         — Boot state machine (fetches metadata, gates rendering)
├── components/
│   └── ui/       — Local shadcn primitives (Collapsible, Input, ScrollArea, etc.)
├── context/      — React contexts (Meta, Permissions, User, ShellProviders)
├── data/         — Data hooks (useSource, useRecord, useMutation, QueryProvider)
├── router/       — Dynamic TanStack Router (builds route tree from page definitions)
├── shell/        — Shell layout (sidebar, panels, page outlet)
├── widgets/
│   ├── action/     — Action dispatcher and handler types
│   ├── binding/    — Binding resolver (field → value, expression, model)
│   ├── components/ — Widget implementations (one file per widget, ~35 widgets)
│   ├── context/    — WidgetContext type and builder
│   ├── data/       — Shared data hooks (useModelRecord, useModelQuery)
│   ├── form/       — FormWidget, FormContext, form state/validation/submit
│   ├── hooks/      — Shared widget hooks (useBind, useAction, useCondition, etc.)
│   ├── lib/        — Layout prop resolver, spacing maps
│   ├── renderer/   — WidgetRenderer (resolves props, binding, layout wrapper)
│   └── state/      — Page-level state store (magic variables)
├── App.tsx       — Root component
├── main.tsx      — Entry point
└── index.ts      — Public exports
```

## Key internal systems

| System          | Entry point                           | Purpose                                                    |
| --------------- | ------------------------------------- | ---------------------------------------------------------- |
| Widget Renderer | `widgets/renderer/WidgetRenderer.tsx` | Resolves binding, props, triggers, renders widget          |
| Binding         | `widgets/hooks/useBind.ts`            | Resolves field/expression/model binding + form integration |
| Actions         | `widgets/hooks/useAction.ts`          | Trigger dispatch, form handler merging                     |
| Widget Context  | `widgets/context/builder.ts`          | Builds hierarchical context per widget                     |
| Data hooks      | `widgets/data/`                       | useModelRecord, useModelQuery (TanStack Query)             |
| Form system     | `widgets/form/`                       | FormContext, state, validation, submit                     |
| Registration    | `widgets/components/register.ts`      | Maps widget type names to components                       |
| State store     | `widgets/state/`                      | Magic variables ($filter, $sort, $page, $search)           |

## Commands

```bash
pnpm --filter @rangka/client build   # Build shell → dist/
pnpm --filter @rangka/client test    # Run tests
pnpm dev:client                      # Vite dev server (port 5173)
```

## Contributing

- All widgets receive `WidgetProps` (defined in `widgets/types.ts`). Never add custom props outside this interface.
- All widgets read data through `bind.value` and write through `bind.setValue`. Never bypass `useBind`.
- All triggers fire through `on.triggerName?.()`. Never call `dispatch` directly from a widget.
- Shared hooks (`useBind`, `useAction`, `useModelRecord`, `useModelQuery`) must be reused. Never create parallel implementations.
- Container widgets that inject new context use `childNodes` + `WidgetRenderer`, not pre-built `children`.
- Every widget has a static `widgetMeta` and is registered in `register.ts`.
- This package imports from `@rangka/shared` only. Never import from `@rangka/core` (browser vs server boundary).
- Use Tailwind classes exclusively. Use shadcn components from `src/components/ui/`.
