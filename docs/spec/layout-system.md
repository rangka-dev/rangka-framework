# Layout system

> **Implemented**

The layout system defines how widgets occupy space on screen. It builds on CSS flexbox and grid. Every layout widget has defaults that produce a usable business app screen with zero configuration. Props let you escape to full control when needed.

## Principles

1. **Defaults that work.** A `grid` with no props renders 3 columns with standard gap. A `group` stacks vertically with medium spacing. You configure only what you need to change.
2. **Constraints flow through CSS.** The framework does not implement a custom layout engine. It maps declarative props to flexbox and grid utilities. The browser does the math.
3. **Universal layout props.** Any widget can accept positioning props (`flex`, `span`, `align`, `width`) that control how it behaves inside its parent container.
4. **Spacing is tokenized.** All spacing uses a fixed scale. No arbitrary pixel values in page definitions.
5. **Responsive by default.** Grid columns collapse on smaller viewports. Explicit breakpoint overrides are available but rarely needed.

---

## Spacing tokens

All spacing props accept token names. These map to a 4px base grid.

| Token  | Value | Tailwind |
| ------ | ----- | -------- |
| `none` | 0     | `0`      |
| `xs`   | 4px   | `1`      |
| `sm`   | 8px   | `2`      |
| `md`   | 16px  | `4`      |
| `lg`   | 24px  | `6`      |
| `xl`   | 32px  | `8`      |
| `2xl`  | 48px  | `12`     |

Gap, padding, and margin all use this scale.

---

## Universal layout props

These props can appear on any widget. They control how the widget positions itself within its parent layout container.

| Prop        | Type             | Default | Description                                                                                         |
| ----------- | ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `flex`      | number or string | —       | Flex grow factor inside a group parent. `1` fills remaining space. `"0 0 300px"` is explicit basis. |
| `span`      | number           | 1       | Column span inside a grid parent.                                                                   |
| `rowSpan`   | number           | 1       | Row span inside a grid parent.                                                                      |
| `align`     | enum             | —       | Self-alignment override: `start`, `center`, `end`, `stretch`.                                       |
| `width`     | string           | —       | Explicit width: `"100%"`, `"300px"`, `"auto"`.                                                      |
| `height`    | string           | —       | Explicit height.                                                                                    |
| `minWidth`  | string           | —       | Minimum width constraint.                                                                           |
| `maxWidth`  | string           | —       | Maximum width constraint.                                                                           |
| `minHeight` | string           | —       | Minimum height constraint.                                                                          |
| `maxHeight` | string           | —       | Maximum height constraint.                                                                          |
| `scroll`    | enum             | —       | Makes this widget a scroll container: `auto`, `vertical`, `horizontal`.                             |
| `padding`   | token            | —       | All-side padding.                                                                                   |
| `paddingX`  | token            | —       | Horizontal padding. Overrides `padding` on x-axis.                                                  |
| `paddingY`  | token            | —       | Vertical padding. Overrides `padding` on y-axis.                                                    |
| `margin`    | token            | —       | All-side margin.                                                                                    |
| `marginX`   | token            | —       | Horizontal margin.                                                                                  |
| `marginY`   | token            | —       | Vertical margin.                                                                                    |
| `hidden`    | breakpoint       | —       | Hide at breakpoint: `sm`, `md`, `lg`. For responsive layouts.                                       |

The renderer wraps any widget that has universal layout props in a layout wrapper div. Widgets without these props render without a wrapper.

---

## Layout containers

### group

Flexbox container. The most common layout widget.

| Prop        | Type                                          | Default   |
| ----------- | --------------------------------------------- | --------- |
| `direction` | `row` or `column`                             | `column`  |
| `gap`       | spacing token                                 | `md`      |
| `align`     | `start`, `center`, `end`, `stretch`           | `stretch` |
| `justify`   | `start`, `center`, `end`, `between`, `around` | `start`   |
| `wrap`      | boolean                                       | `false`   |
| `padding`   | spacing token                                 | —         |
| `paddingX`  | spacing token                                 | —         |
| `paddingY`  | spacing token                                 | —         |

Children use `flex` to claim proportional space:

```yaml
- type: group
  props: { direction: row, gap: md }
  children:
    - type: card
      props: { flex: 2 }
    - type: card
      props: { flex: 1 }
```

The first card takes 2/3 of the row. The second takes 1/3.

### grid

CSS grid container. Best for uniform card layouts and form fields.

| Prop       | Type                     | Default |
| ---------- | ------------------------ | ------- |
| `columns`  | number                   | `3`     |
| `rows`     | number or `auto`         | `auto`  |
| `gap`      | spacing token            | `md`    |
| `rowGap`   | spacing token            | —       |
| `colGap`   | spacing token            | —       |
| `padding`  | spacing token            | —       |
| `paddingX` | spacing token            | —       |
| `paddingY` | spacing token            | —       |
| `autoFlow` | `row`, `column`, `dense` | `row`   |

Responsive behavior: the grid automatically reduces columns on smaller viewports.

| Viewport   | Columns (default 3) |
| ---------- | ------------------- |
| >= 1024px  | 3                   |
| 768–1023px | 2                   |
| < 768px    | 1                   |

Override with explicit responsive columns:

```yaml
- type: grid
  props: { columns: 4, columns@md: 2, columns@sm: 1 }
```

Children use `span` to stretch across columns:

```yaml
- type: grid
  props: { columns: 3 }
  children:
    - type: card
      props: { span: 2 }
    - type: card
    - type: card
      props: { span: 3 }
```

### split

Resizable panel layout. Two or more panes with drag handles between them.

| Prop        | Type                       | Default      |
| ----------- | -------------------------- | ------------ |
| `direction` | `horizontal` or `vertical` | `horizontal` |
| `sizes`     | number[]                   | equal split  |
| `minSize`   | number                     | `100`        |
| `padding`   | spacing token              | —            |

Sizes are percentages. A two-child split with `sizes: [70, 30]` gives 70% to the first pane and 30% to the second.

```yaml
- type: split
  props: { sizes: [60, 40] }
  children:
    - type: table
      bind: { model: { name: 'sales.order' } }
    - type: group
      children:
        - type: input
          bind: { field: 'name' }
```

### section

Collapsible container with a heading. Groups related content visually.

| Prop               | Type          | Default  |
| ------------------ | ------------- | -------- |
| `label`            | string        | required |
| `collapsible`      | boolean       | `false`  |
| `defaultCollapsed` | boolean       | `false`  |
| `padding`          | spacing token | `md`     |
| `icon`             | string        | —        |

```yaml
- type: section
  props: { label: 'Shipping Details', collapsible: true }
  children:
    - type: grid
      props: { columns: 2 }
      children:
        - type: input
          bind: { field: 'address' }
        - type: input
          bind: { field: 'city' }
```

### stack

Z-axis layering container. Children position absolutely within the stack bounds.

| Prop      | Type          | Default |
| --------- | ------------- | ------- |
| `height`  | string        | `auto`  |
| `padding` | spacing token | —       |

Children use positional props:

```yaml
- type: stack
  props: { height: '200px' }
  children:
    - type: image
      props: { src: '...' }
    - type: badge
      props: { position: 'top-right', label: 'New' }
```

Stack is rarely needed in business apps. It exists for dashboard overlays and positioned indicators.

### scroll-area

Scroll container with styled scrollbars. Wraps content that may exceed its allocated space.

| Prop        | Type                             | Default    |
| ----------- | -------------------------------- | ---------- |
| `direction` | `vertical`, `horizontal`, `both` | `vertical` |
| `height`    | string                           | —          |
| `maxHeight` | string                           | —          |

```yaml
- type: scroll-area
  props: { maxHeight: '400px' }
  children:
    - type: table
      bind: { model: { name: 'inventory.item' } }
```

---

## Page container

The shell wraps all page content in a standard container. This is not a widget. It is built into the shell layout.

Behavior:

- Full width (no max-width constraint). Business apps need horizontal space.
- Vertical scroll on the content area.
- Standard padding: `paddingX: lg`, `paddingY: md` on the content wrapper.

Pages that need a narrower container can wrap their body in a group with `maxWidth`:

```yaml
body:
  - type: group
    props: { maxWidth: '800px', marginX: auto }
    children: [...]
```

---

## CSS mapping

The renderer translates layout props to Tailwind utility classes. No custom CSS.

| Widget prop         | CSS output         |
| ------------------- | ------------------ |
| `direction: row`    | `flex-row`         |
| `direction: column` | `flex-col`         |
| `gap: md`           | `gap-4`            |
| `align: center`     | `items-center`     |
| `justify: between`  | `justify-between`  |
| `wrap: true`        | `flex-wrap`        |
| `columns: 3`        | `grid-cols-3`      |
| `span: 2`           | `col-span-2`       |
| `rowSpan: 2`        | `row-span-2`       |
| `flex: 1`           | `flex-1`           |
| `flex: 2`           | `flex-[2]`         |
| `flex: "0 0 300px"` | `flex-[0_0_300px]` |
| `scroll: vertical`  | `overflow-y-auto`  |
| `padding: lg`       | `p-6`              |
| `paddingX: md`      | `px-4`             |
| `width: "100%"`     | `w-full`           |
| `width: "300px"`    | `w-[300px]`        |
| `maxWidth: "800px"` | `max-w-[800px]`    |
| `hidden: sm`        | `sm:hidden`        |

---

## Common patterns

### List page

```yaml
body:
  - type: group
    props: { direction: column, gap: md, padding: lg }
    children:
      - type: group
        props: { direction: row, justify: between, align: center }
        children:
          - type: text
            props: { content: 'Sales Orders', variant: heading }
          - type: button
            props: { label: 'New Order', variant: primary }
            on: { click: { action: navigate, path: '/sales/orders/new' } }
      - type: table
        bind: { model: { name: 'sales.order' } }
        children:
          - type: column
            props: { label: 'Order #' }
            bind: { field: 'number' }
          - type: column
            props: { label: 'Customer' }
            bind: { field: 'customer_name' }
          - type: column
            props: { label: 'Total' }
            bind: { field: 'total' }
```

### Form page (two-column)

```yaml
body:
  - type: group
    props: { direction: column, gap: lg, padding: lg }
    children:
      - type: section
        props: { label: 'Basic Information' }
        children:
          - type: grid
            props: { columns: 2, gap: md }
            children:
              - type: input
                bind: { field: 'name' }
              - type: input
                bind: { field: 'email' }
              - type: input
                bind: { field: 'phone' }
              - type: select
                bind: { field: 'status' }
      - type: section
        props: { label: 'Address', collapsible: true }
        children:
          - type: grid
            props: { columns: 2, gap: md }
            children:
              - type: input
                props: { span: 2 }
                bind: { field: 'street' }
              - type: input
                bind: { field: 'city' }
              - type: input
                bind: { field: 'postal_code' }
```

### Dashboard

```yaml
body:
  - type: group
    props: { direction: column, gap: lg, padding: lg }
    children:
      - type: grid
        props: { columns: 4, gap: md }
        children:
          - type: stat-card
            props: { label: 'Revenue', value: '{{ $summary.revenue }}' }
          - type: stat-card
            props: { label: 'Orders', value: '{{ $summary.orders }}' }
          - type: stat-card
            props: { label: 'Customers', value: '{{ $summary.customers }}' }
          - type: stat-card
            props: { label: 'Returns', value: '{{ $summary.returns }}' }
      - type: grid
        props: { columns: 2, gap: md }
        children:
          - type: chart
            props: { type: line, title: 'Revenue trend' }
            bind: { model: { name: 'analytics.revenue' } }
          - type: chart
            props: { type: bar, title: 'Top products' }
            bind: { model: { name: 'analytics.products' } }
```

### Master-detail

```yaml
body:
  - type: split
    props: { sizes: [40, 60] }
    children:
      - type: group
        props: { direction: column, gap: sm }
        children:
          - type: input
            props: { placeholder: 'Search...' }
            bind: { field: '$filter.sales_order.search' }
          - type: scroll-area
            props: { height: '100%' }
            children:
              - type: repeat
                props: { layout: list }
                bind: { model: { name: 'sales.order' } }
                children:
                  - type: card
                    on:
                      {
                        click: { action: setValue, target: '$state.selectedId', value: '{{ id }}' },
                      }
                    children:
                      - type: text
                        bind: { field: 'number' }
                      - type: text
                        bind: { field: 'customer_name' }
      - type: data
        source: { model: 'sales.order', mode: record, id: '{{ $state.selectedId }}' }
        children:
          - type: group
            props: { direction: column, gap: md, padding: md }
            children:
              - type: input
                bind: { field: 'customer_name' }
              - type: input
                bind: { field: 'total' }
```

---

## Migration from UI components

Layout widgets previously delegated to dedicated components (Stack, Grid, Split, Section). The migration replaces these with direct Tailwind class generation.

| Current                 | New                                             |
| ----------------------- | ----------------------------------------------- |
| `<Stack direction gap>` | `<div className="flex flex-col gap-4">`         |
| `<Grid columns gap>`    | `<div className="grid grid-cols-3 gap-4">`      |
| `<Split>`               | shadcn `ResizablePanelGroup` + `ResizablePanel` |
| `<Section>`             | shadcn `Collapsible` + custom header            |
| `<Spacer size>`         | `<div className="h-4">` (utility div)           |
| `<Separator>`           | shadcn `Separator`                              |

The layout widgets will:

1. Accept the same props as today (backward compatible)
2. Add new props (flex, span, responsive columns, scroll)
3. Render Tailwind classes directly instead of delegating to UI components
4. Use shadcn primitives only where interactivity is needed (Collapsible, ResizablePanel, ScrollArea)

---

## Implementation order

1. Define the universal layout prop type in `@rangka/shared`
2. Build the layout prop resolver (maps props to Tailwind classes)
3. Refactor `GroupWidget` to render Tailwind directly (remove Stack dependency)
4. Refactor `GridWidget` to render Tailwind directly (add span, responsive columns)
5. Add `scroll-area` widget using shadcn ScrollArea
6. Refactor `SplitWidget` to use shadcn ResizablePanelGroup
7. Refactor `SectionWidget` to use shadcn Collapsible
8. Add `stack` widget
9. Update page container in ShellLayout with standard padding
10. Remove unused layout components
