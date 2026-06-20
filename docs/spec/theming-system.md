# Theming System

> **Status: To be implemented**

## Overview

The theming system allows app owners to define a custom color scheme that replaces the framework's default palette. It covers two concerns:

1. **Runtime theme overrides** — user-defined colors applied at boot via CSS variable injection
2. **Custom widget CSS** — Tailwind utility generation for custom widgets so they participate in the theme

Both concerns are solved through the CSS custom property cascade. The host owns the design tokens. Custom widgets consume them. Theme overrides propagate automatically.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  index.css                                                   │
│  @theme inline { --color-primary: var(--primary); ... }      │
│  :root { --primary: oklch(0.5 0.134 242); ... }              │
│  .dark { --primary: oklch(0.443 0.11 240); ... }             │
└─────────────────────────────────────────────────────────────┘
        ↓ (cascade)
┌─────────────────────────────────────────────────────────────┐
│  <style id="rangka-theme">                                   │
│  :root { --primary: oklch(0.6 0.2 260); ... }                │
│  .dark { --primary: oklch(0.5 0.15 260); ... }               │
│  (injected at boot from server response)                     │
└─────────────────────────────────────────────────────────────┘
        ↓ (consumed by)
┌───────────────────────┐  ┌───────────────────────────────┐
│  Built-in widgets     │  │  Custom widget CSS chunks      │
│  bg-primary → var()   │  │  bg-primary → var()            │
└───────────────────────┘  └───────────────────────────────┘
```

## 1. Theme configuration

### Storage format

Theme overrides are stored in the app definition. Only values the user changed are stored. Everything else falls through to `index.css` defaults.

```yaml
# In app config (YAML) or database record
theme:
  light:
    primary: 'oklch(0.6 0.2 260)'
    primary-foreground: 'oklch(0.98 0.01 260)'
    accent: 'oklch(0.6 0.2 260)'
    accent-foreground: 'oklch(0.98 0.01 260)'
    background: 'oklch(0.99 0 0)'
  dark:
    primary: 'oklch(0.5 0.15 260)'
    primary-foreground: 'oklch(0.98 0.01 260)'
```

### Available tokens

All tokens from `index.css` are overridable:

| Token                        | Purpose              |
| ---------------------------- | -------------------- |
| `primary`                    | Primary brand color  |
| `primary-foreground`         | Text on primary      |
| `secondary`                  | Secondary surfaces   |
| `secondary-foreground`       | Text on secondary    |
| `muted`                      | Muted backgrounds    |
| `muted-foreground`           | Muted text           |
| `accent`                     | Accent / highlight   |
| `accent-foreground`          | Text on accent       |
| `destructive`                | Danger / error       |
| `background`                 | Page background      |
| `foreground`                 | Default text         |
| `card`                       | Card surface         |
| `card-foreground`            | Card text            |
| `popover`                    | Popover surface      |
| `popover-foreground`         | Popover text         |
| `border`                     | Default borders      |
| `input`                      | Input borders        |
| `ring`                       | Focus rings          |
| `sidebar`                    | Sidebar background   |
| `sidebar-foreground`         | Sidebar text         |
| `sidebar-primary`            | Sidebar primary      |
| `sidebar-primary-foreground` | Sidebar primary text |
| `sidebar-accent`             | Sidebar hover state  |
| `sidebar-accent-foreground`  | Sidebar hover text   |
| `sidebar-border`             | Sidebar borders      |
| `chart-1` through `chart-5`  | Chart palette        |
| `radius`                     | Base border radius   |

## 2. Server delivery

The `/api/meta/boot` response includes the theme configuration:

```typescript
interface BootResponse {
  // ... existing fields
  theme?: {
    light?: Record<string, string>;
    dark?: Record<string, string>;
  };
}
```

Keys in the `light` and `dark` objects are CSS variable names without the `--` prefix. Values are raw CSS values (oklch strings).

## 3. Client injection

The client shell applies theme overrides during the boot phase, before the first render.

### Implementation

```typescript
function applyTheme(theme: BootResponse['theme']) {
  if (!theme) return;

  const style = document.getElementById('rangka-theme') ?? document.createElement('style');
  style.id = 'rangka-theme';

  const toVars = (vars: Record<string, string>) =>
    Object.entries(vars)
      .map(([k, v]) => `--${k}: ${v};`)
      .join('\n  ');

  const sections: string[] = [];
  if (theme.light) sections.push(`:root {\n  ${toVars(theme.light)}\n}`);
  if (theme.dark) sections.push(`.dark {\n  ${toVars(theme.dark)}\n}`);

  style.textContent = sections.join('\n');
  document.head.appendChild(style);
}
```

### Cascade order

1. `index.css` loads first (default values in `:root` and `.dark`)
2. `<style id="rangka-theme">` loads second (overrides from server)
3. Widget CSS chunks load on demand (only consume variables, never define them)

The injected style block wins over `index.css` because it appears later in the document head. No `!important` needed.

### Studio live preview

When the client shell runs inside a Studio iframe, it listens for theme updates via `postMessage`:

```typescript
if (window !== window.parent) {
  window.addEventListener('message', (e) => {
    if (e.data.type === 'rangka:theme-override') {
      applyTheme(e.data.payload);
    }
  });
}
```

This enables instant color picker feedback in Studio without requiring a full preview reload.

## 4. Custom widget CSS build

### Problem

Custom widgets are bundled separately by `rangka build` using esbuild. Their Tailwind classes are not seen by the host app's Tailwind compilation. Without intervention, widget classes like `bg-primary` or `gap-2` have no corresponding CSS rules.

### Solution

Run a PostCSS + Tailwind pass per widget during `rangka build`. This generates a scoped CSS chunk containing only the utilities that widget uses.

### Build pipeline

```
modules/sales/widgets/pipeline-board.tsx
    │
    ├── esbuild ──► .rangka/views/sales--pipeline-board.abc123.js
    │     (JSX → JS, bundles dependencies, externalizes react/@rangka/client)
    │
    └── PostCSS + Tailwind ──► .rangka/views/sales--pipeline-board.abc123.css
          (scans .tsx for class names, generates matching utility rules)
```

esbuild and PostCSS operate independently on the same source file. esbuild reads it as TypeScript. Tailwind reads it as text and extracts class name patterns.

### Implementation

```typescript
import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';

// Extract @theme inline block from host's index.css once at build start
const hostThemeBlock = extractThemeInlineBlock(hostIndexCssPath);

for (const component of components) {
  // Step 1: JS bundle (existing)
  await esbuild.build({
    entryPoints: [component.filePath],
    outfile: jsOutputPath,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    external: ['react', 'react-dom', '@rangka/client'],
  });

  // Step 2: CSS extraction (new)
  const inputCSS = [
    '@import "tailwindcss" source(none);',
    `@source "${component.filePath}";`,
    hostThemeBlock,
  ].join('\n');

  const result = await postcss([tailwindcss()]).process(inputCSS, { from: component.filePath });

  await fs.writeFile(cssOutputPath, result.css);
}
```

Key details:

- `source(none)` disables automatic file scanning. Only the widget file is scanned.
- `@source` points to the single widget source file.
- `hostThemeBlock` is the `@theme inline { ... }` content from the client's `index.css`. This tells Tailwind about the semantic token names (`--color-primary`, etc.) so it can generate utilities for them.
- Each widget gets its own CSS file. No shared utility bundle.

### Why `source(none)` matters

Without it, Tailwind would auto-detect sources and potentially scan the entire project. `source(none)` ensures the widget CSS contains only utilities from that one widget file. This keeps chunks small and build times fast.

### Host theme block extraction

The build step reads the host's `index.css` and extracts the `@theme inline { ... }` block. This block defines the mapping from Tailwind utility names to CSS variables. Without it, Tailwind wouldn't recognize `bg-primary` as a valid utility during the widget build.

```typescript
function extractThemeInlineBlock(indexCssPath: string): string {
  const content = fs.readFileSync(indexCssPath, 'utf-8');
  const match = content.match(/@theme inline \{[\s\S]*?\n\}/);
  return match ? match[0] : '';
}
```

### Manifest format

The manifest now includes CSS paths:

```json
{
  "views": {
    "sales.pipeline-board": {
      "js": "/_rangka/views/sales--pipeline-board.abc123.js",
      "css": "/_rangka/views/sales--pipeline-board.abc123.css"
    }
  },
  "fields": {},
  "cards": {}
}
```

### Runtime loading

When the shell loads a custom widget, it injects both the CSS and JS:

```typescript
async function loadCustomWidget(entry: { js: string; css: string }) {
  // Inject CSS first (avoids flash of unstyled content)
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = entry.css;
  document.head.appendChild(link);

  // Wait for CSS to load
  await new Promise((resolve) => {
    link.onload = resolve;
    link.onerror = resolve;
  });

  // Load JS module
  const mod = await import(entry.js);
  return mod.default;
}
```

## 5. Why duplicate utilities don't clash

Multiple widget CSS chunks may contain identical rules (e.g., `.flex { display: flex }`). This is harmless because:

- CSS utilities are idempotent. Same class always produces same declaration.
- No specificity conflict. All are flat single-class selectors (`0,1,0`).
- Last one wins in cascade, but since values are identical, order doesn't matter.
- Variables resolve at the element, not at definition time. `var(--color-primary)` resolves to whatever the host's `:root` defines.

## 6. Constraints on custom widgets

Custom widgets are consumers of the theme, not providers.

### Allowed

- Use any Tailwind utility class in JSX
- Reference semantic tokens (`bg-primary`, `text-muted-foreground`, etc.)
- Use arbitrary values (`bg-[#ff0000]`) when needed

### Not allowed

- Define `@theme` blocks in widget source (build step won't include them)
- Override `:root` variables (build step strips `:root` definitions)
- Import the host's `index.css` (externalized, not available to widgets)

### Lint enforcement

`rangka build` can warn if a widget source contains `:root`, `@theme`, or hardcoded color values where a semantic token exists. This is advisory, not blocking.

## 7. Studio integration

### Theme editing flow

1. User opens theme settings in Studio (or asks the agent to change colors)
2. Agent updates the theme config in the app definition file
3. Runtime Manager re-scans
4. Boot response includes new theme values
5. Preview reloads and applies the new palette

### Live preview (bypass reload)

For instant feedback during color picking, Studio pushes overrides directly:

```typescript
// Studio → preview iframe
previewFrame.contentWindow.postMessage(
  {
    type: 'rangka:theme-override',
    payload: {
      light: { primary: 'oklch(0.6 0.2 260)' },
      dark: { primary: 'oklch(0.5 0.15 260)' },
    },
  },
  '*',
);
```

The client shell applies these immediately without a full boot cycle. When the user commits, Studio persists through the agent.

### Custom widget development in Studio

1. User asks agent to build a widget
2. Agent writes the `.tsx` file using Tailwind classes
3. Runtime Manager detects the file change in `modules/*/widgets/`
4. Triggers `rangka build` (esbuild + PostCSS pass)
5. Preview reloads
6. Widget renders with theme colors applied

## 8. Dependencies

New packages required in `@rangka/cli`:

| Package                | Purpose                              |
| ---------------------- | ------------------------------------ |
| `postcss`              | PostCSS processor (programmatic API) |
| `@tailwindcss/postcss` | Tailwind v4 PostCSS plugin           |

These are build-time dependencies only. No runtime cost to the client shell.

## 9. Migration

No breaking changes. The system is additive:

- If no `theme` field exists in boot response, nothing is injected. Default `index.css` colors apply.
- If no `.css` file exists in the widget manifest (old format), the loader skips CSS injection. Backwards compatible with widgets built before this feature.
- The manifest format change (string → object) requires a version check. The loader handles both formats:

```typescript
function resolveManifestEntry(entry: string | { js: string; css: string }) {
  if (typeof entry === 'string') return { js: entry, css: null };
  return entry;
}
```

## Open questions

- Should theme presets (predefined palettes) be built into Studio, or user-created only?
- Should the radius token be overridable independently from colors?
- Should there be a "reset to defaults" action that clears all overrides?
- Should `rangka build` deduplicate common utilities across widget chunks into a shared base CSS file? (Optimization, not required for correctness.)
