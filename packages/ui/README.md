# @rangka/ui

Design system package for Rangka Framework. Contains all visual components, design tokens, and styling. The client package consumes this for rendering — zero Tailwind classes live outside this package.

## Development

```bash
pnpm install
pnpm storybook     # Start Storybook on http://localhost:6006
pnpm build         # Build for production (tsc + vite)
pnpm test          # Run tests
```

## Architecture

- **Base UI** (`@base-ui/react`) for headless accessibility and behavior
- **Tailwind CSS v4** + **CVA** for styling and variant management
- **Composition pattern** for multi-section components (sub-components as static properties)
- **Design tokens** as CSS variables (OKLch color space)

## Directory Structure

```
src/
  primitives/    — Button, Input, Select, Badge, etc.
  layout/        — Stack, Grid, Card, Section, etc.
  shell/         — Sidebar, Topbar, Breadcrumbs, Navigation
  data/          — DataTable, Datagrid, Column, cell editors
  overlays/      — Modal, Drawer, Popover, Dropdown, Tooltip
  feedback/      — Toast, Spinner, Empty, Alert
  form/          — FormField, InputGroup
  tokens/        — CSS variables (colors, spacing, typography, animations)
  lib/           — Utilities (cn)
stories/         — Storybook stories, mirrors src/ structure
```

## Adding a Component

1. Create the component file in the appropriate layer directory
2. Use CVA for variant styling, `cn()` for class merging
3. Export from the layer's `index.ts` barrel
4. Add a story in `stories/<layer>/<component>.stories.tsx`
5. Run Storybook to verify it renders correctly

## Component Conventions

### Simple primitives

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cn } from '../lib/cn';

const variants = cva('base-classes', {
  variants: { variant: { ... }, size: { ... } },
  defaultVariants: { variant: 'primary', size: 'md' },
});

export const Component = forwardRef<HTMLElement, Props>(
  ({ className, variant, size, ...props }, ref) => (
    <element className={cn(variants({ variant, size, className }))} ref={ref} {...props} />
  ),
);
```

### Composition pattern (multi-section components)

```tsx
import { createContext, useContext } from 'react';

function Root({ children, ...props }) { ... }
function Header({ children }) { ... }
function Body({ children }) { ... }

export const Component = Object.assign(Root, { Header, Body });
```

## Design Tokens

Tokens live in `src/tokens/` as CSS variables. Import them via:

```ts
import '@rangka/ui/tokens.css';
```

Colors use OKLch for perceptually uniform light/dark modes. The `.dark` class on a parent element activates dark mode tokens.

## Visual Direction

Inspired by Plane.so — clean, modern, information-dense enough for business tools. Exact token values will be refined in a separate design pass.
