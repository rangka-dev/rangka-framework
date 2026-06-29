# CLAUDE.md — @rangka/client

## Package overview

The Rangka client shell — a pre-built SPA that serves as the runtime UI for all Rangka applications. It fetches metadata from the server (models, pages, navigation, permissions) and renders a complete admin interface without user code. Custom views/fields/cards are loaded as async chunks from `.rangka/`.

## Tech stack

- React 19, TypeScript 5
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- TanStack Router (dynamic route building from page definitions)
- TanStack React Query (data fetching, caching, mutations)
- shadcn/ui — local component primitives in `src/components/ui/`
- `@rangka/shared` — shared types (PageDefinition, WidgetNode, LayoutProps, etc.)

## Project structure

```
src/
├── api/          — HTTP client, auth, token, boot payload fetch
├── auth/         — Login form, session expired screen
├── boot/         — Boot state machine (BootProvider, BootGate, useBoot)
├── components/
│   └── ui/       — Local shadcn components (Collapsible, ResizablePanel, ScrollArea, etc.)
├── context/      — React contexts (Meta, Permissions, User, ShellProviders)
├── data/         — Data hooks (useSource, useRecord, useMutation, QueryProvider)
├── router/       — Dynamic router (createShellRouter, buildRouteTree, hooks)
├── shell/        — Shell layout (ShellLayout, Sidebar, PageOutlet, etc.)
├── widgets/
│   ├── action/     — Action dispatcher and handler types
│   ├── binding/    — Binding resolver (field, expression, model)
│   ├── components/ — Widget implementations (one file per widget)
│   ├── context/    — WidgetContext type and builder
│   ├── data/       — Shared data hooks (useModelRecord, useModelQuery)
│   ├── form/       — FormWidget, FormContext, form state/validation/submit
│   ├── hooks/      — Shared widget hooks (useBind, useAction, useCondition, etc.)
│   ├── lib/        — Layout prop resolver, spacing maps
│   ├── renderer/   — WidgetRenderer (resolves props, applies layout wrapper)
│   └── state/      — Page-level state store (magic variables: $filter, $sort, $page, $search)
├── App.tsx       — Root component
├── main.tsx      — Entry point
└── index.ts      — Public exports
```

## Widget system internals

Every widget follows the same architecture. Understand this before creating or modifying any widget.

### Controller pattern

Data-container widgets (`data`, `form`, `table`, `repeat`, `datagrid`, `modal`, `drawer`) have a controller in `widgets/controllers/`. The WidgetRenderer dispatches to the controller instead of the UIKit component. Controllers fetch data, build WidgetContext, and delegate rendering. See `docs/architecture/widget-system.md`.

### WidgetProps contract

All widgets receive a single `WidgetProps` object. This is the public API. Never add custom props outside this interface.

```typescript
interface WidgetProps {
  props: Record<string, unknown>; // widget-specific config from page definition
  bind: {
    value: unknown; // resolved binding value
    setValue?: (val: unknown) => void; // setter (only for input widgets)
    meta?: FieldMeta; // field metadata from model
    error?: string; // validation error from FormContext
    id?: string; // resolved record ID
  };
  on: Record<string, (...args: unknown[]) => void>; // trigger handlers
  context: { record; model; mode; index }; // parent widget context
  childNodes?: WidgetNode[]; // raw children for container widgets
  children?: ReactNode; // pre-rendered children
}
```

### Shared hooks (MUST reuse, never recreate)

| Hook                               | Location                            | Purpose                                                                             |
| ---------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| `useBind`                          | `widgets/hooks/useBind.ts`          | Resolves binding to value/setValue/meta. Integrates with FormContext automatically. |
| `useAction` / `useTriggerHandlers` | `widgets/hooks/useAction.ts`        | Dispatches actions. Merges form handlers when inside FormContext.                   |
| `useWidgetContext`                 | `widgets/hooks/useWidgetContext.ts` | Access current WidgetContext (record, model, mode).                                 |
| `useCondition`                     | `widgets/hooks/useCondition.ts`     | Evaluates visibility conditions.                                                    |
| `useModelRecord`                   | `widgets/data/useModelRecord.ts`    | Fetch single record by model + id. Uses TanStack Query.                             |
| `useModelQuery`                    | `widgets/data/useModelQuery.ts`     | Fetch list with pagination/sort/filter. Reads magic variables from StateStore.      |
| `useDataQuery`                     | `widgets/hooks/useDataQuery.ts`     | Low-level hook for magic variable integration. Used by useModelQuery.               |
| `usePageState`                     | `widgets/hooks/usePageState.ts`     | Access page-level StateStore for $filter, $sort, $page, $search.                    |
| `useFormContext`                   | `widgets/form/FormContext.ts`       | Access form state. Returns null when not inside a FormProvider.                     |

### Binding resolution flow

1. `WidgetRenderer` calls `useBind(node.bind, fieldMeta, setValue)`
2. `useBind` calls `resolveBinding()` which handles field/expression/model bindings
3. If inside a `FormProvider` and bind has a field, `useBind` overrides with form-backed value/setValue/error
4. The resolved `BindingResult` is passed to the widget via `widgetProps.bind`

Widgets never call `resolveBinding` directly. They read from `bind.value` and write via `bind.setValue`.

### Action dispatch flow

1. `WidgetRenderer` calls `useTriggerHandlers(node.on, handlers, boundField)`
2. Each trigger wraps actions in a function that calls `dispatch(action, context, handlers)`
3. If inside a FormProvider, `form.submit` and `form.reset` handlers are merged automatically
4. Widgets receive the final handlers via `widgetProps.on`

Widgets fire triggers by calling `on.change?.(value)`, `on.click?.()`, etc. They never call `dispatch` directly.

### Widget registration pattern

Every widget file exports a component + static `widgetMeta`:

```typescript
export function MyWidget({ props, bind, on }: WidgetProps) { ... }

MyWidget.widgetMeta = {
  name: 'my-widget',           // unique type key (used in page definitions)
  label: 'My Widget',
  category: 'input' | 'display' | 'layout' | 'action' | 'data',
  schema: { ... },             // prop definitions
  binding: 'none' | 'field' | 'expression' | 'record' | 'model',
  triggers: ['change', ...],   // events this widget can fire
  container: false,            // true if it renders children
};
```

Then add the import + entry in `widgets/components/register.ts`.

### WidgetContext hierarchy

- `WidgetContext` holds `record`, `model`, `mode`, `parent`
- Container widgets (data, form, table, repeat) provide a new WidgetContext via `WidgetContextProvider`
- Child widgets read their nearest context via `useWidgetContext()`
- `buildContext(node, parentCtx)` in `widgets/context/builder.ts` derives child context from parent

### Container widgets that render children

Two patterns exist:

1. **Render `children` prop directly** (most layout widgets: group, grid, section, card, split)
2. **Render `childNodes` via WidgetRenderer** (data, form, repeat, table). Use this when the widget provides a new WidgetContext that children must inherit.

Pattern 2 avoids context shadowing. If you render pre-built `children`, they already have their own WidgetContextProvider from the renderer. Use `childNodes` + manual WidgetRenderer when your widget needs to inject context.

## Skills available

- **`add-widget`** — step-by-step for creating any new widget type with checklist

Read this skill before writing any new widget.

## Rules

### Layout widgets render Tailwind directly

Layout widgets (Group, Grid, Split, Section, Spacer, ScrollArea, Stack) render Tailwind utility classes directly.

- Group/Grid/Section/Spacer/Stack emit plain `<div>` elements with Tailwind classes
- Split uses shadcn ResizablePanelGroup from `src/components/ui/resizable.tsx`
- ScrollArea uses shadcn ScrollArea from `src/components/ui/scroll-area.tsx`
- Section uses shadcn Collapsible from `src/components/ui/collapsible.tsx`

### Universal layout props

Any widget can accept layout props (`flex`, `span`, `rowSpan`, `align`, `width`, `height`, `minWidth`, `maxWidth`, `minHeight`, `maxHeight`, `scroll`, `padding`, `paddingX`, `paddingY`, `margin`, `marginX`, `marginY`, `hidden`). These are defined in the flat `props` field alongside widget-specific props.

The WidgetRenderer extracts layout props and wraps the widget in a layout div when present. The resolver lives in `src/widgets/lib/layout-props.ts`.

### Spacing tokens

All spacing uses a 7-token scale on a 4px base grid:

| Token | Value | Tailwind |
| ----- | ----- | -------- |
| none  | 0     | 0        |
| xs    | 4px   | 1        |
| sm    | 8px   | 2        |
| md    | 16px  | 4        |
| lg    | 24px  | 6        |
| xl    | 32px  | 8        |
| 2xl   | 48px  | 12       |

### Always refer to the design system

All visual decisions must follow `.interface-design/system.md` at the repo root. This includes:

- Color tokens (use semantic names: `text`, `text-muted`, `surface`, `border`, etc.)
- Spacing (4px grid via Tailwind utilities)
- Typography (`text-sm` as default body, `text-xs` for labels)
- Radius (`rounded-sm` for most elements)
- Transitions (`duration-fast` for hover/focus)

Never hardcode colors, shadows, or radii. Use the token system.

### Styling

- Use Tailwind utility classes exclusively — no inline styles, no CSS modules
- Dark mode via `[data-theme="dark"]` attribute

### Component patterns

- Layout widgets render Tailwind directly
- Non-layout widgets use local shadcn components from `src/components/ui/`
- Keep shell components focused — one concern per file
- Use the `useShell()` hook for toast, overlay, panel, and navigate actions

### Data flow

- All data comes from the server via `/api/meta/boot` (metadata) and `/api/{module}/{model}` (records)
- `useSource` for lists with pagination/sort/filter
- `useRecord` for single records
- `useMutation` for create/update/delete
- Never make raw fetch calls in components — use the data hooks

### Custom view loading

- Custom views are loaded via dynamic `import()` from the manifest at `/_rangka/manifest.json`
- The shell resolves view names: custom views take priority over built-in views
- Custom views receive `ViewProps` (source, config, shell, modelMeta)

## Commands

```bash
pnpm dev:client              # Vite dev server on port 5173 (proxy to API on 3000)
pnpm playground              # Start API server on port 3000
pnpm --filter @rangka/client build   # Build shell → dist/shell/
pnpm --filter @rangka/client test    # Run tests
```

## Don'ts

- Don't hardcode colors or spacing — use tokens
- Don't use inline styles — use Tailwind classes
- Don't fetch data without hooks — use useSource/useRecord/useMutation
- Don't import from `@rangka/core` — this is a browser package, core is server-only
- Don't add direct DOM manipulation or CustomEvents — use the action dispatcher and formRef for cross-component communication
- Don't create new data-fetching logic — use `useModelRecord` or `useModelQuery` from `widgets/data/`
- Don't bypass `useBind` — every widget reads data through `bind.value` and writes through `bind.setValue`
- Don't call `dispatch` directly from widgets — use the `on` handlers from WidgetProps
- Don't add props outside the `WidgetProps` interface — extend `props` or `bind` in the shared types if needed
- Don't create a new hook that duplicates `useBind`, `useAction`, `useModelRecord`, or `useModelQuery`
- Don't read `useWidgetContext()` for field values — use `bind.value` which already resolves context + form state
- Don't modify the `WidgetProps` interface without checking every existing widget that consumes it
- Don't register a widget without `widgetMeta` — the registry depends on it
