---
status: stable
since: 0.1.0
last-updated: 2026-06-12
description: 'Boot lifecycle phases: discovery, validation, and boot'
---

# How It Works

Most frameworks ask you to build an application piece by piece. Write the schema, generate the migration, create the route, wire the controller, build the frontend. Each layer is your responsibility. Rangka takes a different stance. You describe your system and the framework interprets that description into a running application.

## The idea

```
You describe things → Rangka discovers them → Everything runs
```

There is no build step that generates files. No scaffolding you need to maintain. The framework reads your definitions at startup and assembles the application from them. Add a model, restart, and it is live.

## What you write

Every piece of your application is a `define*()` call in a TypeScript file:

```
modules/sales/
├── module.ts            → defineModule()     # "this domain exists"
├── models/order.ts      → defineModel()      # "this data entity exists"
├── pages/orders.ts      → definePage()       # "this screen exists"
├── hooks/order.ts       → defineHooks()      # "run this code when data changes"
├── services/pricing.ts  → defineService()    # "this logic is reusable"
└── widgets/pipeline.tsx → defineWidget()     # "this custom widget exists"
```

These are pure declarations. They don't execute anything on their own. They describe what your system is. The framework decides how to bring it to life.

## What happens at startup

When you run `rangka start`, three things happen in sequence:

**1. Discovery.** The framework scans your `modules/` folder and any Rangka packages in `node_modules`. It finds every `define*()` export, reads the dependency graph, and loads modules in the right order.

**2. Validation.** Before anything runs, the framework checks that your definitions are consistent. Do all model references point to real models? Are there circular dependencies? Invalid field types? You learn about problems at startup, not at runtime when a user hits a broken screen.

**3. Boot.** The framework creates everything your definitions imply: database tables, API routes, permission structures, background job schedules. Then it starts the HTTP server.

## Two sides of the running app

Once booted, the application has two halves:

**The server** exposes your data as a REST API. Every model gets CRUD endpoints automatically. Every request passes through authentication and permission checks before it touches data.

```
GET    /api/sales/order          → list with filters, sort, pagination
GET    /api/sales/order/:id      → single record
POST   /api/sales/order          → create (runs hooks)
PUT    /api/sales/order/:id      → update (runs hooks)
DELETE /api/sales/order/:id      → delete (runs hooks)
```

**The frontend** is a pre-built shell that renders itself from metadata. On page load, it fetches everything it needs from one endpoint (`/api/meta/boot`) which returns the current user's permissions, navigation tree, page definitions, and model schemas. The shell builds the sidebar, routes, and layouts from this payload. Views (lists, forms, kanban boards) fetch their own data as needed.

You never write React components for standard screens. The shell reads your page definitions and renders the right views with the right data. You only write custom components when you need something the built-in views cannot express.

## Development mode

In development, the feedback loop is fast:

- Change a model, the server restarts, database schema updates automatically
- Add a field, the form gains an input, the API accepts the value, no other changes needed
- Break a reference, you get a clear error at startup telling you what went wrong

Schema sync in development is non-destructive: it adds columns and creates tables, but never drops anything. For production, you use explicit migrations.

## The mental model

Think of Rangka as an interpreter for business applications. Your `define*()` calls are the source code. The framework is the runtime. You are not building the infrastructure. You are describing the system, and the infrastructure emerges from the description.

When you need behavior the declarations cannot express, you drop into code: a hook for custom validation, a service for complex calculations, a custom view for a specialized interface. But the scaffolding, the repetitive work that looks the same across every list, every form, every CRUD endpoint, the framework handles that so you can focus on what makes your application unique.
