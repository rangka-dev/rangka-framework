# Plugin System

> **Status: To be implemented**

## Motivation

The framework needs an extensibility layer that separates runtime capabilities from business features. Currently, adding new data sources, auth strategies, or field types requires modifying the core. A plugin system lets the core stay lean while enabling community and enterprise extensions.

Two systems exist side by side:

- **Module** — collection of pages, models, services, and hooks. Builds business features.
- **Plugin** — extends the framework runtime with new capabilities. Provides adapters, auth strategies, field types, widget types.

Modules consume what plugins provide. The framework validates compatibility at boot.

## Design

### definePlugin

A plugin is a named package with a config schema, a static capability declaration, and an imperative boot function.

```typescript
definePlugin({
  name: 'stripe',
  version: '1.0.0',

  config: {
    secretKey: { type: 'string', required: true },
    webhookSecret: { type: 'string' },
    apiVersion: { type: 'string', default: '2024-12-18' },
  },

  provides: {
    adapters: [{
      name: 'stripe',
      capabilities: ['read', 'list', 'filter', 'create', 'update'],
    }],
  },

  boot(ctx) {
    const stripe = new Stripe(ctx.config.secretKey);

    ctx.adapters.stripe.implement({
      list(model, query) { ... },
      get(model, id) { ... },
      batchGet(model, ids) { ... },
      create(model, data) { ... },
      update(model, id, data) { ... },
    });
  },
})
```

### Config management

Plugins declare their config schema. Developers provide values in `rangka.config.ts`. The framework validates required fields at boot and passes a typed config object to `boot()`.

```typescript
// rangka.config.ts
defineConfig({
  database: { ... },
  plugins: {
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
    warehouse_db: {
      host: process.env.WAREHOUSE_HOST,
      database: 'warehouse',
      user: process.env.WAREHOUSE_USER,
      password: process.env.WAREHOUSE_PASSWORD,
    },
  },
})
```

### Static provides block

The `provides` block declares what the plugin offers without running code. This enables:

- Boot-time validation (all declared capabilities must be implemented)
- Discovery (framework and AI can inspect plugin capabilities statically)
- Conflict detection (no two plugins register the same name in a registry)

Available registry slots:

| Slot             | What it registers                           |
| ---------------- | ------------------------------------------- |
| `adapters`       | Data source connections for external models |
| `authStrategies` | SSO providers, OAuth, SAML, custom auth     |
| `fieldTypes`     | Custom field types beyond built-ins         |

Widget types are a module-level concern (via `defineWidget`), not a plugin concern. Business modules register their own custom widgets alongside their models and pages.

The `provides` object is extensible. Plugins omit slots they don't use. New slot types can be added in future without breaking existing plugins.

### Boot function

The `boot()` function receives a context with:

- `ctx.config` — typed config values from `rangka.config.ts`
- `ctx.adapters.<name>.implement(impl)` — wire up declared adapters
- `ctx.on(event, handler)` — register lifecycle hooks

Lifecycle events:

| Event            | When it fires                                                |
| ---------------- | ------------------------------------------------------------ |
| `beforeBoot`     | Before framework resolves models and builds schema           |
| `afterBoot`      | After all models resolved, routes registered, ready to serve |
| `beforeRequest`  | Before each HTTP request is handled                          |
| `afterRequest`   | After each HTTP request completes                            |
| `beforeShutdown` | Before the server stops                                      |

### Plugin resolution order

1. Local `plugins/` directory (dev/custom)
2. `node_modules` (installed packages)
3. Pre-installed in Docker image (platform-provided)

Local always wins. No two plugins may share the same name.

### Plugin file structure (convention)

```
@rangka/plugin-stripe/
  src/
    index.ts           — definePlugin (provides + boot)
    config.ts          — config schema type
    types.ts           — shared types
    adapters/
      customer.ts      — per-model adapter logic
      invoice.ts
    auth/              — if plugin provides auth strategies
    fields/            — if plugin provides field types
```

### Boot-time validation

The framework checks at boot:

- All `provides` entries have matching implementations registered in `boot()`
- Config schema requirements are satisfied from `rangka.config.ts`
- No two plugins register the same adapter/strategy/field-type/widget-type name
- External models don't reference adapters that aren't registered
- External models don't exceed their adapter's declared capabilities

Validation failures produce clear error messages and prevent the server from starting.

## Relationship to platform

The managed platform (Studio) ships as a Docker image with official plugins pre-installed. User application code is layered on top. Users activate plugins by referencing them in `rangka.config.ts`.

Studio itself is a module, not a plugin. It uses framework capabilities (pages, services, hooks) to provide workspace management, app deployment, and admin features. Workspace-level settings (like SSO configuration) are platform-managed and injected into the app's plugin config at runtime.
