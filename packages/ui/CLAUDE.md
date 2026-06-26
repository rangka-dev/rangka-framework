# @rangka/ui

Design system package. All visual rendering lives here. The client package is headless orchestration only.

## Package Role

- Owns all DOM rendering with classnames
- Owns Tailwind CSS, CVA, design tokens
- Owns Base UI as headless accessibility layer
- Exports components consumed by `@rangka/client`

## Reference Documents

- `COMPONENT_MAP.md` — Full inventory of every component with build status (Done/Pending/Skipped). Check this before building anything new.
- `BASE_UI_MAP.md` — Maps each component to its Base UI primitive or marks it as custom. Use this to find the correct `@base-ui/react/*` import.
- `README.md` — Public-facing package overview and quick start.

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

## Component Code Style

Every component file follows this exact structure:

```tsx
// 1. Imports
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

// 2. Variants (CVA) — single source of truth for style values AND types
const buttonVariants = cva('base-classes...', {
  variants: {
    variant: { primary: '...', secondary: '...' },
    size: { sm: '...', md: '...' },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
});

// 3. Props interface — exported, extends native HTML attrs, JSDoc on custom props
export type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    /** Show loading spinner and disable interaction */
    loading?: boolean;
  };

// 4. Component — forwardRef, destructure custom props, spread ...props last
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {children}
      </button>
    );
  },
);

// 5. Display name + named exports
Button.displayName = 'Button';
export { buttonVariants };
```

### Rules

- Props type is always `ComponentNameProps` (e.g., `ButtonProps`, `ModalProps`, `CardProps`)
- Always extend the native HTML element: `ComponentProps<'button'>`, `ComponentProps<'div'>`, etc.
- CVA `variants` object is the single source of truth for variant/size values. Never duplicate these as a separate type.
- JSDoc on every custom prop (not HTML-inherited ones). These become IDE tooltips and Storybook autodocs.
- No separate `.types.ts` or `.meta.ts` files. Types live in the component file.
- `forwardRef` on every component. No exceptions.
- Spread `...props` last so consumers can override defaults.
- Export both the component and its props type from the barrel.

### Composed Components

Each sub-component gets its own exported props type:

```tsx
export type ModalProps = ComponentProps<'div'> & {
  /** Whether the modal is open */
  open: boolean;
  /** Called when open state should change */
  onOpenChange: (open: boolean) => void;
};

export type ModalHeaderProps = ComponentProps<'div'>;
export type ModalTitleProps = ComponentProps<'h2'>;
export type ModalBodyProps = ComponentProps<'div'>;
export type ModalFooterProps = ComponentProps<'div'> & {
  /** Align footer content */
  align?: 'start' | 'end' | 'between';
};
```

### Barrel Exports

Every barrel (`src/<layer>/index.ts`) exports the component AND its props type:

```tsx
export { Button, buttonVariants, type ButtonProps } from './button';
export { Modal, type ModalProps, type ModalHeaderProps } from './modal';
```

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
- Every component MUST have a story at `stories/<layer>/<component>.stories.tsx` — a component is not complete without one
- Stories must cover all variants and composition patterns

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
