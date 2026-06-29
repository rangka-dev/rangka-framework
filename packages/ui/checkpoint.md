# Filter System Checkpoint (RAN-29)

## What's done

### Inline filter (card layout)

- `filterable: true` on columns works — `TableController` resolves field metadata
- Inline `TableFilterBar` renders above table when `surface === 'card'` (default layout)
- Filter operators utility (`packages/ui/src/data/filter-operators.ts`)
- `TableFilterBar` UI component with two-step field→operator→value flow
- Auto CRUD generator sets `filterable` on appropriate column types (enum, boolean, link, date, datetime, int, decimal, money)
- Filter state writes to page state store (`$filter.{model}.{field}__${op}`) via `useDataQuery`
- `useModelQuery` picks up filter changes and re-fetches automatically
- `SurfaceProvider` wraps pages based on layout in `buildRouteTree.tsx`
- Same field+operator: second filter replaces first (API limitation — server only supports one value per field+operator)

### Page-level filter (full layout)

- `ShellLayout` scans current page's widget tree to extract filterable columns from table nodes
- `extractFilterFields.ts` utility walks widget tree, resolves field metadata from `useMeta().models`
- Filter trigger is a regular page action using `action.setValue('$state.filterOpen', '{{!$state.filterOpen}}')`
- CRUD generator adds filter toggle action to list pages when filterable columns exist
- `ShellLayout` watches `pageState.get('filterOpen')` — renders `ShellFilterBar` when truthy
- `ShellFilterBar` uses `FilterBar.*` composition components from `@rangka/ui`
- Filter bar rendered via `filterBar` prop on `ShellLayoutProps`, slotted between header and body
- Filter handlers write to `$filter.*` keys in page state — same mechanism as inline filters
- Active filters read from page state using `getFiltersForModel()`

## Key files

| File                                                                  | Status                                                            |
| --------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `packages/ui/src/data/filter-operators.ts`                            | Done                                                              |
| `packages/ui/src/data/__tests__/filter-operators.test.ts`             | Done                                                              |
| `packages/ui/src/data/filter-bar.tsx`                                 | Done                                                              |
| `packages/ui/src/widgets/data/table-filter-bar.tsx`                   | Done                                                              |
| `packages/ui/src/widgets/data/__tests__/table-filter-bar.api.test.ts` | Done                                                              |
| `packages/ui/src/widgets/data/table-widget.tsx`                       | Done (inline filters gated on `surface === 'card'`)               |
| `packages/ui/src/shell/kit/ShellLayout.tsx`                           | Done (filterBar slot between header and body)                     |
| `packages/client/src/widgets/controllers/TableController.tsx`         | Done (resolves filterFields, reads activeFilters, passes to UI)   |
| `packages/client/src/router/buildRouteTree.tsx`                       | Done (SurfaceProvider wraps pages)                                |
| `packages/client/src/shell/ShellLayout.tsx`                           | Done (filter field extraction, state watch, filter bar rendering) |
| `packages/client/src/shell/extractFilterFields.ts`                    | Done (widget tree scan utility)                                   |
| `packages/client/src/shell/ShellFilterBar.tsx`                        | Done (filter bar orchestration component)                         |
| `packages/core/src/boot/crud-page-generator.ts`                       | Done (filter toggle action + filterable columns)                  |
| `packages/core/src/boot/__tests__/crud-page-generator.test.ts`        | Done (5 filter tests)                                             |
| `packages/shared/src/types/ui-kit.ts`                                 | Done (filterBar prop on ShellLayoutProps)                         |
