# Widget-UI Component Alignment — ✅ Implemented

Date: 2025-06-15

## Goal

Align widget props with their corresponding UI components, split InputWidget into dedicated widgets, and extract Modal/Drawer into proper UI components.

## Scope

### 1. ButtonWidget — Fix variant naming, add loading

Current issues:

- Widget uses `danger` variant but UI component expects `destructive`
- UI component has `loading` prop not exposed by widget

Changes:

- Rename variant value `danger` to `destructive` in widget schema
- Add `loading` prop (boolean, default: false)

Final schema:

```
label: string (required)
variant: 'primary' | 'secondary' | 'ghost' | 'destructive' (default: 'secondary')
size: 'sm' | 'md' | 'lg' (default: 'md')
disabled: boolean (default: false)
loading: boolean (default: false)
```

Triggers: `click`

### 2. IconWidget — Fix default size, add color

Current issues:

- Widget defaults size to 16, UI component defaults to 14
- UI component accepts `color` via LucideProps but widget does not expose it

Changes:

- Change default size to 14 (match UI)
- Add `color` prop (string)

Final schema:

```
name: string (required)
size: number (default: 14)
color: string
```

Triggers: `click`

### 3. InputWidget — Strip polymorphic logic, expand props

Current issues:

- Renders Select for enum/link fields and Checkbox for boolean fields
- Does not expose `error`, `prefix`, `suffix` from UI Input component
- Does not expose HTML validation attributes

Changes:

- Remove all Select and Checkbox rendering logic
- InputWidget only renders the `Input` UI component
- Handles field types: text, number (int/decimal/money), date, textarea
- Add `error`, `prefix`, `suffix`, `min`, `max`, `step`, `pattern` props

Final schema:

```
label: string
placeholder: string
readOnly: boolean (default: false)
disabled: boolean (default: false)
error: string
prefix: string
suffix: string
min: number
max: number
step: number
pattern: string
```

Binding: `field`
Triggers: `change`, `focus`, `blur`

Type mapping from `bind.meta.type`:

- `int`, `decimal`, `money` → input type `number`
- `date` → input type `date`
- everything else → input type `text`

### 4. SelectWidget (new)

Dedicated widget for enum and link fields. Uses `Select` from local shadcn components.

Schema:

```
label: string
placeholder: string
searchable: boolean (default: false)
disabled: boolean (default: false)
```

Binding: `field` (expects `bind.meta.options` for option list)
Triggers: `change`

Rendering:

- Options from `bind.meta.options` (array of `{ value, label }`)
- Value from `bind.value`
- Change calls `bind.setValue`

### 5. CheckboxWidget (new)

Dedicated widget for boolean fields. Uses `Checkbox` from local shadcn components.

Schema:

```
label: string
disabled: boolean (default: false)
```

Binding: `field` (boolean value)
Triggers: `change`

Rendering:

- Checked state from `bind.value`
- Change calls `bind.setValue`
- Label rendered as adjacent text

### 6. BadgeWidget — No changes

Already fully aligned with UI component. No action needed.

### 7. Modal UI Component (new)

Extract from ModalWidget into a proper component. Built on Radix Dialog primitive.

Props:

```
open: boolean
onClose: () => void
size: 'sm' | 'md' | 'lg' (default: 'md')
title: string
closable: boolean (default: true)
children: ReactNode
```

Size mapping:

- sm: max-width 400px
- md: max-width 560px
- lg: max-width 720px

Features:

- Backdrop overlay with click-to-close (when closable)
- Centered positioning
- Close button in header (when closable)
- Title in header
- ESC key closes (when closable)

### 8. Drawer UI Component (new)

Extract from DrawerWidget into a proper component. Push-from-right pattern at shell level.

Props:

```
open: boolean
onClose: () => void
width: 'sm' | 'md' | 'lg' (default: 'md')
title: string
closable: boolean (default: true)
children: ReactNode
```

Width mapping:

- sm: 320px
- md: 480px
- lg: 640px

Behavior:

- Lives as sibling to main content in the app shell
- Pushes main content (main content shrinks) — not an overlay
- Opens from right side only (left is nav sidebar)
- Smooth width transition on open/close
- Close button in header (when closable)
- Title in header
- No backdrop

### 9. ModalWidget — Refactor to use Modal UI component

Remove inline overlay/positioning logic. Pass props to the new Modal UI component.

Widget schema stays the same:

```
size: 'sm' | 'md' | 'lg' (default: 'md')
title: string
closable: boolean (default: true)
```

Visibility controlled via PageState (`_visibleField`).

### 10. DrawerWidget — Refactor to use Drawer UI component

Remove inline fixed-positioning logic. Pass props to the new Drawer UI component.

Widget schema stays the same:

```
width: 'sm' | 'md' | 'lg' (default: 'md')
title: string
closable: boolean (default: true)
```

Visibility controlled via PageState (`_visibleField`).

## File Changes

### New files:

- `packages/client/src/components/ui/modal.tsx`
- `packages/client/src/components/ui/drawer.tsx`
- `packages/client/src/widgets/components/SelectWidget.tsx`
- `packages/client/src/widgets/components/CheckboxWidget.tsx`

### Modified files:

- `packages/client/src/widgets/components/ButtonWidget.tsx`
- `packages/client/src/widgets/components/IconWidget.tsx`
- `packages/client/src/widgets/components/InputWidget.tsx`
- `packages/client/src/widgets/components/ModalWidget.tsx`
- `packages/client/src/widgets/components/DrawerWidget.tsx`
- `packages/client/src/widgets/register.ts` (register new widgets)
- `packages/client/src/index.ts` (export new components)

## Out of Scope

- Backward compatibility / deprecation warnings
- Additional Input HTML attributes beyond min/max/step/pattern
- Drawer left-side support
- Checkbox indeterminate state
- Select grouped options
- Other layout widgets (Grid, Split, Group, Section, Column, Divider, Spacer, Table)
