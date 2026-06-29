---
status: stable
since: 0.2.0
last-updated: 2026-06-21
description: How the custom widget build pipeline and runtime loader work
---

# Custom Widget Build System

How custom widgets are compiled, served, and loaded at runtime. Read this if you work on `@rangka/cli`, `@rangka/client`, or `@rangka/studio-core`.

## Overview

App developers write custom widgets as React components in `apps/<module>/widgets/`. The framework compiles each widget into a standalone ES module bundle with scoped CSS. It serves them as static files and loads them on demand via dynamic `import()`.

Three stages: build, serve, load.

## Build pipeline

The build logic lives in `packages/cli/src/build-widgets.ts`. It exports `buildWidgets(root)`. Both the CLI `rangka build` command and the studio `build_widgets` tool call this function.

### Widget discovery

The scanner (`packages/cli/src/ui-scanner.ts`) finds widgets by convention:

```
apps/*/widgets/*.tsx
apps/*/widgets/*.ts
```

Each file produces a registry key in the format `<app>.<kebab-name>`. Example: `widgets/PipelineBoard.tsx` becomes `sales.pipeline-board`.

### JS bundling

Each widget is bundled independently with esbuild.

| Option      | Value        | Reason                                  |
| ----------- | ------------ | --------------------------------------- |
| `format`    | `esm`        | Dynamic `import()` requires ES modules  |
| `platform`  | `browser`    | Widget runs in the browser              |
| `target`    | `es2022`     | Modern syntax support                   |
| `bundle`    | `true`       | Third-party npm packages are bundled in |
| `jsx`       | `transform`  | Outputs `React.createElement` calls     |
| `nodePaths` | project root | Helps esbuild find deps in pnpm setups  |

A banner injects `var React = window.__rangka_React;` at the top of every bundle. This makes JSX calls resolve to the shell's React instance.

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
2. Process a virtual input that imports `tailwindcss/utilities` and `tailwindcss/theme` with `source(none)` and `@source` pointing at the widget file
3. Strip `@layer base` and shell semantic token definitions from the output
4. Keep Tailwind default palette variables (only those the widget actually uses)

The result is a CSS file containing only the utility classes the widget references. Color variables are defined locally. It does not override the shell's theme.

If esbuild also produces CSS (from `.css` file imports like `@xyflow/react/dist/style.css`), the two are merged into a single output file.

### Theme extraction

The shell's `@theme inline` block defines semantic tokens (`--color-primary`, `--color-card`, etc.) that Tailwind needs to resolve classes like `bg-primary`. This block is extracted during the `@rangka/client` build:

- `packages/client/scripts/extract-theme.js` runs after the Vite build
- It reads `src/index.css` and extracts the `@theme inline { ... }` block
- It writes the result to `dist/theme.css`

The CLI reads `dist/theme.css` at build time via `resolveShellDir()`.

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
│   ├── <app>--<name>.<hash>.js
│   └── <app>--<name>.<hash>.css   (if the widget has styles)
└── manifest.json
```

## Serving

`rangka start` registers `.rangka/` as a static directory at `/_rangka/` using `@fastify/static`. JS and CSS files use content hashes in filenames for indefinite caching. The manifest is fetched fresh on each page load.

In studio mode, `RuntimeManager.registerRangkaStatic()` handles late registration when `.rangka/` is created after the server boots.

## Runtime loading

The loader lives in `packages/client/src/widgets/loader.ts`.

### Boot phase

When the app reaches the `ready` state, `App.tsx` calls `loadCustomWidgets()`. This fetches `/_rangka/manifest.json` and caches it in memory. If no custom widgets exist, the fetch fails silently.

### Lazy loading

When `WidgetRenderer` encounters an unknown widget type, it renders a `LazyWidget` component:

1. `LazyWidget` calls `ensureWidget(name)`
2. `ensureWidget` checks the manifest cache for the widget key
3. If found, it injects the CSS (via a `<link>` element) and dynamically imports the JS bundle
4. The imported module's default export (`{ meta, component }`) is registered in the widget registry
5. `LazyWidget` re-renders with the loaded component

A pulsing placeholder shows while loading. An error placeholder renders on failure. The rest of the page continues working regardless.

### Widget app contract

Custom widgets export a default object:

```typescript
export default { meta, component };
```

`meta` is a `WidgetDefinitionMeta` (from `defineWidget()`). `component` is a React component that receives `WidgetComponentProps`.

## React global injection

The shell exposes React and ReactDOM on `window` in `packages/client/src/main.tsx`:

```typescript
(window as any).__rangka_React = React;
(window as any).__rangka_ReactDOM = ReactDOM;
```

The esbuild banner and global externals plugin ensure widget bundles reference these globals. This guarantees:

- A single React instance (hooks work across shell and widget boundaries)
- `react-dom` features like `createPortal` use the shell's DOM reconciler

## Key files

| Path                                                      | Responsibility                                           |
| --------------------------------------------------------- | -------------------------------------------------------- |
| `packages/cli/src/build-widgets.ts`                       | Core build function, esbuild config, Tailwind generation |
| `packages/cli/src/ui-scanner.ts`                          | Widget file discovery                                    |
| `packages/cli/src/resolve-client.ts`                      | Resolves `@rangka/client/dist/shell` path                |
| `packages/cli/src/commands/build.ts`                      | CLI command wrapper                                      |
| `packages/client/src/widgets/loader.ts`                   | Manifest fetch, dynamic import, CSS injection            |
| `packages/client/src/widgets/renderer/LazyWidget.tsx`     | Loading/error state for unknown widgets                  |
| `packages/client/src/widgets/renderer/WidgetRenderer.tsx` | Routes unknown types to LazyWidget                       |
| `packages/client/src/widgets/registry.ts`                 | In-memory widget registry                                |
| `packages/client/src/main.tsx`                            | Exposes React/ReactDOM globals                           |
| `packages/client/src/App.tsx`                             | Calls `loadCustomWidgets()` on boot                      |
| `packages/client/scripts/extract-theme.js`                | Extracts `@theme inline` to `dist/theme.css`             |
| `packages/studio-core/src/tools.ts`                       | Studio `build_widgets` tool                              |
| `packages/studio-core/src/runtime-manager.ts`             | `registerRangkaStatic()` for late static route           |
