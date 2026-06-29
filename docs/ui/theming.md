---
status: stable
since: 0.1.0
last-updated: 2026-06-12
description: Theme tokens and CSS customization options
---

# Theming

The visual layer is built on CSS custom properties. Every color, spacing value, radius, and transition is a token you can override to match your brand.

Design tokens live in `packages/ui/src/tokens/`. The token system uses OKLCh color space for perceptual uniformity.

## Token files

| File             | Contents                                  |
| ---------------- | ----------------------------------------- |
| `colors.css`     | Primitive color scales + semantic aliases |
| `spacing.css`    | Spacing scale, radius, border widths      |
| `typography.css` | Font families, type scale, line heights   |
| `animations.css` | Transitions and keyframes                 |
| `base.css`       | Reset and base element styles             |
| `index.css`      | Imports all above + `@theme inline` block |

## Customizing your theme

Create a CSS file that overrides the tokens you want to change:

```css
/* styles/theme.css */
:root {
  --color-primary: oklch(0.55 0.15 270);
  --color-primary-hover: oklch(0.5 0.15 270);
  --font-sans: 'Your Brand Font', system-ui, sans-serif;
}

[data-theme='dark'] {
  --color-primary: oklch(0.65 0.15 270);
  --color-primary-hover: oklch(0.6 0.15 270);
}
```

Import it after the base tokens:

```typescript
import '@rangka/ui/tokens';
import './styles/theme.css';
```

## Color system

Colors use a two-tier approach: primitive scales and semantic tokens.

### Primitive scales

Raw color values at numbered stops. Not used directly in components.

| Scale   | Purpose            |
| ------- | ------------------ |
| Neutral | Grays and surfaces |
| Brand   | Primary accent     |
| Green   | Success states     |
| Amber   | Warning states     |
| Red     | Destructive/danger |

### Semantic tokens

Map primitives to UI roles. Components reference these.

| Token                      | Usage                  |
| -------------------------- | ---------------------- |
| `--color-background`       | Page canvas            |
| `--color-surface`          | Card and panel fills   |
| `--color-muted`            | Subtle backgrounds     |
| `--color-primary`          | Brand accent, CTAs     |
| `--color-destructive`      | Delete, error actions  |
| `--color-success`          | Positive confirmations |
| `--color-warning`          | Caution indicators     |
| `--color-foreground`       | Default text           |
| `--color-muted-foreground` | Secondary text         |

## Spacing

Based on a 4px grid. Semantic aliases group the scale into named sizes.

| Alias           | Value     | Pixels |
| --------------- | --------- | ------ |
| `--spacing-xs`  | `0.25rem` | 4      |
| `--spacing-sm`  | `0.5rem`  | 8      |
| `--spacing-md`  | `1rem`    | 16     |
| `--spacing-lg`  | `1.5rem`  | 24     |
| `--spacing-xl`  | `2rem`    | 32     |
| `--spacing-2xl` | `3rem`    | 48     |

## Typography

| Token         | Default value                         |
| ------------- | ------------------------------------- |
| `--font-sans` | Inter Variable, system-ui, sans-serif |
| `--font-mono` | Fira Code, Fira Mono, Cascadia Code   |
| `--text-xs`   | 0.75rem (12px)                        |
| `--text-sm`   | 0.875rem (14px)                       |
| `--text-base` | 1rem (16px)                           |
| `--text-lg`   | 1.125rem (18px)                       |
| `--text-xl`   | 1.25rem (20px)                        |

## Border radius

| Token          | Value    |
| -------------- | -------- |
| `--radius-sm`  | 0.25rem  |
| `--radius-md`  | 0.375rem |
| `--radius-lg`  | 0.5rem   |
| `--radius-xl`  | 0.75rem  |
| `--radius-2xl` | 1rem     |

## Dark mode

Toggle with `data-theme="dark"` on the root element:

```html
<html data-theme="dark"></html>
```

Every semantic token has a dark variant. If you use tokens consistently, dark mode works automatically. Hardcoding a color value opts that element out of dark mode.

## Per-app theming

If different apps need different accents:

```css
[data-app='hr'] {
  --color-primary: oklch(0.6 0.18 150);
}

[data-app='finance'] {
  --color-primary: oklch(0.48 0.12 243);
}
```

The shell sets `data-app` on the content area based on the current route.

## Tips

- OKLCh format gives perceptually uniform lightness. Adjusting the L channel produces consistent contrast across hues.
- Test dark mode whenever you override tokens. Missing dark overrides cause contrast issues.
- Do not hardcode color values in components. Use the semantic token layer.
