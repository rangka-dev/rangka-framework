# Client to @rangka/ui migration

> **Planned** — not yet implemented.

## Overview

Migrate all DOM rendering from `@rangka/client` to `@rangka/ui`. After migration the client becomes a thin headless layer: hooks, state, routing, data fetching. Every visual element renders from `@rangka/ui` components. Zero intermediate divs in the client package.

## Current state

The client renders widgets using local shadcn components in `src/components/ui/` and raw Tailwind in `src/widgets/components/`. The `@rangka/ui` package has parallel widget implementations that accept the same `WidgetComponentProps` interface. There is no dependency between the two packages today.

## Target architecture

```
@rangka/client (headless)           @rangka/ui (all DOM)
─────────────────────────           ────────────────────
WidgetRenderer                      Widget components
  → useBind() resolves bind         ← receives { props, bind, on, context }
  → useModelQuery() fetches data    ← receives data via bind.value
  → useTriggerHandlers() wires on   ← calls on.* handlers
  → passes to UI widget             → renders DOM
```

The client's `src/components/ui/` and `src/widgets/components/` directories are deleted entirely.

## Widget coverage

### Ready to migrate (direct swap)

These widgets exist in `@rangka/ui` with full feature parity.

| Category | Widgets                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Layout   | group, stack, grid, card, section, split, scroll-area, spacer, divider                                                          |
| Input    | input, textarea, checkbox, select, datepicker, datetime, money, link, tree, dynamic-link, many-to-many, attachment, attachments |
| Display  | text, badge, icon, image, computed, sequence                                                                                    |
| Action   | button                                                                                                                          |
| Overlay  | modal, drawer                                                                                                                   |

### Data widgets (thin wrapper needed)

Data widgets in `@rangka/ui` are presentation-only. The client keeps a thin orchestration wrapper that calls hooks and passes results to the UI widget.

| Widget   | Client responsibility                     | UI responsibility                     |
| -------- | ----------------------------------------- | ------------------------------------- |
| Table    | `useModelQuery()`, sort/filter/page state | Render rows, headers, pagination UI   |
| Datagrid | `useModelQuery()`, cell edit mutations    | Render grid, cell editors, selection  |
| Data     | `useModelRecord()`, context injection     | Render children with provided context |
| Repeat   | Array iteration, context per row          | Render iterated children              |
| Form     | FormContext, validation, submission       | Render form shell                     |

Pattern for data widget wrappers:

```typescript
// packages/client/src/widgets/data/TableWidgetWrapper.tsx
function TableWidgetWrapper(widgetProps: WidgetProps) {
  const { data, isLoading, total } = useModelQuery(widgetProps);
  const { sort, page, pageSize } = useDataQuery(widgetProps);

  return (
    <TableWidget
      props={{ ...widgetProps.props, loading: isLoading, total, sorted: sort, page, pageSize }}
      bind={{ value: data }}
      on={widgetProps.on}
      context={widgetProps.context}
      childNodes={widgetProps.childNodes}
    />
  );
}
```

## Shell gaps

The `@rangka/ui` shell provides layout primitives (TopBar, Sidebar, Main, Panel). The following content components need to be built in `@rangka/ui` before shell migration.

| Component      | Purpose                         | Renders                                |
| -------------- | ------------------------------- | -------------------------------------- |
| NavTree        | Recursive navigation tree       | Module sections and page links         |
| ModuleSwitcher | Switch between modules          | Dropdown with module list and icons    |
| NavUser        | User avatar and menu            | Avatar, name, logout action            |
| Breadcrumb     | Auto-build from nav path        | Breadcrumb trail with links            |
| CommandPalette | Global search overlay           | Search input with filtered results     |
| Toast          | Notification popups             | Stacked toast messages                 |
| ConfirmDialog  | Destructive action confirmation | Dialog with message and confirm/cancel |

## Migration phases

### Phase 1: Wire widget registry (1-2 days)

1. Add `@rangka/ui` as dependency of `@rangka/client`.
2. Change client's widget registry to import components from `@rangka/ui`.
3. For layout/input/display/action/overlay widgets this is a direct swap.
4. Delete corresponding files from `src/widgets/components/`.

### Phase 2: Data widget wrappers (2-3 days)

1. Create thin wrapper components in client for Table, Datagrid, Data, Repeat, Form.
2. Each wrapper resolves data via hooks and passes to `@rangka/ui` widget.
3. Register wrappers in the widget registry.
4. Delete old data widget component files.

### Phase 3: Shell navigation components (3-4 days)

1. Build NavTree, ModuleSwitcher, NavUser, Breadcrumb in `@rangka/ui/shell`.
2. Build CommandPalette in `@rangka/ui/overlays`.
3. Build Toast and ConfirmDialog in `@rangka/ui/feedback`.
4. These accept data props (nav tree array, user object, modules array).

### Phase 4: Shell migration (2-3 days)

1. Rewrite client's ShellLayout to compose from `@rangka/ui` shell components.
2. Client provides data (boot payload) to shell props.
3. Shell renders via `@rangka/ui` components.
4. Delete client's `src/shell/` rendering code (keep hooks like `useBreadcrumbs`).

### Phase 5: Cleanup (1 day)

1. Delete `src/components/ui/` (local shadcn).
2. Remove unused dependencies (shadcn-related packages).
3. Verify zero DOM rendering in client (grep for className, Tailwind classes).
4. Update package.json peer dependencies.

## What stays in client

These are headless concerns that do not render DOM:

- `useBind()` — resolves form context into WidgetBind shape
- `useModelQuery()` / `useModelRecord()` — data fetching via TanStack Query
- `usePageState()` — filter/sort/page state store
- `useTriggerHandlers()` — action dispatch
- `useWidgetContext()` — provides record/model/mode context
- `FormContext` — form state, validation, dirty tracking
- `BootProvider` — auth state machine, boot payload fetch
- TanStack Router — route generation from page definitions
- API client — HTTP layer for server communication

## Verification

- `pnpm build` passes with zero errors across all packages.
- `pnpm test` passes (client + ui + core).
- `grep -r "className" packages/client/src/` returns zero results (no DOM rendering).
- All existing Storybook stories continue to render correctly.
- Integration tests pass with the new widget registry.

## Estimated effort

| Phase                       | Days           |
| --------------------------- | -------------- |
| Wire widget registry        | 1-2            |
| Data widget wrappers        | 2-3            |
| Shell navigation components | 3-4            |
| Shell migration             | 2-3            |
| Cleanup                     | 1              |
| **Total**                   | **10-14 days** |
