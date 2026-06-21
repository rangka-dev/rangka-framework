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
      return { success: true, data: { status: 'Submitted' } };
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

**Response (success):**

```json
{ "success": true, "data": { "status": "Submitted" } }
```

**Response (error — service threw):**

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

### Flow

1. Extract auth from JWT (same as model routes)
2. Parse qualified service name from URL: `{module}.{name}`
3. Look up service in registry. If not found or not callable (returns object, not function) → 404
4. Check `roles` on the definition against user's roles → 403 if no match. If `roles` is omitted, any authenticated user can call it.
5. Build `ServiceContext` with caller's auth
6. Call the service function with request body as params
7. Return the result directly (service returns the envelope)
8. If the function throws, catch and return `{ success: false, error: { message } }`

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

Same interface, no HTTP round-trip:

```typescript
// In a hook or job:
const result = await ctx.service('sales.submitOrder')({ orderId: '123' });
// result = { success: true, data: { status: 'Submitted' } }
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

### Reserved module names

These names cannot be used as module namespaces (validated at boot):

- `core`
- `meta`
- `services`

### Error handling

Services throw errors for business logic failures. The adapter catches all errors:

- `ServiceError` (new class) → 200 with `{ success: false, error: { message } }`
- `AppError` subclasses (BadRequest, Forbidden, etc.) → appropriate HTTP status
- Unknown errors → 500 with generic message

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
- `packages/core/src/services/types.ts` — add `roles` field to ServiceDefinition
- `packages/core/src/api/` — new service handler + route registration
- `packages/core/src/errors.ts` — add `ServiceError` class
- `packages/core/src/boot/` — validate reserved module names
- `packages/client/src/shell/ShellLayout.tsx` — wire up `service` action type in `handleAction`
- `packages/client/src/widgets/shell/useActionHandlers.ts` — update URL to `/api/services/{module}/{name}` (split qualified name on dot)
- `docs/reference/define-service.md` — document callable pattern and HTTP API
- `docs/concepts/services.md` — update with callable pattern

## TODO

- [ ] Implement service HTTP endpoint in core (handler + route registration)
- [ ] Wire up `service` action type in `ShellLayout.handleAction` (call `useActionHandlers` service handler)
- [ ] Update `useActionHandlers.ts` URL from `/api/services/${name}` to `/api/services/${module}/${name}`
- [ ] Validate reserved module names at boot
- [ ] Add `ServiceError` class to core
