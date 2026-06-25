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
   - Default to composition pattern. Only skip if the component is a single-element leaf primitive
   - Use `cn()` from `../lib/cn` for class merging (never raw `clsx` or `twMerge` alone)
   - Use CVA for variant/size props. Define variants with `cva()` and export the variants object
   - Use `forwardRef` for all components that render a single DOM element
   - Accept `className` prop and merge it via CVA's className parameter
   - Use CSS variable tokens (e.g., `var(--color-primary)`) not hardcoded colors
   - Use Tailwind utility classes for layout/spacing, token variables for colors
4. Export the component and its types from `src/<layer>/index.ts`
5. Write an API surface test at `src/<layer>/__tests__/<component>.api.test.ts`
6. Create a story at `stories/<layer>/<component>.stories.tsx`
7. Run `pnpm test` to verify API surface test passes
8. Verify in Storybook (`pnpm storybook`)

## Composition Pattern

Every component that renders more than a single DOM element MUST use the composition pattern. This is non-negotiable for maintainability.

- Root component provides shared context via React context
- Sub-components access parent context internally
- Attach sub-components as static properties: `Component.Header`, `Component.Body`
- Use `Object.assign(Root, { Header, Body, Footer })` pattern
- Never export sub-components as standalone (e.g., no `ModalHeader`, only `Modal.Header`)
- Never use prop-drilling for structural sections (no `header={...}` render props)
- Each sub-component handles its own styling — parent only provides context

The only exception: single-element primitives (Button, Input, Badge) that are leaf nodes with no structural children. These use CVA + forwardRef directly.

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
- API surface tests: `src/<layer>/__tests__/<component>.api.test.ts`

## Testing

- Run `pnpm test` for unit tests (Vitest)
- Run `pnpm storybook` to visually verify components
- Every component should have at least one story covering all variants

## API Surface Tests

Every component MUST have an API surface test at `src/<layer>/__tests__/<component>.api.test.ts`. This test locks the public API so accidental changes are caught in CI.

What the test asserts:

- Exported component names (named exports from the barrel)
- Sub-component static properties (e.g., `Modal.Header`, `Modal.Body`)
- Prop types accepted (required vs optional, variant values)
- Ref forwarding works

Example (`src/primitives/__tests__/button.api.test.ts`):

```typescript
import { describe, it, expect } from 'vitest';
import { Button, buttonVariants } from '../button';
import { render } from '@testing-library/react';
import { createRef } from 'react';

describe('Button API surface', () => {
  it('exports Button component and buttonVariants', () => {
    expect(Button).toBeDefined();
    expect(buttonVariants).toBeDefined();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Test</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('accepts variant and size props', () => {
    const { container } = render(
      <Button variant="destructive" size="sm">Delete</Button>
    );
    expect(container.firstChild).toBeTruthy();
  });
});
```

Example for composed component (`src/overlays/__tests__/modal.api.test.ts`):

```typescript
import { describe, it, expect } from 'vitest';
import { Modal } from '../modal';

describe('Modal API surface', () => {
  it('exports Modal with sub-components', () => {
    expect(Modal).toBeDefined();
    expect(Modal.Header).toBeDefined();
    expect(Modal.Title).toBeDefined();
    expect(Modal.Description).toBeDefined();
    expect(Modal.Body).toBeDefined();
    expect(Modal.Footer).toBeDefined();
  });
});
```

If an API surface test fails after a code change, it means the public contract changed. Update the test intentionally — never delete or weaken it to make CI pass.

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
