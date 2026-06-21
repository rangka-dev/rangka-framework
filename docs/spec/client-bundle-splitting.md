# Client Bundle Splitting

> **Status: Planned**

## Overview

The client package currently builds as a single chunk. All 38 built-in widgets are statically imported in `register.ts`, pulling in every widget component and their dependencies (Radix primitives, Recharts, etc.) regardless of what a page actually renders.

This spec defines a code splitting strategy that reduces the initial bundle to a core shell plus on-demand widget chunks, without breaking the existing custom widget build pipeline.

## Goals

- Reduce initial bundle size by loading widgets on demand
- Keep the custom widget system (`build-widgets.ts`, manifest, `LazyWidget`) unchanged
- Maintain synchronous rendering for the most common widgets (no flash of placeholder)
- Vendor libraries cached independently from application code
- Remove dead code (unused Recharts/chart.tsx)

## Non-goals

- Route-based splitting (pages are metadata-driven, not code-driven)
- Changes to the `WidgetProps` contract or widget registration API
- Changes to the custom widget CLI build pipeline

## Current state

### Bundle composition

```
index.js (single chunk)
├── Shell (layout, sidebar, command palette)
├── Boot + routing
├── 38 built-in widgets (register.ts imports all)
├── 70 shadcn/ui components
├── Radix primitives (used across widgets)
├── Recharts (imported in chart.tsx, never rendered)
├── TanStack Query + Router
└── Widget rendering pipeline
```

### How widgets load today

Built-in widgets register synchronously at startup:

```
main.tsx → registerBuiltInWidgets() → all 38 imported and registered
```

Custom widgets load on demand:

```
WidgetRenderer → getWidget(name) → miss → LazyWidget → ensureWidget(name)
  → fetch manifest → dynamic import(url) → registerWidget()
```

## Design

### 1. Widget tiers

Split built-in widgets into two tiers based on usage frequency:

**Core tier (always bundled, ~10 widgets):**

Widgets that appear on nearly every page. Registered synchronously at startup.

| Widget  | Reason                            |
| ------- | --------------------------------- |
| Group   | Layout container, used everywhere |
| Grid    | Layout container                  |
| Text    | Display, appears on every page    |
| Button  | Actions                           |
| Input   | Most common form field            |
| Select  | Common form field                 |
| Form    | Form wrapper                      |
| Data    | Data provider                     |
| Section | Page structure                    |
| Slot    | Composition primitive             |

**Lazy tier (loaded on demand, ~28 widgets):**

Everything else. Loaded on first render via the existing `LazyWidget` component.

| Category | Widgets                                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------------------------- |
| Input    | Checkbox, Radio, Switch, Textarea, DatePicker, TimePicker, NumberInput, FileUpload, RichText, ManyToMany, BelongsTo |
| Display  | Badge, Icon, Image, Avatar, Stat, Progress                                                                          |
| Layout   | Split, Tabs, Card, Separator                                                                                        |
| Data     | Table, Repeat                                                                                                       |
| Overlay  | Drawer, Modal, Popover                                                                                              |
| Action   | Link, Dropdown                                                                                                      |

### 2. Built-in lazy loading

Create a built-in widget manifest that maps widget names to dynamic `import()` calls. This reuses the existing `LazyWidget` flow.

**New file: `widgets/components/lazy-manifest.ts`**

```ts
export const lazyWidgets: Record<string, () => Promise<{ default: any }>> = {
  table: () => import('./TableWidget'),
  tabs: () => import('./TabsWidget'),
  drawer: () => import('./DrawerWidget'),
  // ... all lazy-tier widgets
};
```

**Updated `loader.ts` flow:**

```
ensureWidget(name)
  → check registry (already loaded?) → done
  → check lazyWidgets manifest (built-in lazy?) → dynamic import → register → done
  → check custom manifest (custom widget?) → fetch URL → register → done
  → not found
```

Priority order: registry > built-in lazy > custom manifest. Built-in lazy imports use Vite's standard dynamic `import()`, which produces separate chunks at build time automatically.

### 3. Vendor chunk separation

Configure Vite `manualChunks` to isolate heavy vendor libraries into stable, cacheable chunks:

```ts
manualChunks: {
  'vendor-react': ['react', 'react-dom'],
  'vendor-query': ['@tanstack/react-query'],
  'vendor-router': ['@tanstack/react-router'],
  'vendor-radix': [/* radix packages used by core-tier widgets */],
}
```

Radix packages used only by lazy-tier widgets will naturally land in those widget chunks instead of the vendor chunk.

### 4. Dead code removal

- Remove `components/ui/chart.tsx` and `recharts` dependency (no widget uses it)
- Audit other unused shadcn components and remove if not imported anywhere

### 5. Chunk structure after splitting

```
index.js              — Shell + boot + core widgets + rendering pipeline
vendor-react.js       — React, ReactDOM
vendor-query.js       — TanStack Query
vendor-router.js      — TanStack Router
vendor-radix.js       — Radix primitives (core-tier only)
widget-table.js       — TableWidget + its Radix deps
widget-tabs.js        — TabsWidget
widget-drawer.js      — DrawerWidget
widget-modal.js       — ModalWidget
...                   — One chunk per lazy widget (or grouped by category)
```

### 6. Grouping strategy

Individual chunks per widget may create too many small files. Group related widgets into category chunks:

```ts
// Option: category-based grouping
'widgets-input': () => import('./categories/input'),    // all input widgets
'widgets-display': () => import('./categories/display'),
'widgets-overlay': () => import('./categories/overlay'),
'widgets-data': () => import('./categories/data'),
```

Trade-off: fewer network requests vs loading unused widgets in a category. Start with per-widget chunks and measure. If the number of chunks causes waterfall issues, group into categories.

## Implementation steps

1. Remove `recharts` dependency and `components/ui/chart.tsx`
2. Create `widgets/components/lazy-manifest.ts` with dynamic imports for lazy-tier widgets
3. Update `register.ts` to only register core-tier widgets
4. Update `loader.ts` to check built-in lazy manifest before custom manifest
5. Configure `manualChunks` in `vite.config.ts` for vendor separation
6. Run build and verify chunk output
7. Test that lazy widgets render correctly (first load shows placeholder briefly, then widget)
8. Test that custom widget pipeline still works (manifest fetch, CSS injection, global externals)
9. Measure bundle sizes before/after

## Compatibility

| Component                     | Impact                                                           |
| ----------------------------- | ---------------------------------------------------------------- |
| Custom widget CLI build       | None. Separate pipeline, outputs to `/_rangka/widgets/`          |
| Custom widget runtime loading | None. Same `LazyWidget` → `ensureWidget()` flow                  |
| `window.__rangka_*` globals   | None. Set in `main.tsx` before any widget loads                  |
| Widget registry API           | None. `registerWidget()` / `getWidget()` unchanged               |
| WidgetProps contract          | None. All widgets receive same props                             |
| WidgetRenderer decision flow  | Unchanged. Still checks registry first, falls back to LazyWidget |

## Risks

| Risk                                            | Mitigation                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Flash of placeholder on first widget render     | Core-tier covers the most common widgets. Preload hints for likely next widgets.           |
| Too many small chunks causing network waterfall | Group into categories if measured latency is worse than single bundle                      |
| Widget render order depends on load order       | Each widget loads independently. Parent layout widgets are core-tier so they render first. |
| SSR or prerender breaks                         | Not applicable. Client is a pure SPA.                                                      |

## Success metrics

- Initial JS payload reduced by 40%+ (target: core chunk < 150KB gzipped)
- First contentful paint improved (fewer bytes to parse before shell renders)
- Lazy widgets load within 100ms on local network (cached after first load)
- Zero regressions in custom widget loading
- Build time not significantly increased (< 20% slower)
