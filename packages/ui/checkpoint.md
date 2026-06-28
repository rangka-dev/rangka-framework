# Filter System Checkpoint (RAN-29)

## What's done

- `filterable: true` on columns works — `TableController` resolves field metadata
- Inline `TableFilterBar` renders above table when `surface === 'card'` (default layout)
- Filter operators utility (`packages/ui/src/data/filter-operators.ts`)
- `TableFilterBar` UI component with two-step field→operator→value flow
- Auto CRUD generator sets `filterable` on appropriate column types (enum, boolean, link, date, datetime, int, decimal, money)
- Filter state writes to page state store (`$filter.{model}.{field}__${op}`) via `useDataQuery`
- `useModelQuery` picks up filter changes and re-fetches automatically
- `SurfaceProvider` wraps pages based on layout in `buildRouteTree.tsx`
- Same field+operator: second filter replaces first (API limitation — server only supports one value per field+operator)

## What's NOT done — full layout page-level filter

For `layout: 'full'` pages (auto CRUD list pages), the table does NOT render inline filters (`surface === 'page'`). The filter UI should appear at the page level: trigger button in `Shell.Main.Actions`, filter chips below the header.

## The problem to solve

The page-level filter bar needs to know which fields are filterable. This information lives in the table's column definitions deep in the widget tree. Two approaches were tried and abandoned:

### Approach 1: Context bubble-up (FilterRegistryProvider) — ABANDONED

- `FilterRegistryProvider` at shell level, `useRegisterFilters` in `TableController`
- **Failed**: infinite render loops. Registry state changes cascade through the tree. The provider's `value` gets a new identity → consumers re-render → effects re-fire → setState → loop.
- All code was removed.

### Approach 2: Static widget tree scan — NOT YET IMPLEMENTED

- During route rendering (in `PageRoute` or `ShellLayout`), traverse `page.widgets` to find column nodes with `props.filterable === true`
- Resolve field metadata from `modelMeta` (available via `useMeta()` or boot payload)
- Pass filter declarations + handlers to shell as props
- No runtime context needed — it's a one-time read of the page definition

## How to implement (recommended approach)

1. In `buildRouteTree.tsx` or the client's `ShellLayout`, scan current page's widget tree:
   - Find `type: 'table'` or `type: 'data'` nodes
   - Find their column children with `props.filterable === true`
   - Extract field names and resolve types/labels from `modelMeta`

2. Pass the resolved `filterFields[]` to the shell `Layout` component (add a prop to `ShellLayoutProps`)

3. The UI's `ShellLayout` renders:
   - `FilterBar.Trigger` in `Shell.Main.Actions` (alongside page action buttons)
   - `FilterBar.Content` (chips + popover) below `Shell.Main.Header` when expanded

4. Filter handlers write to page state store — same mechanism as inline filters:
   - `store.set('$filter.{model}.{field}__${op}', value)`
   - `useModelQuery` picks it up automatically

5. Auto CRUD generator already produces `layout: 'full'` list pages with filterable columns — no changes needed there.

## Key files

| File                                                                  | Status                                                          |
| --------------------------------------------------------------------- | --------------------------------------------------------------- |
| `packages/ui/src/data/filter-operators.ts`                            | Done                                                            |
| `packages/ui/src/data/__tests__/filter-operators.test.ts`             | Done                                                            |
| `packages/ui/src/widgets/data/table-filter-bar.tsx`                   | Done                                                            |
| `packages/ui/src/widgets/data/__tests__/table-filter-bar.api.test.ts` | Done                                                            |
| `packages/ui/src/widgets/data/table-widget.tsx`                       | Done (inline filters gated on `surface === 'card'`)             |
| `packages/client/src/widgets/controllers/TableController.tsx`         | Done (resolves filterFields, reads activeFilters, passes to UI) |
| `packages/client/src/router/buildRouteTree.tsx`                       | Done (SurfaceProvider wraps pages)                              |
| `packages/core/src/boot/crud-page-generator.ts`                       | Done (sets filterable on columns)                               |
| `packages/core/src/boot/__tests__/crud-page-generator.test.ts`        | Done (5 new tests)                                              |
| `packages/shared/src/types/ui-kit.ts`                                 | Reverted (no filter slots)                                      |
| `packages/client/src/shell/ShellLayout.tsx`                           | Reverted (no filter registry)                                   |
| `packages/ui/src/shell/kit/ShellLayout.tsx`                           | Reverted (no filter slots)                                      |

## Files to clean up

- `packages/client/src/widgets/filter/` directory was removed
- `packages/client/src/shell/HeaderFilterBar.tsx` was removed
- `packages/ui/src/widgets/data/header-filter-bar-widget.tsx` was removed

## Uncommitted changes

Run `git diff --stat` to see current working state. The inline filter for card layout is complete and working. The full-layout page-level filter is the remaining work.
