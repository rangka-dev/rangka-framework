---
status: stable
since: 0.2.0
last-updated: 2026-06-21
description: How the custom widget build pipeline and runtime loader work
---

# Custom Widget Build System

This document explains how custom widgets are compiled, served, and loaded at runtime. Read this if you are working on `@rangka/cli`, `@rangka/client`, or `@rangka/studio-core`.

## Overview

Custom widgets are React components that app developers write in `modules/<module>/widgets/`. The framework compiles them into standalone ES module bundles with scoped CSS, serves them as static files, and loads them on demand in the browser via dynamic `import()`.

The pipeline has three stages: build, serve, load.

## Build pipeline

The build logic lives in `packages/cli/src/build-widgets.ts` and is exported as `buildWidgets(root)`. Both the CLI `rangka build` command and the studio `build_widgets` tool call this function.

### Widget discovery

The scanner (`packages/cli/src/ui-scanner.ts`) finds widgets by convention:

```
modules/*/widgets/*.tsx
modules/*/widgets/*.ts
```

Each file produces a registry key in the format `<module>.<kebab-name>`. For example, `modules/sales/widgets/PipelineBoard.tsx` becomes `sales.pipeline-board`.

### JS bundling

Each widget is bundled independently with esbuild:

| Option      | Value        | Reason                                  |
| ----------- | ------------ | --------------------------------------- |
| `format`    | `esm`        | Dynamic `import()` requires ES modules  |
| `platform`  | `browser`    | Widget runs in the browser              |
| `target`    | `es2022`     | Modern syntax support                   |
| `bundle`    | `true`       | Third-party npm packages are bundled in |
| `jsx`       | `transform`  | Outputs `React.createElement` calls     |
| `nodePaths` | project root | Helps esbuild find deps in pnpm setups  |

A banner injects `var React = window.__rangka_React;` at the top of every bundle so the JSX calls resolve to the shell's React instance.

### Global externals plugin

React and ReactDOM must not be bundled into widgets. They must use the same instance as the shell. An esbuild plugin intercepts these imports:

| Import               | Resolves to                          |
| -------------------- | ------------------------------------ |
| `react`              | `window.__rangka_React`              |
| `react/jsx-runtime`  | `{ jsx, jsxs, Fragment }` from React |
| `react-dom` and subs | `window.__rangka_ReactDOM`           |

All other npm packages (charts, editors, etc.) are bundled into the widget chunk.

### Tailwind CSS generation

After JS bundling, PostCSS + Tailwind v4 generates scoped CSS per widget:

1. Read `dist/theme.css` from `@rangka/client` (the shell's `@theme inline` block)
2. Process a virtual input that imports only `tailwindcss/utilities` and `tailwindcss/theme`, with `source(none)` and `@source` pointing at the widget file
3. Strip the `@layer base` and shell semantic token definitions from the output
4. Keep Tailwind's default palette variables (only those the widget actually uses)

The result is a CSS file that contains only the utility classes the widget references, with color variables defined locally. It does not override the shell's theme.

If esbuild also produces CSS (from `.css` file imports like `@xyflow/react/dist/style.css`), the two are merged into a single output file.

### Theme extraction

The shell's `@theme inline` block defines semantic tokens (`--color-primary`, `--color-card`, etc.) that Tailwind needs to resolve classes like `bg-primary`. This block is extracted during the `@rangka/client` build:

- `packages/client/scripts/extract-theme.js` runs after Vite build
- Reads `src/index.css`, extracts the `@theme inline { ... }` block
- Writes it to `dist/theme.css`

The CLI reads `dist/theme.css` at build time via `resolveShellDir()` (same resolution used to find the shell HTML).

### Manifest generation

The build produces a `manifest.json` mapping widget keys to bundle paths:

```json
{
  "demo.status-card": "/_rangka/widgets/demo--StatusCard.vfz9v.js",
  "demo.workflow-editor": {
    "js": "/_rangka/widgets/demo--WorkflowEditor.ai2yf7.js",
    "css": "/_rangka/widgets/demo--WorkflowEditor.ai2yf7.css"
  }
}
```

Entries are either a string (JS only) or an object with `js` and `css` paths. The loader handles both formats.

### Output structure

```
.rangka/
├── widgets/
│   ├── <module>--<name>.<hash>.js
│   └── <module>--<name>.<hash>.css   (if the widget has styles)
└── manifest.json
```

## Serving

`rangka start` registers `.rangka/` as a static directory at `/_rangka/` using `@fastify/static`. JS and CSS files use content hashes in filenames so they can be cached indefinitely. The manifest is fetched fresh on each page load.

In studio mode, `RuntimeManager.registerRangkaStatic()` handles late registration when `.rangka/` is created after the server boots (e.g., when the agent builds widgets for the first time).

## Runtime loading

The loader lives in `packages/client/src/widgets/loader.ts`.

### Boot phase

When the app reaches the `ready` state, `App.tsx` calls `loadCustomWidgets()`. This fetches `/_rangka/manifest.json` and caches it in memory. If the manifest is not available (no custom widgets), the fetch fails silently.

### Lazy loading

When the `WidgetRenderer` encounters an unknown widget type, it renders a `LazyWidget` component instead of an error:

1. `LazyWidget` calls `ensureWidget(name)`
2. `ensureWidget` checks the manifest cache for the widget key
3. If found, it injects the CSS (via a `<link>` element) and dynamically imports the JS bundle
4. The imported module's default export (`{ meta, component }`) is registered in the widget registry
5. `LazyWidget` re-renders with the loaded component

While loading, a pulsing placeholder is shown. If loading fails, an error placeholder renders. The rest of the page continues working regardless.

### Widget module contract

Custom widgets export a default object:

```typescript
export default { meta, component };
```

Where `meta` is a `WidgetDefinitionMeta` (from `defineWidget()`) and `component` is a React component that receives `WidgetProps`.

## React global injection

The shell exposes React and ReactDOM on `window` in `packages/client/src/main.tsx`:

```typescript
(window as any).__rangka_React = React;
(window as any).__rangka_ReactDOM = ReactDOM;
```

The esbuild banner and global externals plugin ensure widget bundles reference these globals instead of bundling their own React. This guarantees:

- A single React instance (hooks work across shell and widget boundaries)
- `react-dom` features like `createPortal` use the shell's DOM reconciler

## Key files

| Path                                                      | Responsibility                                                              |
| --------------------------------------------------------- | --------------------------------------------------------------------------- |
| `packages/cli/src/build-widgets.ts`                       | Core build function (`buildWidgets`), esbuild config, Tailwind generation   |
| `packages/cli/src/ui-scanner.ts`                          | Widget file discovery                                                       |
| `packages/cli/src/resolve-client.ts`                      | Resolves `@rangka/client/dist/shell` path                                   |
| `packages/cli/src/commands/build.ts`                      | CLI command wrapper                                                         |
| `packages/client/src/widgets/loader.ts`                   | Manifest fetch, dynamic import, CSS injection                               |
| `packages/client/src/widgets/renderer/LazyWidget.tsx`     | Loading/error state for unknown widgets                                     |
| `packages/client/src/widgets/renderer/WidgetRenderer.tsx` | Routes unknown types to LazyWidget                                          |
| `packages/client/src/widgets/registry.ts`                 | In-memory widget registry                                                   |
| `packages/client/src/main.tsx`                            | Exposes React/ReactDOM globals                                              |
| `packages/client/src/App.tsx`                             | Calls `loadCustomWidgets()` on boot                                         |
| `packages/client/scripts/extract-theme.js`                | Extracts `@theme inline` to `dist/theme.css`                                |
| `packages/studio-core/src/tools.ts`                       | Studio `build_widgets` tool (calls `buildWidgets` from `@rangka/cli/build`) |
| `packages/studio-core/src/runtime-manager.ts`             | `registerRangkaStatic()` for late static route                              |
