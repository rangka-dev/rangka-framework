# @rangka/client

## 0.1.4

### Patch Changes

- [#5](https://github.com/rangka-dev/rangka-framework/pull/5) [`eda18f9`](https://github.com/rangka-dev/rangka-framework/commit/eda18f97e511ee932398871877cb9001f363e559) Thanks [@irfnmzk](https://github.com/irfnmzk)! - feat: add datagrid widget with spreadsheet-like editing

  New `datagrid` widget for `@rangka/client` providing an Airtable/NocoDB-style spreadsheet experience.

  Features:

  - Virtual scrolling with infinite loading (no pagination)
  - Inline cell editing with field-type-aware editors (text, number, date, datetime, enum, combobox, money, checkbox)
  - Column resizing, reordering (drag), and visibility toggle
  - CSS Grid layout for consistent column alignment
  - Keyboard navigation (arrows, tab, enter, escape, home/end, copy)
  - Row selection with row-number-to-checkbox hover pattern
  - Row creation (local temp row until required fields filled, then auto-persists)
  - Row deletion with optimistic removal
  - Multi-column sort (shift+click)
  - Search and filter toolbar
  - Auto-column derivation from model metadata
  - Sort stability during editing (no row reorder on cell edit)
  - Field type icons in column headers

  Also adds `layout` field to `PageDefinition` (`'default' | 'full'`) for edge-to-edge pages.

- Updated dependencies [[`eda18f9`](https://github.com/rangka-dev/rangka-framework/commit/eda18f97e511ee932398871877cb9001f363e559)]:
  - @rangka/shared@0.1.4
  - @rangka/ui@0.1.4

## 0.1.3

### Patch Changes

- [`18b7fc8`](https://github.com/rangka-dev/rangka-framework/commit/18b7fc8c619cf4b426d9aa0f11358364cde960ee) Thanks [@irfnmzk](https://github.com/irfnmzk)! - Revert lazy loading for built-in widgets. All built-in widgets are now eagerly registered at boot. Fixes widget loading failures when served by Fastify static.

- Updated dependencies []:
  - @rangka/shared@0.1.3

## 0.1.2

### Patch Changes

- [`97c95fa`](https://github.com/rangka-dev/rangka-framework/commit/97c95fadfe4972e28d725b4ced76184fe4497c5c) Thanks [@irfnmzk](https://github.com/irfnmzk)! - Bundle splitting for widget lazy loading

  - Split built-in widgets into core tier (9 always-loaded) and lazy tier (29 on-demand)
  - Lazy widgets load on first render via dynamic import, producing separate chunks
  - Added vendor chunk separation for TanStack Query, Router, and Radix
  - Removed unused recharts dependency and chart.tsx
  - Initial JS payload reduced from 374KB to 243KB gzipped (35% reduction)

- [`8389ba0`](https://github.com/rangka-dev/rangka-framework/commit/8389ba0ca0d88d8a29cafccbb5751d817396dcfd) Thanks [@irfnmzk](https://github.com/irfnmzk)! - Custom widget build pipeline and runtime loader

  - `rangka build` compiles custom widgets from `modules/*/widgets/` with esbuild, generates per-widget Tailwind CSS, and outputs bundles to `.rangka/`
  - Runtime loader fetches the manifest and lazily imports widgets on demand with CSS injection
  - Error boundary isolates widget crashes without taking down the page
  - Shell exposes React, ReactDOM, and client hooks (`usePageState`, `useShell`, `useWidgetContext`, `useModelQuery`, `useModelRecord`) for custom widget consumption
  - Studio `build_widgets` tool enables agent-triggered widget compilation
  - Theme extraction shipped as `dist/theme.css` in `@rangka/client` for portable Tailwind compilation

- Updated dependencies [[`8389ba0`](https://github.com/rangka-dev/rangka-framework/commit/8389ba0ca0d88d8a29cafccbb5751d817396dcfd)]:
  - @rangka/shared@0.1.2

## 0.1.1

### Patch Changes

- Updated dependencies []:
  - @rangka/shared@0.1.1

## 0.1.0

### Minor Changes

- [`438bf4a`](https://github.com/rangka-dev/rangka-framework/commit/438bf4a385b99d1e497e937375dc03aac101c8ec) Thanks [@irfnmzk](https://github.com/irfnmzk)! - Initial open source release

  - Modular ERP framework with declarative models, hooks, services, and widgets
  - CLI with dev server, build, and studio commands
  - Studio AI development environment with WebSocket-based UI
  - create-rangka scaffolding tool
  - MIT licensed framework, AGPL licensed studio

### Patch Changes

- Updated dependencies [[`438bf4a`](https://github.com/rangka-dev/rangka-framework/commit/438bf4a385b99d1e497e937375dc03aac101c8ec)]:
  - @rangka/shared@0.1.0
