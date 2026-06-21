# Custom Widget Build and Runtime Loading

> **Status: Partially implemented**
>
> Scanning and JS bundling work. CSS generation and runtime loading in the client are not yet implemented.

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

Custom widgets live in a module's `widgets/` directory:

```
modules/
  sales/
    widgets/
      pipeline-board.tsx
      analytics-dashboard.tsx
      deal-summary.tsx
```

Each `.tsx` file exports a single widget definition as the default export.

## 2. Widget authoring API

Widget authors use `defineWidget()` and `registerWidget()` from `rangka`:

```tsx
import { defineWidget, registerWidget } from 'rangka';

const meta = defineWidget({
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
});

registerWidget(meta, ({ props, on }) => {
  return (
    <div className="flex flex-col gap-4 bg-card rounded-lg p-4">
      <h2 className="text-sm font-medium text-muted-foreground">Pipeline</h2>
      {/* widget implementation */}
    </div>
  );
});
```

### Available imports from `@rangka/client`

Widget authors can import framework hooks and utilities:

| Export             | Purpose                                      |
| ------------------ | -------------------------------------------- |
| `usePageState`     | Read/write `$state`                          |
| `useAction`        | Fire actions programmatically                |
| `useShell`         | Shell API (toast, confirm, setTitle)         |
| `useWidgetContext` | Current context (record, model, mode, index) |

These are externalized at build time. The widget chunk imports them from the host at runtime.

## 3. Build pipeline

### 3.1 Scanning (implemented)

The CLI scans for custom widgets using `scanCustomUI()` in `packages/cli/src/ui-scanner.ts`.

Discovery rules:

- Scan `modules/*/widgets/`
- Include `.tsx` and `.ts` files
- Registry key derived from module name + file basename in kebab-case: `sales.pipeline-board`

### 3.2 JS bundling (implemented)

Each widget is bundled independently with esbuild:

```typescript
await esbuild.build({
  entryPoints: [component.filePath],
  outfile: path.join(outDir, 'widgets', `${filename}.js`),
  bundle: true,
  format: 'esm',
  target: 'es2022',
  platform: 'browser',
  external: ['react', 'react-dom', '@rangka/client'],
  minify: true,
});
```

| Option     | Value                            | Reason                                                     |
| ---------- | -------------------------------- | ---------------------------------------------------------- |
| `format`   | `esm`                            | Dynamic `import()` requires ES modules                     |
| `platform` | `browser`                        | Widget runs in the browser                                 |
| `target`   | `es2022`                         | Top-level await, private fields available                  |
| `external` | react, react-dom, @rangka/client | Provided by the host shell at runtime                      |
| `bundle`   | true                             | Third-party deps (chart libs, etc.) bundled into the chunk |
| `minify`   | true                             | Reduce chunk size                                          |

### 3.3 CSS generation (not implemented)

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
- `hostThemeBlock` is the `@theme inline { ... }` content extracted from the client shell's `index.css`. This registers the semantic token names so Tailwind recognizes `bg-primary`, `text-muted-foreground`, etc.
- Output contains only the utilities used by that widget.
- All color references use `var()`. No hardcoded values. Theme overrides propagate automatically.

### 3.4 Host theme extraction (not implemented)

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
  widgets/
    sales--pipeline-board.a1b2c3.js
    sales--pipeline-board.a1b2c3.css
    sales--analytics-dashboard.d4e5f6.js
    sales--analytics-dashboard.d4e5f6.css
  manifest.json
```

### 3.6 Manifest format

```json
{
  "sales.pipeline-board": {
    "js": "/_rangka/widgets/sales--pipeline-board.a1b2c3.js",
    "css": "/_rangka/widgets/sales--pipeline-board.a1b2c3.css"
  },
  "sales.analytics-dashboard": {
    "js": "/_rangka/widgets/sales--analytics-dashboard.d4e5f6.js",
    "css": "/_rangka/widgets/sales--analytics-dashboard.d4e5f6.css"
  }
}
```

The current implementation uses a flat `{ key: path }` format. When CSS generation is added, the format changes to `{ key: { js, css } }`.

### 3.7 Backwards compatibility

The client loader handles both manifest formats:

```typescript
type ManifestEntry = string | { js: string; css: string };
```

If the entry is a string, it's treated as JS-only (current format, no CSS injection).

## 4. Serving (implemented)

The `rangka start` command serves the `.rangka/` directory at the `/_rangka/` URL prefix.

Static file serving with appropriate headers:

| File type       | Content-Type             | Cache-Control                         |
| --------------- | ------------------------ | ------------------------------------- |
| `.js`           | `application/javascript` | `public, max-age=31536000, immutable` |
| `.css`          | `text/css`               | `public, max-age=31536000, immutable` |
| `manifest.json` | `application/json`       | `no-cache`                            |

JS and CSS files use content hashes in filenames, so they can be cached indefinitely. The manifest is never cached because it changes on rebuild.

## 5. Runtime loading in the client shell (not implemented)

### 5.1 Boot phase

The `/api/meta/boot` response includes a `customWidgets` field pointing to the manifest:

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
packages/client/src/widgets/loader.ts
```

```typescript
type ManifestEntry = string | { js: string; css: string };
type Manifest = Record<string, ManifestEntry>;

const loaded = new Set<string>();

export async function loadCustomWidgets(manifestUrl: string): Promise<void> {
  const res = await fetch(manifestUrl);
  const manifest: Manifest = await res.json();

  await Promise.all(
    Object.entries(manifest).map(([key, raw]) => {
      const entry = typeof raw === 'string' ? { js: raw, css: '' } : raw;
      return loadWidget(key, entry);
    }),
  );
}

async function loadWidget(key: string, entry: { js: string; css: string }): Promise<void> {
  if (loaded.has(key)) return;

  if (entry.css) {
    await injectCSS(entry.css);
  }

  const mod = await import(/* @vite-ignore */ entry.js);
  loaded.add(key);
}

function injectCSS(href: string): Promise<void> {
  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
}
```

### 5.3 Lazy loading (on-demand)

Not all custom widgets need to load at boot. The shell can load widgets lazily when first rendered:

```typescript
export async function ensureWidget(name: string): Promise<boolean> {
  if (getWidget(name)) return true;

  const entry = manifestCache?.get(name);
  if (!entry) return false;

  await loadWidget(name, typeof entry === 'string' ? { js: entry, css: '' } : entry);
  return getWidget(name) !== undefined;
}
```

### 5.4 Integration with WidgetRenderer

The `WidgetRenderer` currently returns an error div for unknown widgets. With lazy loading, it attempts to load the widget first:

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

## 6. External module resolution (not implemented)

Custom widgets declare `react`, `react-dom`, and `@rangka/client` as external. At runtime, the browser needs to resolve these imports.

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

## 7. Error handling (not implemented)

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

Widget loading has a timeout (default: 10 seconds). If a widget takes longer, it's marked as failed.

## 8. Studio integration (not implemented)

### `build_widgets` tool

The Studio agent gets a `build_widgets` tool that compiles custom widgets in-process. This lets the agent write a widget file, build it, and reload the preview in a single workflow.

The build logic lives directly in `studio-core` (not imported from `@rangka/cli`) to avoid a circular dependency. Both the CLI command and the studio tool use the same algorithm, but each has its own copy since the logic is ~40 lines.

```typescript
// packages/studio-core/src/tools.ts — new tool
{
  name: 'build_widgets',
  label: 'Build Widgets',
  description:
    'Compile custom widgets in modules/*/widgets/ into browser-ready bundles. ' +
    'Call this after writing or modifying widget files. ' +
    'Outputs bundles and manifest to .rangka/, then signals preview reload.',
  parameters: Type.Object({}),
  execute: async () => {
    const root = runtime.getProjectRoot();
    const result = await buildWidgets(root);

    if (!result.success) {
      return {
        content: [{ type: 'text' as const, text: `Build failed: ${result.error}` }],
        details: { success: false, error: result.error },
      };
    }

    if (result.count === 0) {
      return {
        content: [{ type: 'text' as const, text: 'No custom widgets found.' }],
        details: { success: true, count: 0 },
      };
    }

    return {
      content: [{
        type: 'text' as const,
        text: `Built ${result.count} widget(s). Manifest written to .rangka/manifest.json.`,
      }],
      details: { success: true, count: result.count, reload: true },
    };
  },
}
```

### `buildWidgets()` function

A standalone async function in `studio-core` that mirrors the CLI build logic:

```typescript
// packages/studio-core/src/build-widgets.ts
import * as esbuild from 'esbuild';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

interface BuildResult {
  success: boolean;
  count: number;
  error?: string;
}

export async function buildWidgets(root: string): Promise<BuildResult> {
  try {
    const components = await scanWidgets(root);
    if (components.length === 0) return { success: true, count: 0 };

    const outDir = path.join(root, '.rangka');
    await fs.rm(outDir, { recursive: true, force: true });
    await fs.mkdir(path.join(outDir, 'widgets'), { recursive: true });

    const manifest: Record<string, string> = {};

    for (const comp of components) {
      const hash = createHash(comp.filePath);
      const filename = `${comp.module}--${comp.basename}.${hash}.js`;
      const outputPath = path.join(outDir, 'widgets', filename);

      await esbuild.build({
        entryPoints: [comp.filePath],
        outfile: outputPath,
        bundle: true,
        format: 'esm',
        platform: 'browser',
        target: 'es2022',
        external: ['react', 'react-dom', '@rangka/client'],
      });

      manifest[comp.key] = `/_rangka/widgets/${filename}`;
    }

    await fs.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

    return { success: true, count: components.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, count: 0, error: message };
  }
}
```

### Agent workflow

The agent's typical flow for creating a custom widget:

1. Call `lookup_reference` with topic `define-widget`
2. Write the widget `.tsx` file to `modules/<mod>/widgets/`
3. Call `build_widgets` to compile it
4. Call `apply_changes` to rescan definitions (registers the widget metadata)
5. Call `reload_preview` to refresh the UI

Steps 3-5 happen in sequence. The tool returns `reload: true` in details, which the `AgentEngine` intercepts (same pattern as `apply_changes`) to broadcast a `preview.reload` message to connected clients.

### Static serving

The `RuntimeManager` already registers `/_rangka/` as a static route at boot (line 146-153 in `runtime-manager.ts`). After `build_widgets` writes new files to `.rangka/`, they are immediately servable without restarting the server. Fastify's `@fastify/static` serves from disk on each request.

If `.rangka/` did not exist at boot, the static route is not registered. The `build_widgets` tool must handle this by registering the route after the first build:

```typescript
// In RuntimeManager
async registerRangkaStatic(): Promise<void> {
  const rangkaDir = path.join(this.config.projectRoot, '.rangka');
  if (!this.rangkaStaticRegistered && this.bootResult?.server) {
    await this.bootResult.server.register(fastifyStatic, {
      root: rangkaDir,
      prefix: '/_rangka/',
      decorateReply: false,
    });
    this.rangkaStaticRegistered = true;
  }
}
```

## 9. Implementation checklist

### Done

- [x] `defineWidget()` in `@rangka/shared`
- [x] `registerWidget()` in `@rangka/client` (internal registry)
- [x] CLI scanner (`ui-scanner.ts`) discovers `modules/*/widgets/`
- [x] CLI `rangka build` bundles widgets with esbuild
- [x] CLI `rangka start` serves `.rangka/` at `/_rangka/`
- [x] Flat manifest generation (`key: path`)

### To implement

- [ ] CSS generation (PostCSS + Tailwind pass per widget)
- [ ] Host theme extraction from client shell
- [ ] Manifest format upgrade to `{ key: { js, css } }`
- [ ] `customWidgets` field in `BootPayload`
- [ ] Widget loader in client (`loader.ts`)
- [ ] `LazyWidget` component with loading/error states
- [ ] Error boundary wrapper for custom widgets
- [ ] Import map in shell `index.html`
- [ ] Vendor chunk builds (react, react-dom, @rangka/client)
- [ ] `minify: true` in esbuild config (currently missing)
- [ ] Load timeout handling
- [ ] Studio `build_widgets` tool
- [ ] `buildWidgets()` function in studio-core
- [ ] `RuntimeManager.registerRangkaStatic()` for late registration

### New dependencies

| Package                | Version | Target                                         |
| ---------------------- | ------- | ---------------------------------------------- |
| `postcss`              | ^8.x    | `@rangka/cli`                                  |
| `@tailwindcss/postcss` | ^4.x    | `@rangka/cli`                                  |
| `esbuild`              | ^0.25.x | `@rangka/studio-core` (if not already present) |

### Files to create

| Path                                         | Purpose                                          |
| -------------------------------------------- | ------------------------------------------------ |
| `packages/client/src/widgets/loader.ts`      | Manifest fetcher, CSS injector, dynamic importer |
| `packages/client/src/widgets/LazyWidget.tsx` | On-demand loading wrapper                        |
| `packages/client/src/widgets/SafeWidget.tsx` | Error boundary isolation                         |
| `packages/studio-core/src/build-widgets.ts`  | Standalone build function for studio tool        |

### Files to modify

| Path                                                      | Change                                      |
| --------------------------------------------------------- | ------------------------------------------- |
| `packages/client/src/widgets/renderer/WidgetRenderer.tsx` | Add lazy loading fallback for unknown types |
| `packages/client/src/boot/useBoot.ts`                     | Pass manifest URL from boot response        |
| `packages/cli/src/commands/build.ts`                      | Add PostCSS + Tailwind CSS generation step  |
| `packages/cli/package.json`                               | Add postcss and @tailwindcss/postcss deps   |
| `packages/shared/src/types/boot.ts`                       | Add `customWidgets` to BootPayload          |
| `packages/studio-core/src/tools.ts`                       | Add `build_widgets` tool                    |
| `packages/studio-core/src/runtime-manager.ts`             | Add `registerRangkaStatic()` method         |
| `packages/studio-core/package.json`                       | Add esbuild dependency                      |
