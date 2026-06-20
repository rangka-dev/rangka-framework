# Custom Widget Build and Runtime Loading

> **Status: To be implemented**

## Overview

Custom widgets are user-authored React components that extend the shell's built-in widget set. They are discovered at build time, bundled into standalone ES modules with companion CSS, and loaded on demand at runtime via dynamic `import()`.

This spec covers the full lifecycle: scanning, bundling, serving, loading, and registering custom widgets in the client shell.

## Goals

- Widget authors write standard React + Tailwind code with no special build setup
- Custom widgets participate in theming automatically (via CSS variable cascade)
- Widgets load on demand (not bundled into the shell)
- The shell remains functional if a custom widget fails to load
- Zero runtime CSS engine. All styles generated at build time.

## 1. Project structure

Custom widgets live in a module's `widgets/` directory, organized by type:

```
modules/
  sales/
    widgets/
      views/
        pipeline-board.tsx
        analytics-dashboard.tsx
      fields/
        color-picker.tsx
        rich-editor.tsx
      cards/
        deal-summary.tsx
```

Each `.tsx` file exports a single widget definition as the default export.

## 2. Widget authoring API

Widget authors use `defineWidget()` from the `@rangka/client` package:

```tsx
import { defineWidget } from '@rangka/client';

export default defineWidget({
  name: 'sales.pipeline-board',
  label: 'Pipeline Board',
  category: 'display',
  schema: {
    groupField: { type: 'string', required: true },
    showLabels: { type: 'boolean', default: true },
  },
  binding: 'none',
  triggers: ['dealSelect'],
  container: false,
  component: ({ props, on }) => {
    return (
      <div className="flex flex-col gap-4 bg-card rounded-lg p-4">
        <h2 className="text-sm font-medium text-muted-foreground">Pipeline</h2>
        {/* widget implementation */}
      </div>
    );
  },
});
```

### `defineWidget()` return type

```typescript
interface WidgetDefinition {
  meta: WidgetDefinitionMeta;
  component: ComponentType<WidgetProps>;
}
```

The function separates the metadata from the component, producing a shape that the registry can consume directly.

### Available imports from `@rangka/client`

Widget authors can import framework hooks and utilities:

| Export             | Purpose                                      |
| ------------------ | -------------------------------------------- |
| `defineWidget`     | Widget definition factory                    |
| `usePageState`     | Read/write `$state`                          |
| `useAction`        | Fire actions programmatically                |
| `useShell`         | Shell API (toast, confirm, setTitle)         |
| `useWidgetContext` | Current context (record, model, mode, index) |

These are externalized at build time. The widget chunk imports them from the host at runtime.

## 3. Build pipeline

### 3.1 Scanning

The CLI scans for custom widgets using the existing `scanCustomUI()` function in `packages/cli/src/ui-scanner.ts`.

Discovery rules:

- Scan `modules/*/widgets/views/`, `modules/*/widgets/fields/`, `modules/*/widgets/cards/`
- Include `.tsx` and `.ts` files
- Registry key derived from module name + file basename: `sales.pipeline-board`
- Type derived from parent directory: `views/` → view, `fields/` → field, `cards/` → card

### 3.2 JS bundling (esbuild)

Each widget is bundled independently with esbuild:

```typescript
await esbuild.build({
  entryPoints: [component.filePath],
  outfile: path.join(outDir, typeDir, `${filename}.js`),
  bundle: true,
  format: 'esm',
  target: 'es2022',
  platform: 'browser',
  external: ['react', 'react-dom', '@rangka/client'],
  minify: true,
});
```

Configuration details:

| Option     | Value                            | Reason                                                     |
| ---------- | -------------------------------- | ---------------------------------------------------------- |
| `format`   | `esm`                            | Dynamic `import()` requires ES modules                     |
| `platform` | `browser`                        | Widget runs in the browser                                 |
| `target`   | `es2022`                         | Top-level await, private fields available                  |
| `external` | react, react-dom, @rangka/client | Provided by the host shell at runtime                      |
| `bundle`   | true                             | Third-party deps (chart libs, etc.) bundled into the chunk |
| `minify`   | true                             | Reduce chunk size                                          |

### 3.3 CSS generation (PostCSS + Tailwind)

After JS bundling, a Tailwind pass generates the widget's CSS:

```typescript
import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';

const hostThemeBlock = extractThemeInlineBlock(hostIndexCssPath);

const inputCSS = [
  '@import "tailwindcss" source(none);',
  `@source "${component.filePath}";`,
  hostThemeBlock,
].join('\n');

const result = await postcss([tailwindcss()]).process(inputCSS, { from: component.filePath });

await fs.writeFile(cssOutputPath, result.css);
```

Key mechanics:

- `source(none)` disables auto-detection. Only the widget file is scanned for class names.
- `@source` points to the single widget source file.
- `hostThemeBlock` is the `@theme inline { ... }` content extracted from the client's `index.css`. This registers the semantic token names so Tailwind recognizes `bg-primary`, `text-muted-foreground`, etc.
- Output contains only the utilities used by that widget.
- All color references use `var()`. No hardcoded values. Theme overrides propagate automatically.

### 3.4 Host theme extraction

At the start of `rangka build`, the CLI reads the client shell's `index.css` and extracts the `@theme inline` block:

```typescript
function extractThemeInlineBlock(indexCssPath: string): string {
  const content = fs.readFileSync(indexCssPath, 'utf-8');
  const match = content.match(/@theme inline \{[\s\S]*?\n\}/);
  return match ? match[0] : '';
}
```

This block is reused for every widget in the build. It defines the mapping from Tailwind utility names to CSS variables without embedding actual color values.

### 3.5 Output structure

```
.rangka/
  views/
    sales--pipeline-board.a1b2c3.js
    sales--pipeline-board.a1b2c3.css
    sales--analytics-dashboard.d4e5f6.js
    sales--analytics-dashboard.d4e5f6.css
  fields/
    sales--color-picker.g7h8i9.js
    sales--color-picker.g7h8i9.css
  cards/
    sales--deal-summary.j0k1l2.js
    sales--deal-summary.j0k1l2.css
  manifest.json
```

### 3.6 Manifest format

```json
{
  "views": {
    "sales.pipeline-board": {
      "js": "/_rangka/views/sales--pipeline-board.a1b2c3.js",
      "css": "/_rangka/views/sales--pipeline-board.a1b2c3.css"
    }
  },
  "fields": {
    "sales.color-picker": {
      "js": "/_rangka/fields/sales--color-picker.g7h8i9.js",
      "css": "/_rangka/fields/sales--color-picker.g7h8i9.css"
    }
  },
  "cards": {
    "sales.deal-summary": {
      "js": "/_rangka/cards/sales--deal-summary.j0k1l2.js",
      "css": "/_rangka/cards/sales--deal-summary.j0k1l2.css"
    }
  }
}
```

### 3.7 Backwards compatibility

The manifest format changes from string values to objects. The client loader handles both:

```typescript
type ManifestEntry = string | { js: string; css: string };
```

If the entry is a string, it's treated as JS-only (legacy format, no CSS injection).

## 4. Serving

The `rangka start` command serves the `.rangka/` directory at the `/_rangka/` URL prefix. This is already implemented in `packages/cli/src/commands/start.ts`.

Static file serving with appropriate headers:

| File type       | Content-Type             | Cache-Control                         |
| --------------- | ------------------------ | ------------------------------------- |
| `.js`           | `application/javascript` | `public, max-age=31536000, immutable` |
| `.css`          | `text/css`               | `public, max-age=31536000, immutable` |
| `manifest.json` | `application/json`       | `no-cache`                            |

JS and CSS files use content hashes in filenames, so they can be cached indefinitely. The manifest is never cached because it changes on rebuild.

## 5. Runtime loading in the client shell

### 5.1 Boot phase

The `/api/meta/boot` response includes widget metadata for all registered widgets (both built-in and custom). The response includes a `customWidgets` field pointing to the manifest:

```typescript
interface BootResponse {
  // ... existing fields
  widgets: WidgetDefinitionMeta[];
  customWidgets?: {
    manifest: string; // URL path to manifest.json
  };
}
```

### 5.2 Widget loader module

A new module in the client handles loading custom widgets:

```
src/widgets/loader.ts
```

```typescript
interface ManifestEntry {
  js: string;
  css: string;
}

type Manifest = Record<string, Record<string, ManifestEntry | string>>;

const loaded = new Set<string>();
const loading = new Map<string, Promise<WidgetDefinition | null>>();

export async function loadCustomWidgets(manifestUrl: string): Promise<void> {
  const res = await fetch(manifestUrl);
  const manifest: Manifest = await res.json();

  const entries: Array<{ key: string; entry: ManifestEntry }> = [];

  for (const typeGroup of Object.values(manifest)) {
    for (const [key, raw] of Object.entries(typeGroup)) {
      const entry = typeof raw === 'string' ? { js: raw, css: '' } : raw;
      entries.push({ key, entry });
    }
  }

  await Promise.all(entries.map(({ key, entry }) => loadWidget(key, entry)));
}

async function loadWidget(key: string, entry: ManifestEntry): Promise<void> {
  if (loaded.has(key)) return;

  if (entry.css) {
    await injectCSS(entry.css);
  }

  const mod = await import(/* @vite-ignore */ entry.js);
  const definition: WidgetDefinition = mod.default;

  registerWidget(definition.meta, definition.component);
  loaded.add(key);
}

function injectCSS(href: string): Promise<void> {
  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => resolve(); // Don't block on CSS failure
    document.head.appendChild(link);
  });
}
```

### 5.3 Lazy loading (on-demand)

Not all custom widgets need to load at boot. Only widgets referenced by the current page tree need to be loaded. The shell can load widgets lazily:

```typescript
export async function ensureWidget(name: string): Promise<boolean> {
  if (getWidget(name)) return true;

  const pending = loading.get(name);
  if (pending) {
    await pending;
    return getWidget(name) !== undefined;
  }

  // Widget not in registry and not loading — it may be a custom widget
  // that hasn't been loaded yet. Check manifest.
  const entry = manifestCache?.findEntry(name);
  if (!entry) return false;

  await loadWidget(name, entry);
  return true;
}
```

### 5.4 Integration with WidgetRenderer

The `WidgetRenderer` currently returns an error div for unknown widgets. With lazy loading, it should attempt to load the widget first:

```typescript
// In WidgetRenderer
const widgetEntry = getWidget(node.type);

if (!widgetEntry) {
  // Attempt lazy load
  return <LazyWidget name={node.type} fallback={<WidgetSkeleton />} {...rendererProps} />;
}
```

`LazyWidget` is a wrapper that:

1. Calls `ensureWidget(name)` on mount
2. Shows a skeleton/loading state while loading
3. Renders the widget once loaded
4. Shows an error state if loading fails

```typescript
function LazyWidget({ name, fallback, ...props }: LazyWidgetProps) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    ensureWidget(name).then((ok) => {
      setState(ok ? 'ready' : 'error');
    });
  }, [name]);

  if (state === 'loading') return fallback;
  if (state === 'error') return <div data-widget-error={`Failed to load: ${name}`} />;

  const entry = getWidget(name)!;
  return <entry.component {...props} />;
}
```

### 5.5 Loading strategy

Two loading strategies, configurable per app:

| Strategy         | When widgets load                                      | Trade-off                                      |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------- |
| `eager`          | All custom widgets loaded at boot, before first render | Slower boot, no loading states on pages        |
| `lazy` (default) | Widgets loaded on demand when first rendered           | Faster boot, brief skeleton on first encounter |

Boot-time eager loading:

```typescript
// In App.tsx, after boot response received
if (bootData.customWidgets?.manifest) {
  await loadCustomWidgets(bootData.customWidgets.manifest);
}
```

Lazy loading happens automatically via `LazyWidget` in the renderer.

## 6. External module resolution

Custom widgets declare `react`, `react-dom`, and `@rangka/client` as external. At runtime, the browser needs to resolve these imports. Two approaches:

### Option A: Import map (recommended)

The shell injects an import map in `index.html` at build time:

```html
<script type="importmap">
  {
    "imports": {
      "react": "/_shell/vendor/react.js",
      "react-dom": "/_shell/vendor/react-dom.js",
      "@rangka/client": "/_shell/vendor/rangka-client.js"
    }
  }
</script>
```

These vendor chunks are pre-built from the shell's own dependencies. Custom widget `import 'react'` statements resolve to the shared instance.

### Option B: Global assignment fallback

For environments that don't support import maps, the shell assigns externals to globals and esbuild uses `globalName`:

```typescript
// In shell's entry point
window.__rangka_externals = { React, ReactDOM, RangkaClient };

// esbuild config for widgets
external: ['react', 'react-dom', '@rangka/client'],
banner: {
  js: 'const {React, ReactDOM, RangkaClient} = window.__rangka_externals;'
}
```

Import maps are preferred (better DX, standard mechanism). The global fallback exists for older browsers.

## 7. Error handling

Custom widgets are untrusted code. The shell protects itself:

### Load failures

- Network error fetching JS/CSS: widget shows error state, rest of page renders normally
- JS parse error: caught by the dynamic `import()` promise rejection
- CSS load error: silently ignored (widget renders unstyled rather than not at all)

### Runtime errors

Each custom widget is wrapped in a React error boundary:

```typescript
function SafeWidget({ component: Component, ...props }: SafeWidgetProps) {
  return (
    <ErrorBoundary fallback={<WidgetErrorFallback name={props.name} />}>
      <Component {...props} />
    </ErrorBoundary>
  );
}
```

If a custom widget throws during render, the error boundary catches it and shows a fallback. The rest of the page continues working.

### Timeout

Widget loading has a timeout (default: 10 seconds). If a widget takes longer than this to load, it's marked as failed:

```typescript
const LOAD_TIMEOUT = 10_000;

async function loadWithTimeout(name: string, entry: ManifestEntry): Promise<void> {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Widget ${name} load timeout`)), LOAD_TIMEOUT),
  );
  await Promise.race([loadWidget(name, entry), timeout]);
}
```

## 8. Development workflow

### With `rangka dev`

In development mode, the build watches for file changes:

1. File watcher detects change in `modules/*/widgets/`
2. Incremental rebuild: only the changed widget is re-bundled (JS + CSS)
3. Manifest is regenerated
4. Dev server sends HMR signal or full page reload to the client
5. Widget re-loads with updated code

### With Studio

Studio's Runtime Manager orchestrates the same flow:

1. Agent writes widget file
2. Runtime Manager triggers `rangka build`
3. On success, sends `preview.reload` via WebSocket
4. Preview iframe reloads, widget loads from updated manifest

### Without build step (development convenience)

For rapid iteration, a future enhancement could skip the full build and serve widgets through Vite's transform pipeline. This is out of scope for the initial implementation.

## 9. Security considerations

Custom widgets run in the same origin as the shell. They have access to:

- The DOM
- The shell's React tree (via hooks)
- `localStorage` / `sessionStorage`
- Network (fetch, WebSocket)
- The auth token (if accessible via cookie or memory)

This is acceptable for the local/self-hosted use case (app developers trust their own code). For the Platform (hosted multi-tenant), custom widgets need sandboxing. This is out of scope for this spec.

Mitigations for the local case:

- Widgets cannot modify the registry (registerWidget is not exported to widget code)
- Error boundaries prevent one widget from crashing the shell
- CSP headers can restrict widget network access if configured

## 10. Dependencies

New packages for `@rangka/cli`:

| Package                | Version | Purpose                        |
| ---------------------- | ------- | ------------------------------ |
| `postcss`              | ^8.x    | PostCSS processor API          |
| `@tailwindcss/postcss` | ^4.x    | Tailwind v4 plugin for PostCSS |

No new dependencies for `@rangka/client`. The loader uses native `import()` and DOM APIs.

## 11. Files to create or modify

### New files

| Path                                            | Purpose                                                 |
| ----------------------------------------------- | ------------------------------------------------------- |
| `packages/client/src/widgets/loader.ts`         | Widget manifest fetcher, CSS injector, dynamic importer |
| `packages/client/src/widgets/LazyWidget.tsx`    | Suspense-like wrapper for on-demand loading             |
| `packages/client/src/widgets/ErrorBoundary.tsx` | Error boundary for custom widget isolation              |
| `packages/client/src/defineWidget.ts`           | `defineWidget()` factory (exported from package)        |

### Modified files

| Path                                                      | Change                                                    |
| --------------------------------------------------------- | --------------------------------------------------------- |
| `packages/client/src/index.ts`                            | Export `defineWidget` and hooks for widget authors        |
| `packages/client/src/widgets/renderer/WidgetRenderer.tsx` | Add lazy loading fallback for unknown widgets             |
| `packages/client/src/App.tsx`                             | Load custom widgets after boot                            |
| `packages/client/src/boot/useBoot.ts`                     | Pass manifest URL from boot response                      |
| `packages/cli/src/commands/build.ts`                      | Add PostCSS + Tailwind CSS generation step                |
| `packages/cli/src/commands/start.ts`                      | Serve `.css` files from `.rangka/` (already serves `.js`) |
| `packages/cli/package.json`                               | Add postcss and @tailwindcss/postcss deps                 |
| `packages/shared/src/types/widget.ts`                     | Add `customWidgets` to BootResponse type                  |

## 12. Testing strategy

### Unit tests

- `loader.ts`: mock fetch + import, verify registry population
- `LazyWidget.tsx`: render with mock registry, verify loading/ready/error states
- `ErrorBoundary.tsx`: verify fallback renders on child throw
- `extractThemeInlineBlock`: verify regex extraction from sample CSS

### Integration tests

- Full build pipeline: write a test widget `.tsx`, run build, verify `.js` and `.css` output
- CSS content: verify output contains expected utilities and `var()` references
- Manifest format: verify structure matches schema
- Runtime loading: boot app with custom widget in page definition, verify it renders

### Manual testing

- Custom widget with Tailwind classes renders correctly
- Theme override propagates to custom widget
- Widget load failure shows error state without crashing page
- Hot reload works in dev mode
