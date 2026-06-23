---
title: Page breadcrumb
status: draft
created: 2026-06-21
---

# Page breadcrumb

## Problem

Record pages use route params like `/sales/order/abc-123-def-456` in breadcrumbs. UIDs are meaningless to users. The breadcrumb should show a human-readable value from the record (e.g., "Order #1042").

The shell renders breadcrumbs before widgets load their data, and a page may have multiple data sources. There is no way for the breadcrumb to know which record to display.

## Design

### Breadcrumb config on PageDefinition

Add an optional `breadcrumb` field to PageDefinition. When present, the shell fetches a single field from the specified model and displays it instead of the static label.

```typescript
export interface PageBreadcrumb {
  model: string; // qualified model name, e.g. 'sales.order'
  field: string; // field to display, e.g. 'order_number'
  param?: string; // route param to use as record ID (defaults to 'id')
}

export interface PageDefinition {
  key: string;
  label: string;
  path?: string;
  actions?: Action[];
  breadcrumb?: PageBreadcrumb;
  widgets: WidgetNode[];
}
```

### Behavior

- If `breadcrumb` is defined and the route has the matching param: fetch the field from the model, display it as the breadcrumb segment.
- If `breadcrumb` is not defined: use the static `label`.
- While loading: show the static `label` as placeholder until the field resolves.
- If the fetch fails: fall back to the static `label`.

### Usage

```yaml
# Dynamic breadcrumb
key: sales.order.detail
label: Order Detail
path: order/:id
breadcrumb:
  model: sales.order
  field: order_number
widgets:
  - type: data
    source: { model: sales.order }
    # ...
```

Breadcrumb displays: `Sales > Orders > ORD-1042`

```yaml
# No breadcrumb — static label
key: sales.order.list
label: Orders
path: order
widgets:
  - type: table
    source: { model: sales.order }
```

Breadcrumb displays: `Sales > Orders`

### Client implementation

The shell's `useBreadcrumbs` hook checks each route segment's page definition for a `breadcrumb` config. If present:

1. Read the route param (default `id`) from current params.
2. Fetch `GET /api/{module}/{model}/{id}?fields={field}` (single field projection).
3. Use the returned field value as the breadcrumb label.
4. Show static `label` while loading or on error.

This is a lightweight fetch. The `fields` query param limits the response to a single column.

### Drop `type` field from PageDefinition

The `type` field (`'collection' | 'record' | 'dashboard'`) is removed. It has no runtime behavior. All page layout is determined by the widget tree in `widgets`.

```typescript
// Before
export interface PageDefinition {
  key: string;
  label: string;
  path?: string;
  actions?: Action[];
  widgets: WidgetNode[];
}

// After
export interface PageDefinition {
  key: string;
  label: string;
  path?: string;
  actions?: Action[];
  breadcrumb?: PageBreadcrumb;
  widgets: WidgetNode[];
}
```

## Files to modify

- `packages/shared/src/types/page.ts` — remove `type`, add `breadcrumb` field and `PageBreadcrumb` interface
- `packages/shared/src/builders/page.ts` — remove `type()` builder method, add `breadcrumb()` method
- `packages/client/src/shell/useBreadcrumbs.ts` — resolve dynamic breadcrumb via fetch
- `packages/core/src/api/model-handler.ts` — support `fields` query param for single-field projection (if not already supported)
- All page definitions in `tests/fixtures/` — remove `type` field
- `docs/reference/define-page.md` — update with breadcrumb config, remove type

## TODO

- [ ] Remove `type` field from `PageDefinition` and all usages
- [ ] Add `PageBreadcrumb` interface and `breadcrumb` field to `PageDefinition`
- [ ] Update `PageBuilder` to support `breadcrumb()` method
- [ ] Implement dynamic breadcrumb resolution in `useBreadcrumbs`
- [ ] Support `fields` query param in model API (if not already)
- [ ] Update test fixtures and docs
