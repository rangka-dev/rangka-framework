---
status: stable
since: 0.1.0
last-updated: 2026-06-12
description: Theme tokens and CSS customization options
---

# Theming

Rangka's visual layer is built on CSS custom properties. Every color, spacing value, shadow, and transition is a token you can override to match your brand.

## Customizing your theme

Create a CSS file that overrides the tokens you want to change:

```css
/* styles/theme.css */
:root {
  --color-primary: 262 72% 56%; /* purple instead of blue */
  --color-primary-hover: 262 72% 50%;
  --font-sans: 'Your Brand Font', system-ui, sans-serif;
  --density: 0.875; /* compact */
}

[data-theme='dark'] {
  --color-primary: 262 72% 64%;
  --color-primary-hover: 262 72% 58%;
}
```

Import it after your base tokens:

```typescript
import './styles/tokens.css';
import './styles/theme.css';
```

## Token reference

All tokens live in `tokens.css`. Here's the full set:

```css
:root {
  /* Colors (HSL values without wrapper, for opacity modifiers) */
  --color-primary: 220 72% 56%;
  --color-primary-hover: 220 72% 50%;
  --color-primary-subtle: 220 72% 56% / 0.1;

  --color-surface-sunken: 220 20% 96%;
  --color-surface-base: 0 0% 100%;
  --color-surface-raised: 220 20% 99%;

  --color-border-subtle: 220 13% 91%;
  --color-border-default: 220 13% 87%;
  --color-border-emphasis: 220 13% 72%;

  --color-text-primary: 220 20% 10%;
  --color-text-muted: 220 10% 46%;

  --color-success: 142 72% 36%;
  --color-warning: 38 92% 50%;
  --color-error: 0 72% 51%;
  --color-info: 220 72% 56%;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --text-xs: 0.75rem; /* 12px */
  --text-sm: 0.8125rem; /* 13px */
  --text-base: 0.875rem; /* 14px */
  --text-lg: 1rem; /* 16px */
  --text-xl: 1.125rem; /* 18px */
  --text-2xl: 1.25rem; /* 20px */

  /* Density */
  --density: 1;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;

  /* Shadows */
  --shadow-inset: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);

  /* Transitions */
  --transition-fast: 100ms ease;
  --transition-base: 150ms ease;
  --transition-slow: 250ms ease;
}
```

## Surfaces

Surfaces create depth without heavy shadows:

| Level   | Usage                              |
| ------- | ---------------------------------- |
| Sunken  | Page canvas, table stripes, inputs |
| Base    | Default content area               |
| Raised  | Cards, elevated sections           |
| Overlay | Modals, drawers, dropdowns         |

## Density

A single variable scales all vertical spacing, heights, and padding:

| Mode        | Value   | Button Height | Feel                 |
| ----------- | ------- | ------------- | -------------------- |
| Compact     | `0.875` | 32px          | Maximum data density |
| Default     | `1`     | 36px          | Balanced             |
| Comfortable | `1.125` | 40px          | Touch-friendly       |

Set on the root element:

```html
<html data-density="compact"></html>
```

All components using `calc(... * var(--density))` respond automatically.

## Dark mode

Toggle with `data-theme="dark"` on the root element:

```html
<html data-theme="dark"></html>
```

Every token has a dark variant. If you use tokens consistently, dark mode works automatically. The moment you hardcode a color value, you opt out of dark mode for that element.

## Per-module theming

If different modules need different accents:

```css
[data-module='hr'] {
  --color-primary: 142 72% 40%;
}

[data-module='finance'] {
  --color-primary: 220 72% 56%;
}
```

The shell sets `data-module` on the content area based on the current route.

## Tips

- HSL format allows opacity modifiers: `hsl(var(--color-primary) / 0.5)` gives you 50% opacity. That's why tokens store raw HSL values.
- Test density extremes. Switch between compact and comfortable to ensure custom components don't break.
- Don't fight the token system. If you're writing raw color values, there's probably a token for it.
