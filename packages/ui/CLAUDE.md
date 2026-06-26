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

## Icons

- Never define inline SVGs in component files. No `<svg>`, `<path>`, `<circle>`, etc.
- All icons come from `lucide-react`
- All icon rendering MUST go through the internal `Icon` component (`src/primitives/icon.tsx`)
- Usage: `<Icon icon={ChevronRight} size="sm" />`
- Import lucide icons by name, then pass as the `icon` prop to `Icon`

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

## Widget System

Widgets live in `src/widgets/` organized by category: `input`, `display`, `action`, `layout`, `data`, `overlay`.

### Adding a New Widget

1. Create `src/widgets/<category>/<name>-widget.tsx`
2. Every widget accepts `WidgetComponentProps` from `../types` — never add custom prop interfaces
3. Destructure only what you use: `{ props, bind, on, context, children }`
4. Compose from existing primitives/form/layout components — widgets are composition, not new DOM
5. Export from `src/widgets/<category>/index.ts`
6. Register in `src/widgets/index.ts` → `widgetComponents` map with the widget type key
7. Add a demo to `stories/widgets/<category>-widgets.stories.tsx`

### Widget Rules

- All text uses `text-2xs` token (13px, defined in `src/tokens/typography.css`)
- Labels use `text-foreground/80` via the Label primitive
- No focus ring on inputs — `focus-visible:outline-none` only
- Number inputs hide stepper: `[appearance:textfield]`
- Select/Link/Tree use custom dropdown (not Base UI Select) with `bg-surface`, `border-border`, `shadow-md`
- Dropdown items: `text-2xs hover:bg-foreground/6`, active: `bg-foreground/6 font-medium`
- Checkbox label goes to the right (use `Field orientation="horizontal"`)

### Widget Props Contract

```tsx
interface WidgetComponentProps {
  props: Record<string, unknown>; // widget-specific config from page definition
  bind: WidgetBind; // value + setValue + meta + error
  on: Record<string, (...args) => void>; // event handlers
  context: WidgetContext; // record, model, mode
  childNodes?: WidgetNode[]; // for data containers
  children?: ReactNode; // for layout containers (pre-rendered)
}
```

## Page Compositions

Page stories live in `stories/pages/` and use the `PageShell` wrapper from `stories/pages/page-shell.tsx`.

### Adding a New Page

1. Create `stories/pages/<name>.stories.tsx`
2. Import `PageShell` and wrap content with it
3. Set `module`, `page`, and optionally `action` (header button) props
4. Set `layout="default"` for padded content (forms, dashboards, detail) or `layout="full"` for bleed (tables, lists)
5. Compose the page body ONLY from widget components — no raw HTML elements, no divs, no Tailwind in the story
6. Use `title: 'Pages/<Category>'` for Storybook grouping

### Layout Types

- `layout="default"` — `px-6 py-4 gap-6` padding (forms, cards, dashboards)
- `layout="full"` — edge-to-edge, no padding (tables, data grids, list views)

### Page Composition Rules

- Zero intermediate divs — all structure comes from widget components
- Use `GroupWidget` for horizontal arrangements, `StackWidget` for vertical
- Use `GridWidget` for column layouts
- Use `CardWidget` to group related fields
- Use `SectionWidget` for labeled collapsible sections
- Use `DividerWidget` before action button rows
- Footer actions: `GroupWidget direction="row" justify="end" gap="sm"`
