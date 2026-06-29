# Widget system architecture

## Three-layer model

The widget system has three layers with strict ownership boundaries.

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Public API (@rangka/shared)                       │
│  Types, builders (widget.*, action.*), contracts            │
│  Rule: no runtime deps, everything serializable             │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼                               ▼
┌─────────────────────────┐  ┌────────────────────────────────┐
│  Layer 2: Orchestration │  │  Layer 3: Rendering (@rangka/ui)│
│  (@rangka/client)       │  │                                 │
│                         │  │  UIKit implementation            │
│  Controllers, renderer, │  │  Shell layout, widget components │
│  state store, actions,  │  │                                 │
│  data hooks             │  │  Rule: never import from client  │
│                         │  │  Receives resolved data only     │
│  Rule: produces NO DOM  │  │                                 │
│  Only delegates to UIKit│  │                                 │
└─────────────────────────┘  └────────────────────────────────┘
          │                               ▲
          └──── WidgetProps ──────────────┘
              (data flow at render time)
```

| Layer         | Package          | Owns                                           | Boundary rule                                           |
| ------------- | ---------------- | ---------------------------------------------- | ------------------------------------------------------- |
| Public API    | `@rangka/shared` | Types, builder DSL, UIKit contract             | No runtime deps. No React logic.                        |
| Orchestration | `@rangka/client` | Controllers, renderer, state, actions, hooks   | Produces no DOM. Delegates all rendering to UIKit.      |
| Rendering     | `@rangka/ui`     | Shell layout, widget components, design tokens | Never imports from client. Receives resolved data only. |

## Widget taxonomy

Every widget belongs to one of three categories based on how it handles data and children.

### Leaf widgets

Render-only. Receive `WidgetProps`, render DOM, call back via `on.*()` and `bind.setValue()`.

Examples: `input`, `select`, `checkbox`, `button`, `badge`, `text`, `image`, `datepicker`

Data flow:

```
WidgetRenderer → useBind() → resolved WidgetProps → UIKit component → DOM
```

### Container widgets

Pass-through wrappers. Receive pre-rendered `children` as ReactNode. Add structure (flex, grid, padding) but do not fetch data or alter context.

Examples: `group`, `grid`, `card`, `section`, `split`, `stack`, `scroll-area`, `divider`, `spacer`

Data flow:

```
WidgetRenderer → pre-renders children → passes children prop → UIKit component wraps in layout
```

### Data-container widgets

Controller-backed. A controller in the client package fetches data, builds a new `WidgetContext`, and either delegates rendering to a UIKit component or renders children via `WidgetRenderer` directly.

Examples: `data`, `form`, `table`, `repeat`, `datagrid`, `modal`, `drawer`

Data flow:

```
WidgetRenderer → Controller (client) → useModelQuery/useModelRecord
                                      → builds WidgetContext
                                      → renders childNodes via WidgetRenderer
                                      → OR passes resolved data to UIKit component
```

## The controller pattern

Controllers live in `packages/client/src/widgets/controllers/`. They are registered separately from UIKit widgets:

```typescript
// packages/client/src/widgets/controllers/index.ts
widgetControllers = {
  data: DataController,
  form: FormController,
  table: TableController,
  repeat: RepeatController,
  datagrid: DatagridController,
  modal: ModalController,
  drawer: DrawerController,
};
```

The `WidgetRenderer` checks controllers first:

```typescript
const Component = widgetControllers[node.type] ?? UIComponent;
```

Controllers are NOT UI components. They are middleware that:

1. Fetch data from the server (via `useModelQuery`, `useModelRecord`)
2. Read reactive state (`$filter`, `$sort`, `$page`) from the page StateStore
3. Provide a new `WidgetContext` to children (with fetched record/records)
4. Delegate actual rendering to UIKit or render children via `WidgetRenderer`

## UIKit boundary rules

The `UIKit` interface in `@rangka/shared/src/types/ui-kit.ts` defines the contract between client and ui.

### What crosses the boundary

- `WidgetProps` — resolved data, callbacks, context. No raw hooks, no state managers, no API clients.
- `ShellLayoutProps` — navigation data, user, breadcrumbs, filter data + callbacks.
- `UIKit` object at bootstrap — component references keyed by widget type.

### What never crosses

- Client hooks (`useModelQuery`, `usePageState`, `useFormContext`) — ui never calls these
- React context providers from client — ui reads its own contexts or receives data via props
- Pre-rendered ReactNode for shell slots — shell layout renders its own filter bar from structured data

### Enforcement

- ESLint `no-restricted-imports` prevents `@rangka/ui` from importing `@rangka/client`
- Type tests verify all registered widgets satisfy the `WidgetProps` contract
- The `WidgetComponentProps` type in ui is an alias for `WidgetProps` from shared (single source of truth)

## Type hierarchy

```
definePage() → PageDefinition { widgets: WidgetNode[] }
                                          │
                      BootPayload sends to client
                                          │
                                          ▼
                              WidgetRenderer walks tree
                                          │
                              resolves bindings, triggers, conditions
                                          │
                                          ▼
                              WidgetProps (the rendering contract)
                                          │
                              UIKit component receives and renders DOM
```

## Key files

| Concern               | File                                                             |
| --------------------- | ---------------------------------------------------------------- |
| UIKit contract        | `packages/shared/src/types/ui-kit.ts`                            |
| Widget/Action types   | `packages/shared/src/types/widget.ts`                            |
| Builder DSL           | `packages/shared/src/widget.ts`, `packages/shared/src/action.ts` |
| Widget renderer       | `packages/client/src/widgets/renderer/WidgetRenderer.tsx`        |
| Controllers           | `packages/client/src/widgets/controllers/`                       |
| State store           | `packages/client/src/widgets/state/store.ts`                     |
| Action dispatcher     | `packages/client/src/widgets/action/dispatcher.ts`               |
| Binding resolver      | `packages/client/src/widgets/binding/resolver.ts`                |
| UIKit widget registry | `packages/ui/src/widgets/index.ts`                               |
| Default kit export    | `packages/ui/src/kit.ts`                                         |
