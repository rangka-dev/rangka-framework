# Widget data hooks spec

Shared data-fetching hooks for all data-aware widgets. DataWidget, FormWidget, and TableWidget all consume these hooks. One place to maintain fetch logic, query building, and magic variable integration.

## Principles

- Widgets never call `apiClient` directly. They use these hooks.
- List queries use the reactivity system (magic variables) for pagination, sorting, filtering, and search.
- Single record fetches are simple: model + id.
- All hooks return a consistent shape so widgets handle loading/error uniformly.

---

## 1. Hook inventory

```
packages/client/src/widgets/data/
  useModelRecord.ts   — fetch a single record by model + id
  useModelQuery.ts    — fetch a list with magic variable support
  index.ts            — re-exports
```

These replace widget-specific fetch logic. The existing `src/data/useRecord` and `src/data/useSource` remain as lower-level primitives for non-widget use (custom views, shell components).

---

## 2. useModelRecord

Fetches a single record. Used by FormWidget (edit mode) and DataWidget (single record mode).

```typescript
interface UseModelRecordOptions {
  model: string;
  id: string | null | undefined;
  enabled?: boolean;
}

interface UseModelRecordResult {
  data: Record<string, unknown> | undefined;
  isLoading: boolean;
  error: Error | null;
}

function useModelRecord(options: UseModelRecordOptions): UseModelRecordResult;
```

Internally wraps TanStack Query. Query key: `['model', model, id]`.

---

## 3. useModelQuery

Fetches a list with pagination, sorting, filtering, and search driven by magic variables. Used by DataWidget (list mode) and TableWidget.

```typescript
interface UseModelQueryOptions {
  model: string;
  pageSize?: number;
  enabled?: boolean;
  staticFilters?: Record<string, unknown>;
}

interface UseModelQueryResult {
  data: Record<string, unknown>[];
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  total: number | undefined;
  page: number;
  pageSize: number;
  sort: SortEntry[] | null;
}

function useModelQuery(options: UseModelQueryOptions): UseModelQueryResult;
```

### Magic variable integration

`useModelQuery` reads the page state store via `useDataQuery` for:

| Variable | Key format                        | Effect                     |
| -------- | --------------------------------- | -------------------------- |
| Filter   | `$filter.{model}.{field}[__{op}]` | Adds filter param to query |
| Sort     | `$sort.{model}`                   | Sets sort param            |
| Page     | `$page.{model}`                   | Sets page number           |
| Search   | `$search.{model}`                 | Adds search param          |

These variables are set by any widget (filter inputs, sort buttons, pagination controls) via the action dispatcher's `setValue` action on the state store.

### Static filters

`staticFilters` are always applied regardless of magic variables. Used when a widget needs a fixed scope (e.g., DataWidget that always filters by a parent ID).

```typescript
// DataWidget with static parent filter
{ type: 'data', bind: { model: { name: 'sales.order_line' }, filter: { order_id: '{{$route.id}}' } } }

// Translates to:
useModelQuery({ model: 'sales.order_line', staticFilters: { order_id: '123' } })
```

Static filters merge with magic variable filters. Static filters take precedence on conflict.

---

## 4. Migration path

| Current                                   | Becomes                                               |
| ----------------------------------------- | ----------------------------------------------------- |
| `useModelSource` in `widgets/hooks/`      | Replaced by `useModelQuery` in `widgets/data/`        |
| `useRecord` in `src/data/` for widget use | Replaced by `useModelRecord` in `widgets/data/`       |
| `useSource` in `src/data/`                | Stays as-is for custom views and non-widget consumers |
| `useRecord` in `src/data/`                | Stays as-is for non-widget consumers                  |

TableWidget switches from `useModelSource` to `useModelQuery`. The interface is the same. `useModelSource` is removed after migration.

---

## 5. Consumers

| Widget              | Hook             | Mode                                  |
| ------------------- | ---------------- | ------------------------------------- |
| DataWidget (single) | `useModelRecord` | model + id                            |
| DataWidget (list)   | `useModelQuery`  | model + magic variables               |
| FormWidget (edit)   | `useModelRecord` | model + id (then wraps in form state) |
| FormWidget (create) | neither          | starts with empty values              |
| TableWidget         | `useModelQuery`  | model + magic variables               |

---

## 6. Error handling

Both hooks expose `error: Error | null`. Widgets render error states from this. The hooks do not toast or throw. Error display is the widget's responsibility.

---

## 7. Query invalidation

After a successful form submit, the form invalidates queries for its model:

```typescript
queryClient.invalidateQueries({ queryKey: ['model', model] });
```

This causes any DataWidget or TableWidget showing the same model to refetch. The invalidation key matches because all hooks use `['model', model, ...]` as their query key prefix.
