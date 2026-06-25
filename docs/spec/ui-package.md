# @rangka/ui — Design System Package

## Overview

Extract all visual rendering from `packages/client` into a standalone `@rangka/ui` package. The client becomes a headless orchestration layer (hooks, state, routing, context). All DOM rendering with classnames lives in `@rangka/ui`.

The visual identity is inspired by Plane.so — clean, modern, information-dense enough for business tools. Exact style tokens will be designed separately.

## Package Architecture

### Dependency Graph

```
shared ← ui ← client
shared ← core ← cli
shared ← studio-core ← studio-local
```

### What `@rangka/ui` Owns

- All visual rendering (every component that outputs DOM with classnames)
- Tailwind v4 + CVA for styling
- Base UI as headless accessibility/behavior layer
- TanStack Table + Virtual (DataTable/Datagrid)
- Lucide icons
- react-day-picker, cmdk, vaul, embla-carousel
- Design tokens (CSS variables)
- Inter font
- Storybook (dev dependency)

### What `client` Keeps

- Widget orchestration (WidgetRenderer, LazyWidget, error boundary)
- Hooks (useBind, useAction, useCondition, useTriggerHandlers)
- Data layer (useModelQuery, useModelRecord, useMutation, QueryProvider)
- Form logic (FormContext, FormProvider, validation, submission)
- State management (StateStore, reactive variables)
- Routing (TanStack Router, dynamic route builder)
- Auth flow (login, session, tokens)
- Boot sequence (BootProvider, BootGate)
- Context providers (Meta, Permissions, User)
- Action dispatcher

### Boundary Rule

If it renders a DOM element with visual styling, it belongs in `@rangka/ui`. If it manages state, data, or orchestration, it stays in `client`. Zero Tailwind classnames in the client package.

## Package Structure

```
packages/ui/
  src/
    primitives/
      button.tsx
      input.tsx
      textarea.tsx
      select.tsx
      combobox.tsx
      checkbox.tsx
      radio-group.tsx
      toggle.tsx
      badge.tsx
      icon.tsx
      label.tsx
      avatar.tsx
      kbd.tsx
      skeleton.tsx
      slider.tsx
      progress.tsx
    layout/
      stack.tsx
      grid.tsx
      split.tsx
      card.tsx
      section.tsx
      scroll-area.tsx
      divider.tsx
      spacer.tsx
      group.tsx
    shell/
      shell.tsx
      sidebar.tsx
      topbar.tsx
      page-container.tsx
      breadcrumbs.tsx
      navigation.tsx
      command-palette.tsx
    data/
      data-table.tsx
      datagrid.tsx
      column.tsx
      cell-editors/
        text-editor.tsx
        number-editor.tsx
        date-editor.tsx
        checkbox-editor.tsx
        combobox-editor.tsx
    overlays/
      modal.tsx
      drawer.tsx
      popover.tsx
      dropdown-menu.tsx
      context-menu.tsx
      tooltip.tsx
      sheet.tsx
    feedback/
      toast.tsx
      spinner.tsx
      empty.tsx
      alert.tsx
    form/
      field.tsx
      form-field.tsx
      input-group.tsx
    tokens/
      index.css
      colors.css
      spacing.css
      typography.css
      animations.css
    lib/
      cn.ts
    index.ts
  stories/
    primitives/
    layout/
    shell/
    data/
    overlays/
    feedback/
    form/
  .storybook/
    main.ts
    preview.ts
  package.json
  tsconfig.json
  vite.config.ts
```

## Component API Patterns

### Composition Pattern

All components with distinct structural sections use the composition pattern. Sub-components are attached as static properties on the root component.

Rules:

- Root component provides shared context (state, refs, accessibility)
- Sub-components access parent context via React context internally
- Sub-components are static properties (e.g., `Select.Item`, not `SelectItem`)
- Primitives that don't need composition stay simple (`Button`, `Input`, `Badge`)
- Introduce composition only when a component has distinct structural sections or variable children

### Primitives

Thin wrappers over Base UI with Tailwind + CVA styling. Accept standard props plus variant/size.

```typescript
import { Button, Input } from '@rangka/ui'

<Button variant="primary" size="sm">Save</Button>
<Input value={val} onChange={setVal} placeholder="Search..." />
```

### Form Composites

Compose label, input slot, error, and description via sub-components.

```typescript
import { FormField, Input, InputGroup } from '@rangka/ui'

<FormField>
  <FormField.Label required>Email</FormField.Label>
  <FormField.Description>We'll never share your email.</FormField.Description>
  <Input value={val} onChange={setVal} />
  <FormField.Error>{error}</FormField.Error>
</FormField>

<FormField>
  <FormField.Label>Amount</FormField.Label>
  <InputGroup prefix="USD">
    <Input value={val} onChange={setVal} />
  </InputGroup>
  <FormField.Error>{error}</FormField.Error>
</FormField>
```

### Select (Composition)

```typescript
import { Select } from '@rangka/ui'

<Select value={val} onValueChange={setVal}>
  <Select.Trigger placeholder="Choose status..." />
  <Select.Content>
    <Select.Group label="Active">
      <Select.Item value="open">Open</Select.Item>
      <Select.Item value="in_progress">In Progress</Select.Item>
    </Select.Group>
  </Select.Content>
</Select>
```

### Layout

Declarative props, no classnames in consumer.

```typescript
import { Stack, Grid, Card } from '@rangka/ui'

<Stack gap="md" direction="vertical">
  <Card padding="lg">
    <Grid columns={3} gap="sm">
      {children}
    </Grid>
  </Card>
</Stack>
```

### Shell

Receives data and callbacks, handles all rendering.

```typescript
import { Sidebar } from '@rangka/ui'

<Sidebar>
  <Sidebar.Header>
    <Sidebar.Logo src={logo} />
    <Sidebar.OrgSwitcher orgs={orgs} current={org} onChange={setOrg} />
  </Sidebar.Header>
  <Sidebar.Nav>
    <Sidebar.Section label="Sales">
      <Sidebar.Item icon="receipt" active={isActive} onClick={nav}>
        Invoices
      </Sidebar.Item>
    </Sidebar.Section>
  </Sidebar.Nav>
  <Sidebar.Footer>
    <Sidebar.UserMenu user={user} onLogout={logout} />
  </Sidebar.Footer>
</Sidebar>
```

### DataTable (Composition)

```typescript
import { DataTable } from '@rangka/ui'

<DataTable data={rows} loading={isLoading}>
  <DataTable.Toolbar>
    <DataTable.Search value={search} onChange={setSearch} />
    <DataTable.Filter column="status" options={statusOptions} />
  </DataTable.Toolbar>

  <DataTable.Column accessor="name" header="Name" sortable />
  <DataTable.Column accessor="status" header="Status">
    {(value) => <Badge variant={value}>{value}</Badge>}
  </DataTable.Column>

  <DataTable.Pagination
    page={page}
    pageSize={pageSize}
    total={total}
    onPageChange={setPage}
  />
</DataTable>
```

### Modal (Composition)

```typescript
import { Modal } from '@rangka/ui'

<Modal open={isOpen} onOpenChange={setOpen}>
  <Modal.Header>
    <Modal.Title>Confirm Delete</Modal.Title>
    <Modal.Description>This action cannot be undone.</Modal.Description>
  </Modal.Header>
  <Modal.Body>
    {content}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="ghost" onClick={close}>Cancel</Button>
    <Button variant="destructive" onClick={confirm}>Delete</Button>
  </Modal.Footer>
</Modal>
```

## Design Tokens

Tokens are pure CSS variables. No JS runtime needed to consume them.

```
tokens/
  index.css         — imports all token files
  colors.css        — semantic color tokens (primary, muted, destructive, etc.)
  spacing.css       — spacing scale (xs, sm, md, lg, xl, 2xl)
  typography.css    — font family, sizes, weights, line heights
  animations.css    — keyframes and transition tokens
```

Color system uses OKLch color space for perceptually uniform light/dark modes. Exact values TBD in a separate design pass.

## Client Widget Example (After Migration)

```typescript
// packages/client/src/widgets/components/InputWidget.tsx
// Zero classnames, zero visual rendering
import { FormField, Input } from '@rangka/ui'

export function InputWidget({ props, bind, on, error }: WidgetRenderProps) {
  return (
    <FormField>
      {props.label && <FormField.Label required={props.required}>{props.label}</FormField.Label>}
      <Input
        value={bind.value}
        onChange={(val) => { bind.setValue?.(val); on.change?.(val); }}
        onFocus={() => on.focus?.()}
        onBlur={() => on.blur?.()}
        placeholder={props.placeholder}
        disabled={props.disabled}
      />
      {error && <FormField.Error>{error}</FormField.Error>}
    </FormField>
  )
}
```

## Migration Strategy

### Phase 1: Build `@rangka/ui` in Isolation

- Create `packages/ui` with the full directory structure
- Rebuild all visual components on Base UI + Tailwind + CVA
- Apply composition patterns to all multi-section components
- Add Storybook stories for every component
- Set up design tokens in CSS variables
- Verify all components work independently in Storybook

### Phase 2: Map Every Visual Element in Client

Before touching the client, produce a complete mapping:

| Client file                                | UI imports needed                     |
| ------------------------------------------ | ------------------------------------- |
| `widgets/components/InputWidget.tsx`       | `FormField`, `Input`                  |
| `widgets/components/SelectWidget.tsx`      | `FormField`, `Select`, sub-components |
| `widgets/components/table/TableWidget.tsx` | `DataTable`, sub-components           |
| `shell/Sidebar.tsx`                        | `Sidebar`, sub-components             |
| ...                                        | ...                                   |

This mapping ensures `@rangka/ui` covers 100% of what the client needs before any swap begins.

### Phase 3: Swap Client to Consume `@rangka/ui`

- Remove `client/src/components/ui/` entirely
- Rewrite each widget component to import from `@rangka/ui`
- Remove all Tailwind classes from client
- Remove all UI-related dependencies from client's `package.json`
- Verify zero remaining classnames in client source

### Phase 4: Cleanup

- Remove unused CSS from client
- Remove Tailwind config from client (or keep minimal if needed for token consumption)
- Verify the full monorepo build passes
- Run all tests

## Technical Decisions

| Decision           | Choice                              | Rationale                                                  |
| ------------------ | ----------------------------------- | ---------------------------------------------------------- |
| Headless base      | Base UI                             | Full control over styling, good a11y, no shadcn opinions   |
| Styling            | Tailwind v4 + CVA                   | Already used, familiar, fast DX                            |
| Component pattern  | Composition (static sub-components) | Cleaner API, manageable, flexible                          |
| Storybook location | Inside `packages/ui`                | Self-contained, stories next to components                 |
| Color space        | OKLch                               | Perceptually uniform light/dark modes                      |
| Font               | Inter Variable                      | Already used, good for data-dense UIs                      |
| Table internals    | TanStack Table + Virtual            | Already proven in current datagrid, handles virtualization |
| Icon library       | Lucide                              | Already used, consistent, tree-shakeable                   |
| Visual direction   | Plane.so-inspired                   | Clean, modern, business-tool appropriate                   |

## Build and Consumption

- `@rangka/ui` compiles to ESM via Vite library mode
- Exports TypeScript declarations (`.d.ts`) for type safety
- `client` imports from `@rangka/ui` as a workspace dependency (pnpm workspace protocol)
- Tailwind classes are compiled within the UI package — client does not need Tailwind configured
- Tokens CSS is exported as a standalone file that client (or any consumer) imports: `import '@rangka/ui/tokens.css'`
- Storybook uses the source directly (no build step needed for dev)

## Out of Scope

- Exact color values, spacing scale values, and typography scale (separate design pass)
- Visual redesign of individual pages or workflows
- New widget types
- Changes to widget definition API (`defineWidget`, `widget.*` helpers)
- Changes to `@rangka/shared` types
