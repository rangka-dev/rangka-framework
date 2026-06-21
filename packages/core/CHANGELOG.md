# @rangka/core

## 0.1.3

### Patch Changes

- Updated dependencies []:
  - @rangka/shared@0.1.3

## 0.1.2

### Patch Changes

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
