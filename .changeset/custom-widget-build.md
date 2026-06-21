---
'@rangka/cli': patch
'@rangka/client': patch
'@rangka/shared': patch
'@rangka/core': patch
'@rangka/studio-core': patch
'rangka': patch
'create-rangka': patch
---

Custom widget build pipeline and runtime loader

- `rangka build` compiles custom widgets from `modules/*/widgets/` with esbuild, generates per-widget Tailwind CSS, and outputs bundles to `.rangka/`
- Runtime loader fetches the manifest and lazily imports widgets on demand with CSS injection
- Error boundary isolates widget crashes without taking down the page
- Shell exposes React, ReactDOM, and client hooks (`usePageState`, `useShell`, `useWidgetContext`, `useModelQuery`, `useModelRecord`) for custom widget consumption
- Studio `build_widgets` tool enables agent-triggered widget compilation
- Theme extraction shipped as `dist/theme.css` in `@rangka/client` for portable Tailwind compilation
