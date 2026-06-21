---
title: Service HTTP API
status: draft
created: 2026-06-21
---

# Service HTTP API

## Problem

Services are the fundamental unit of custom logic in Rangka. They can be called by hooks, jobs, other services, and will later serve as the execution layer for workflows. But currently there's no way to call a service from the client (frontend). The client's action system references services by name, but no HTTP endpoint exists to execute them.

## Design

### Callable services

A callable service is a service whose factory returns a single async function. The function receives a params object and returns a standardized result envelope.

```typescript
defineService({
  name: 'sales.submitOrder',
  roles: ['sales_user', 'admin'],
  factory(ctx) {
    return async (params: { orderId: string }) => {
      const order = await ctx.models.get('sales.order', params.orderId);
      if (order.status !== 'Draft') {
        throw new ServiceError('Can only submit drafts');
      }
      await ctx.models.update('sales.order', params.orderId, { status: 'Submitted' });
      return { status: 'Submitted' };
    };
  },
});
```

### HTTP endpoint

```
POST /api/services/{module}/{name}
```

Example: service `sales.submitOrder` is called at `POST /api/services/sales/submitOrder`.

**Request:**

```
POST /api/services/sales/submitOrder
Authorization: Bearer <jwt>
Content-Type: application/json

{ "orderId": "abc123" }
```

**Response (success — service returned `{ status: "Submitted" }`):**

```json
{ "success": true, "data": { "status": "Submitted" } }
```

**Response (error — service threw `ServiceError`):**

```json
{ "success": false, "error": { "message": "Can only submit drafts" } }
```

**Response (401 — no auth):**

```json
{ "error": { "code": "UNAUTHORIZED", "message": "Authentication required" } }
```

**Response (403 — missing role):**

```json
{ "error": { "code": "FORBIDDEN", "message": "Insufficient permissions" } }
```

**Response (404 — service not found or not callable):**

```json
{ "error": { "code": "NOT_FOUND", "message": "Service not found" } }
```

### Response envelope

Services return raw data. The HTTP layer wraps it:

**Success:** The service return value is wrapped in `{ success: true, data: <return value> }`.

**Error:** If the service throws, it becomes `{ success: false, error: { message } }`.

The service function never constructs the envelope itself.

### Flow

1. Extract auth from JWT (same as model routes)
2. Parse qualified service name from URL: `{module}.{name}`
3. Look up service in registry. If not found or not callable (returns object, not function) → 404
4. Check `roles` on the definition against user's roles → 403 if no match. If `roles` is omitted, any authenticated user can call it.
5. Build `ServiceContext` with caller's auth (call depth starts at 0)
6. Call the service function with request body as params
7. Wrap return value in `{ success: true, data: <value> }`
8. If the function throws `ServiceError` → 200 with `{ success: false, error: { message } }`
9. If the function throws `AppError` subclass → appropriate HTTP status
10. Unknown errors → 500 with generic message (do not leak internals)

### ServiceDefinition changes

Add optional `roles` field:

```typescript
export interface ServiceDefinition {
  name: string;
  label?: string;
  deps?: string[];
  roles?: string[]; // NEW: required roles for HTTP callers
  factory: ServiceFactory;
}
```

### Callable detection

A service is callable via HTTP if its factory returns a function (not an object). The registry can detect this at boot time after instantiation, or the adapter can check at request time:

```typescript
const instance = registry.get(name, ctx);
if (typeof instance !== 'function') {
  throw new NotFoundError('Service not found');
}
```

Services that return objects with methods remain internal-only. They are still callable via `ctx.service(name)` in hooks, jobs, and other services.

### Internal callers

Internal callers get the raw return value directly. No envelope wrapping. Errors throw naturally.

```typescript
// In a hook or job:
const result = await ctx.service('sales.submitOrder')({ orderId: '123' });
// result = { status: 'Submitted' }
```

If the service throws, the error bubbles up through the normal chain:

- **Service → service**: bubbles to the outer service
- **Hook → service**: bubbles to the hook pipeline, aborts transaction
- **Job → service**: bubbles to the job runner, marks job as failed

The framework catches at defined boundaries (API route handler, job runner, hook pipeline). It never swallows errors silently.

### Call depth limit

A depth counter prevents infinite recursion or circular calls (e.g., A → B → A → B...).

- The `FrameworkContext` carries a `_callDepth` field, starting at 0 for HTTP/job entry points.
- Each `ctx.service()` call increments depth before invoking the target.
- If depth exceeds `MAX_SERVICE_DEPTH` (default: 10), throws `ServiceError('Maximum service call depth exceeded')`.
- The limit applies equally to deep chains and circular calls.

```typescript
// Internal: depth increments automatically
ctx.service('a')()       // depth 1
  → ctx.service('b')()  // depth 2
    → ctx.service('c')() // depth 3
    → ...
    → ctx.service('x')() // depth 11 → throws ServiceError
```

### Client integration

The existing action format works as-is:

```typescript
// Page action
{ type: 'service', name: 'sales.submitOrder', params: { orderId: '{{id}}' } }

// Widget trigger
on: { click: { type: 'service', name: 'sales.submitOrder', params: { orderId: '{{id}}' } } }
```

The client calls `POST /api/services/sales/submitOrder` with the params as body.

### Service as widget data source

Widgets can use a service as their data source for analytics, reports, or custom queries that don't map to a single model.

**WidgetSource type:**

```typescript
interface WidgetSource {
  type?: 'model' | 'service'; // defaults to 'model'

  // model source
  model?: string;
  id?: string;
  filters?: Record<string, unknown>;
  limit?: number;

  // service source
  service?: string;
  params?: Record<string, unknown>;
}
```

**Usage:**

```yaml
# Model source (type optional for backwards compat)
source:
  model: sales.order
  filters: { status: paid }

# Service source
source:
  type: service
  service: analytics.salesReport
  params: { year: 2026, region: '{{$state.region}}' }
```

**Client behavior:**

- If `type === 'service'` or `source.service` is set: use `useServiceQuery` hook → `POST /api/services/{module}/{name}` with params as body.
- Otherwise: use `useModelQuery` as today.

**Data contract:**

The service returns raw data (array or object). For table widgets, columns are declared explicitly in widget children since there is no model schema to derive them from.

**Refresh:**

The `refreshSource` action works the same way. `useServiceQuery` uses a TanStack Query key of `['service', serviceName, params]`. Context-based invalidation triggers a re-fetch.

**No built-in pagination/sort/filter.** The service receives only explicit params. If the service needs pagination, accept page/limit as params directly.

### Reserved module names

These names cannot be used as module namespaces (validated at boot):

- `core`
- `meta`
- `services`

### Error handling

Services throw errors for business logic failures. Error handling differs by caller:

**HTTP callers (via the endpoint):**

- `ServiceError` (new class) → 200 with `{ success: false, error: { message } }`
- `AppError` subclasses (BadRequest, Forbidden, etc.) → appropriate HTTP status
- Unknown errors → 500 with generic message

**Internal callers (via `ctx.service()`):**

- Errors throw naturally. The calling code can try/catch if it wants to handle them.
- Unhandled errors bubble up to the framework boundary (API route, job runner, hook pipeline).
- The framework never swallows errors silently. Every boundary either returns an HTTP error, rolls back the transaction, or marks the job as failed.

### Future: workflow integration

Services are the execution layer for the workflow engine. A workflow step triggers a service:

```yaml
steps:
  - service: sales.submitOrder
    params:
      orderId: '{{ trigger.data.id }}'
    on_success: notify_customer
    on_error: escalate
```

The workflow engine calls the same function with the same interface. Auth context comes from the workflow trigger source (webhook auth, system context for scheduled triggers, user context for manual triggers).

## Files to modify

- `packages/shared/src/types/service.ts` — add `roles` field to ServiceConfig
- `packages/shared/src/types/widget.ts` — extend `WidgetSource` with `type`, `service`, `params` fields
- `packages/shared/src/types/context.ts` — add `_callDepth` to FrameworkContext
- `packages/core/src/services/types.ts` — add `roles` field to ServiceDefinition
- `packages/core/src/services/registry.ts` — increment depth on `ctx.service()`, enforce limit
- `packages/core/src/api/` — new service handler + route registration
- `packages/core/src/errors.ts` — add `ServiceError` class
- `packages/core/src/boot/` — validate reserved module names
- `packages/client/src/widgets/data/useServiceQuery.ts` — new hook for service data source
- `packages/client/src/widgets/context/builder.ts` — handle `type: 'service'` in source
- `packages/client/src/widgets/components/TableWidget.tsx` — use `useServiceQuery` when source is service
- `packages/client/src/widgets/components/DataWidget.tsx` — use `useServiceQuery` when source is service
- `packages/client/src/shell/ShellLayout.tsx` — wire up `service` action type in `handleAction`
- `packages/client/src/widgets/shell/useActionHandlers.ts` — update URL to `/api/services/{module}/{name}` (split qualified name on dot)
- `docs/reference/define-service.md` — document callable pattern and HTTP API
- `docs/concepts/services.md` — update with callable pattern

## TODO

- [ ] Implement service HTTP endpoint in core (handler + route registration)
- [ ] Add `ServiceError` class to core
- [ ] Add `_callDepth` to FrameworkContext, enforce max depth in service registry
- [ ] Extend `WidgetSource` type with `type`, `service`, `params` fields
- [ ] Add `useServiceQuery` hook in client
- [ ] Update `buildContext` to handle service source
- [ ] Update `TableWidget` and `DataWidget` to use `useServiceQuery` when source is service
- [ ] Wire `refreshSource` to invalidate service query key based on context
- [ ] Wire up `service` action type in `ShellLayout.handleAction` (call `useActionHandlers` service handler)
- [ ] Update `useActionHandlers.ts` URL from `/api/services/${name}` to `/api/services/${module}/${name}`
- [ ] Validate reserved module names at boot
