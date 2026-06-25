# @rangka/ui

Design system package. All visual rendering lives here. The client package is headless orchestration only.

## Package Role

- Owns all DOM rendering with classnames
- Owns Tailwind CSS, CVA, design tokens
- Owns Base UI as headless accessibility layer
- Exports components consumed by `@rangka/client`

## Import Rules

- `@rangka/ui` imports from `@rangka/shared` (types only, if needed)
- `@rangka/ui` never imports from `core`, `client`, `cli`, or `studio-*`
- `@rangka/client` imports from `@rangka/ui` for all visual components

## Adding a New Component

1. Decide which layer it belongs to: `primitives`, `layout`, `shell`, `data`, `overlays`, `feedback`, or `form`
2. Create `src/<layer>/<component>.tsx`
3. Follow these rules:
   - Use `cn()` from `../lib/cn` for class merging (never raw `clsx` or `twMerge` alone)
   - Use CVA for variant/size props. Define variants with `cva()` and export the variants object
   - Use `forwardRef` for all components that render a single DOM element
   - Accept `className` prop and merge it via CVA's className parameter
   - Use CSS variable tokens (e.g., `var(--color-primary)`) not hardcoded colors
   - Use Tailwind utility classes for layout/spacing, token variables for colors
4. Export the component and its types from `src/<layer>/index.ts`
5. Create a story at `stories/<layer>/<component>.stories.tsx`
6. Verify in Storybook (`pnpm storybook`)

## Composition Pattern

For components with distinct structural sections (Modal, Select, DataTable, Sidebar):

- Root component provides shared context via React context
- Sub-components access parent context internally
- Attach sub-components as static properties: `Component.Header`, `Component.Body`
- Use `Object.assign(Root, { Header, Body, Footer })` pattern
- Never export sub-components as standalone (e.g., no `ModalHeader`, only `Modal.Header`)

For simple components (Button, Input, Badge): skip composition, just use CVA + forwardRef.

## Styling Rules

- All styles use Tailwind CSS v4 utility classes
- Colors reference CSS variable tokens: `bg-[var(--color-primary)]`
- Spacing uses token variables or Tailwind's built-in scale
- Never use inline styles except for truly dynamic values (e.g., computed widths)
- Dark mode is handled via `.dark` class on a parent and CSS variable reassignment in `tokens/colors.css`

## File Naming

- Component files: `kebab-case.tsx` (e.g., `radio-group.tsx`, `data-table.tsx`)
- One component per file (root + sub-components can share a file)
- Story files mirror source: `stories/<layer>/<component>.stories.tsx`

## Testing

- Run `pnpm test` for unit tests (Vitest)
- Run `pnpm storybook` to visually verify components
- Every component should have at least one story covering all variants

## Build

- `pnpm build` runs TypeScript compilation then Vite library build
- Output goes to `dist/` as ESM with `.d.ts` declarations
- React and react-dom are externalized (peer dependencies)

## Commands

```bash
pnpm storybook        # Dev with hot reload
pnpm build            # Production build
pnpm test             # Unit tests
pnpm storybook:build  # Static Storybook export
```
