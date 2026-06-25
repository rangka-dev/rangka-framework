# UIKit System

> **Status: Design**

## Overview

The UIKit system makes the client's visual layer swappable. The client becomes a pure orchestration engine (data, state, routing, binding, actions) with zero DOM rendering. All visual output is delegated to a UIKit — an object that maps widget types and shell slots to React components.

`@rangka/ui` ships the default UIKit. Community members can build alternative kits (Ant Design, Material UI, custom corporate design systems) that plug in without forking the framework.

## Goals

- Client produces zero DOM elements. Every visual pixel comes from the UIKit.
- Default experience requires zero frontend work. The pre-built shell uses `@rangka/ui` automatically.
- App developers can override individual widgets, the entire shell, or the whole kit.
- Custom widgets (`.rangka/` manifest) continue working in all modes.
- Community can publish third-party UIKit packages.

## Architecture

```
┌───────────────────────────────────────────────────────┐
│ @rangka/shared                                         │
│   UIKit interface, WidgetProps, ShellComponentProps    │
└────────────────────────┬──────────────────────────────┘
                         │ types only
┌────────────────────────▼──────────────────────────────┐
│ @rangka/client (orchestration engine)                  │
│   UIProvider (holds UIKit in React context)            │
│   WidgetRenderer (builds WidgetProps, resolves from    │
│     UIKit, never renders DOM)                          │
│   Hooks: useBind, useAction, useCondition, etc.       │
│   Router, boot, auth, data, state, form context       │
│   createApp() — public entry point                    │
└────────────────────────┬──────────────────────────────┘
                         │ runtime injection
┌────────────────────────▼──────────────────────────────┐
│ @rangka/ui (default UIKit)                            │
│   defaultKit: UIKit                                   │
│   38+ widget components (InputWidget, TableWidget...) │
│   Shell components (Layout, Sidebar, Breadcrumb...)   │
│   Built on Base UI + Tailwind v4 + CVA               │
└───────────────────────────────────────────────────────┘
```

### Dependency direction

```
@rangka/shared  ←  @rangka/client  ←  @rangka/ui (peer dep on client for data hooks)
```

The client never imports from `@rangka/ui`. It receives UIKit components as an object at bootstrap time. `@rangka/ui` peer-depends on `@rangka/client` because widget implementations use data hooks (`useModelQuery`, `useWidgetContext`, `useBind`).

## UIKit Contract

### Core interface

```typescript
// @rangka/shared/src/types/ui-kit.ts

import type { ComponentType, ReactNode } from 'react';
import type { WidgetProps } from './widget.js';

export type WidgetComponentMap = Record<string, ComponentType<WidgetProps>>;

export interface ShellComponents {
  Layout: ComponentType<ShellLayoutProps>;
  PageOutlet: ComponentType<PageOutletProps>;
  Toast: ComponentType<ToastProps>;
  ConfirmDialog: ComponentType<ConfirmDialogProps>;
  NotFound: ComponentType<object>;
  ModuleSelector: ComponentType<object>;
}

export interface UIKit {
  widgets: WidgetComponentMap;
  shell: ShellComponents;
}
```

### Shell component props

```typescript
// @rangka/shared/src/types/shell-contract.ts

export interface ShellLayoutProps {
  children: ReactNode;
}

export interface PageOutletProps {
  pageKey: string;
  children: ReactNode;
}

export interface ToastProps {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  onDismiss: () => void;
}

export interface ConfirmDialogProps {
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}
```

Shell components receive data and callbacks only. They access navigation, user, and permissions through the existing React contexts (`MetaContext`, `ModuleContext`, `UserContext`, `PermissionsContext`) which the client provides above the UIKit layer.

### WidgetProps (existing contract, unchanged)

```typescript
interface WidgetProps {
  props: Record<string, unknown>;
  bind: {
    value: unknown;
    setValue?: (val: unknown) => void;
    meta?: {
      type: string;
      label: string;
      required: boolean;
      options?: unknown[];
      readOnly: boolean;
    };
    error?: string;
    id?: string;
  };
  on: Record<string, (...args: unknown[]) => void>;
  context: {
    record: Record<string, unknown>;
    model: string;
    mode: 'view' | 'edit';
    index?: number;
  };
  childNodes?: WidgetNode[];
  children?: ReactNode;
}
```

Every widget in the UIKit receives this shape. The client builds it. The widget renders it. No negotiation.

## UIProvider

```typescript
// @rangka/client/src/ui/UIProvider.tsx

import { createContext, useContext } from 'react';
import type { UIKit } from '@rangka/shared';

const UIContext = createContext<UIKit | null>(null);

export function UIProvider({ kit, children }: { kit: UIKit; children: ReactNode }) {
  return <UIContext.Provider value={kit}>{children}</UIContext.Provider>;
}

export function useWidgetComponent(type: string): ComponentType<WidgetProps> | undefined {
  return useContext(UIContext)?.widgets[type];
}

export function useShell(): ShellComponents {
  return useContext(UIContext)!.shell;
}
```

## Widget Resolution

The `WidgetRenderer` changes from static registry lookup to context-based resolution.

**Before:**

```typescript
const widgetEntry = getWidget(node.type);
const Component = widgetEntry.component;
```

**After:**

```typescript
const Component = useWidgetComponent(node.type);
if (!Component) {
  return <LazyWidget name={node.type} {...widgetProps} />;
}
```

Resolution order:

1. UIKit context map (synchronous, for all kit-provided widgets)
2. LazyWidget fallback (async, for custom widgets loaded from `.rangka/` manifest)

Everything else in `WidgetRenderer` stays the same: binding resolution, expression evaluation, condition checks, layout prop extraction, context building, error boundaries.

## Shell Resolution

```typescript
// In the route tree builder
function RootLayout() {
  const { Layout } = useShell();
  return <Layout><Outlet /></Layout>;
}

function PageRoute({ pageKey }: { pageKey: string }) {
  const { PageOutlet } = useShell();
  return (
    <PageOutlet pageKey={pageKey}>
      <WidgetSlotRenderer nodes={page.widgets} />
    </PageOutlet>
  );
}
```

Shell implementations access navigation and user data from existing contexts. The client provides data contexts above the shell. The shell renders them however it wants.

## Entry Point

### createApp (public API)

```typescript
// @rangka/client — public export

export function createApp(options: { ui: UIKit; el?: HTMLElement }) {
  const root = createRoot(options.el ?? document.getElementById('root')!);
  root.render(
    <UIProvider kit={options.ui}>
      <App />
    </UIProvider>
  );
}
```

### Default pre-built shell (Mode 1)

The published `@rangka/client/dist/shell/` already calls:

```typescript
import { defaultKit } from '@rangka/ui';
createApp({ ui: defaultKit });
```

App developers using the default flow never see this. They write models and pages. CLI serves the pre-built dist.

### Custom entry point (Mode 2)

App developer creates their own frontend project:

```typescript
import { createApp } from '@rangka/client';
import { defaultKit } from '@rangka/ui';
import { MyLayout } from './shell/Layout';
import { MyTable } from './widgets/Table';

createApp({
  ui: {
    ...defaultKit,
    shell: { ...defaultKit.shell, Layout: MyLayout },
    widgets: { ...defaultKit.widgets, table: MyTable },
  },
});
```

They build their own dist. Configure CLI to serve it:

```yaml
# rangka.config.yaml
shell: ./my-frontend/dist
```

## Usage Modes

| Mode             | Who           | What they do                                    | Build step                 |
| ---------------- | ------------- | ----------------------------------------------- | -------------------------- |
| Default          | Most users    | Write models, pages, hooks. No frontend code.   | None (pre-built shell)     |
| Custom widgets   | Intermediate  | Add custom widget types via `.rangka/` manifest | Build custom widget chunks |
| Partial override | Advanced      | Override specific widgets or shell components   | Own frontend build         |
| Full replacement | Power user    | Provide entire UIKit from scratch               | Own frontend build         |
| Backend only     | Frontend devs | Use hooks SDK, build own app entirely           | Own app, no widget system  |

## Custom Widgets Compatibility

The existing custom widget mechanism (`.rangka/manifest.json` + async chunk loading) works in all modes. Custom widgets are resolved via `LazyWidget` when not found in the UIKit map. This means:

- Default mode: custom widgets load async, built-in widgets from `defaultKit`
- Override mode: overridden widgets from custom kit, custom widgets still load async
- Both coexist without conflict

## What the Client Provides (Orchestration)

| Concern                            | What it does                                                      |
| ---------------------------------- | ----------------------------------------------------------------- |
| `WidgetRenderer`                   | Builds WidgetProps from WidgetNode, resolves component from UIKit |
| `useBind`                          | Resolves field binding to value + setValue + meta + error         |
| `useTriggerHandlers`               | Wraps action definitions into callable handlers                   |
| `useCondition`                     | Evaluates visibility conditions                                   |
| `useWidgetContext`                 | Widget context hierarchy (record, model, mode)                    |
| `usePageState`                     | Page-level state store ($filter, $sort, $page, $search)           |
| `useModelQuery` / `useModelRecord` | Data fetching via TanStack Query                                  |
| `useMutation`                      | CRUD operations                                                   |
| `FormContext` / `FormProvider`     | Form state, validation, submission                                |
| Expression engine                  | Parse and evaluate `{{expressions}}` in widget props              |
| Action dispatcher                  | Execute widget actions (navigate, setValue, service, CRUD)        |
| Router                             | Dynamic route building from page definitions                      |
| Boot sequence                      | Fetch metadata, build app state                                   |
| Auth                               | JWT tokens, login flow, session management                        |
| `UIProvider`                       | React context holding the UIKit                                   |
| `createApp()`                      | Public entry point wiring everything together                     |

## What the UIKit Provides (Rendering)

| Concern                 | What it does                              |
| ----------------------- | ----------------------------------------- |
| Widget components (38+) | Receive WidgetProps, produce DOM          |
| Shell Layout            | App frame (sidebar, header, content area) |
| PageOutlet              | Page wrapper (padding, animation, scroll) |
| Toast                   | Notification rendering                    |
| ConfirmDialog           | Confirmation modal rendering              |
| NotFound                | 404 page                                  |
| ModuleSelector          | Module selection screen                   |

## Widget Implementation Pattern

A widget inside a UIKit looks like this:

```typescript
// @rangka/ui/src/widgets/InputWidget.tsx

import type { WidgetProps } from '@rangka/shared';
import { Field } from '../form/field.js';
import { Input } from '../primitives/input.js';

export function InputWidget({ props, bind, on }: WidgetProps) {
  return (
    <Field.Root>
      {props.label && <Field.Label>{props.label as string}</Field.Label>}
      <Input
        value={(bind.value as string) ?? ''}
        onChange={(e) => {
          bind.setValue?.(e.target.value);
          on.change?.(e.target.value);
        }}
        placeholder={props.placeholder as string}
        disabled={props.disabled as boolean}
      />
      {bind.error && <Field.Error>{bind.error}</Field.Error>}
    </Field.Root>
  );
}
```

A widget in a third-party UIKit using Ant Design:

```typescript
// @my-org/rangka-antd/src/widgets/InputWidget.tsx

import type { WidgetProps } from '@rangka/shared';
import { Form, Input } from 'antd';

export function InputWidget({ props, bind, on }: WidgetProps) {
  return (
    <Form.Item
      label={props.label as string}
      validateStatus={bind.error ? 'error' : undefined}
      help={bind.error}
    >
      <Input
        value={(bind.value as string) ?? ''}
        onChange={(e) => {
          bind.setValue?.(e.target.value);
          on.change?.(e.target.value);
        }}
        placeholder={props.placeholder as string}
        disabled={props.disabled as boolean}
      />
    </Form.Item>
  );
}
```

Same contract, completely different rendering.

## defaultKit Export

```typescript
// @rangka/ui/src/kit.ts

import type { UIKit } from '@rangka/shared';
import { InputWidget } from './widgets/InputWidget.js';
import { TableWidget } from './widgets/TableWidget.js';
import { CardWidget } from './widgets/CardWidget.js';
// ... all widget imports

import { ShellLayout } from './shell/Layout.js';
import { PageOutlet } from './shell/PageOutlet.js';
import { Toast } from './shell/Toast.js';
import { ConfirmDialog } from './shell/ConfirmDialog.js';
import { NotFound } from './shell/NotFound.js';
import { ModuleSelector } from './shell/ModuleSelector.js';

export const defaultKit: UIKit = {
  widgets: {
    input: InputWidget,
    button: ButtonWidget,
    select: SelectWidget,
    table: TableWidget,
    card: CardWidget,
    group: GroupWidget,
    grid: GridWidget,
    stack: StackWidget,
    section: SectionWidget,
    form: FormWidget,
    data: DataWidget,
    repeat: RepeatWidget,
    modal: ModalWidget,
    drawer: DrawerWidget,
    datagrid: DatagridWidget,
    // ... all 38+ widgets
  },
  shell: {
    Layout: ShellLayout,
    PageOutlet,
    Toast,
    ConfirmDialog,
    NotFound,
    ModuleSelector,
  },
};
```

## Complex Widget Split Pattern

Not all widgets are simple "props in, DOM out." Complex widgets need framework hooks (`useModelQuery`, `usePageState`, `WidgetContextProvider`) for data fetching, state management, and context injection. These widgets use a split pattern: orchestration stays in client, presentation is swappable via UIKit.

### Widget Classification

| Type                                                           | Count | Where logic lives | UIKit provides                                      |
| -------------------------------------------------------------- | ----- | ----------------- | --------------------------------------------------- |
| Simple (Button, Input, Badge, Text, etc.)                      | 20    | UIKit only        | Full component via `WidgetProps`                    |
| Medium with local state (DatePicker, Link, Money, etc.)        | 11    | UIKit only        | Full component via `WidgetProps`                    |
| Orchestrated (Table, Form, Data, Repeat, Modal, Drawer, Split) | 7     | Client            | Presentation shell via typed props                  |
| Complex (Datagrid)                                             | 1     | Client            | Presentation shell via typed props (larger surface) |

### How the Split Works

For complex widgets, the client widget implementation:

1. Calls framework hooks (data fetching, state management)
2. Resolves a presentation component from the UIKit
3. Passes resolved data + callbacks + render functions to the UI component

The UI component:

1. Receives pre-resolved data (rows, columns, loading state, sort, pagination)
2. Receives callbacks (onSort, onPageChange, onRowClick)
3. Receives `renderCell` / `renderChildren` for nested framework content
4. Renders the visual structure using only what it received
5. Never imports from `@rangka/client`

### Example: Table Widget

**Client (orchestration):**

```typescript
// packages/client/src/widgets/components/TableWidget.tsx

export function TableWidget({ props, on }: WidgetProps) {
  const ctx = useWidgetContext();
  const store = usePageState();
  const Table = useUIComponent('Table');

  const source = useModelQuery({ model: ctx.model, pageSize: props.pageSize ?? 20 });
  const records = source.data;

  const handleSort = (field: string) => { store.set(`$sort.${model}`, ...); };
  const handlePageChange = (page: number) => { store.set(`$page.${model}`, page); };

  const renderCell = (row, col, rowIndex) => (
    <WidgetContextProvider value={buildRowContext(row, rowIndex, ctx)}>
      <CellRenderer col={col} row={row} />
    </WidgetContextProvider>
  );

  return (
    <Table
      columns={tableColumns}
      rows={records}
      loading={source.isLoading}
      sort={source.sort}
      page={source.page}
      total={source.total}
      onSort={handleSort}
      onPageChange={handlePageChange}
      onRowClick={on.rowClick}
      renderCell={renderCell}
    />
  );
}
```

**UI (presentation):**

```typescript
// packages/ui/src/data/table.tsx

export interface TableProps {
  columns: { key: string; label: string; width?: string; align?: string; sortable?: boolean }[];
  rows: Record<string, unknown>[];
  loading?: boolean;
  fetching?: boolean;
  sort?: { field: string; direction: 'asc' | 'desc' } | null;
  page?: number;
  pageSize?: number;
  total?: number;
  variant?: 'card' | 'flat';
  selectable?: boolean;
  striped?: boolean;
  emptyText?: string;
  onSort?: (field: string) => void;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: Record<string, unknown>) => void;
  renderCell: (row: Record<string, unknown>, col: TableColumn, rowIndex: number) => ReactNode;
  toolbar?: ReactNode;
}

export function Table({ columns, rows, loading, sort, renderCell, ... }: TableProps) {
  // Pure visual rendering — headers, rows, skeleton, empty state, pagination
  // Uses @rangka/ui primitives (Skeleton, Button, Icon)
  // No imports from @rangka/client
}
```

### The renderCell Bridge

The `renderCell` callback bridges framework context into the UI component. The client provides it, the UI calls it for each cell:

```
Client builds renderCell:
  - Wraps row in WidgetContextProvider (framework concern)
  - Resolves expressions, renders child widgets
  - Returns ReactNode

UI's Table component:
  - Iterates rows and columns
  - Calls renderCell(row, col, index) for each cell
  - Renders the returned ReactNode inside <td>
  - Never knows about contexts or expressions
```

This means community kit authors implementing a custom Table only need to:

- Render table structure (headers, rows, cells)
- Call `renderCell` for each cell to get content
- Handle sort indicators, pagination controls, loading states

No framework knowledge required.

### Testing

The split enables independent testing:

- **UI components** are tested in Storybook with plain props. No mocking needed.
- **Client widgets** are tested by mocking the UI component and asserting on passed props. Logic-only tests.
- `@rangka/client` exports a `TestProvider` for UI package tests that need realistic data contexts.

### What Community Kit Authors Implement

| Widget type                | Contract                                      | Effort                                 |
| -------------------------- | --------------------------------------------- | -------------------------------------- |
| Simple/Medium (31 widgets) | `WidgetProps → ReactNode`                     | Easy to medium                         |
| Orchestrated (7 widgets)   | Typed presentation props (e.g., `TableProps`) | Medium                                 |
| Complex (Datagrid)         | Same as orchestrated but larger props surface | Hard, or cherry-pick from `@rangka/ui` |

For the Datagrid specifically, community kit authors can:

1. Cherry-pick from `@rangka/ui` (reuse the default)
2. Bring their own (e.g., AG Grid wrapper satisfying `DatagridProps`)
3. Skip it (not all apps need inline grid editing)

## Layout Wrapper

The `WidgetRenderer` currently wraps every widget in a `<div>` for layout props and data attributes. This wrapper stays in the client because:

- `data-rangka-*` attributes are dev tooling, not visual
- Layout class resolution (flex, span, padding) is orchestration of constraints
- The wrapper is structural, not styled. It uses Tailwind utilities for layout only.

This is the one place the client produces a DOM element. It's a framework-structural div, not a UI component.

## Relation to Other Specs

| Spec                     | Relation                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------- |
| `ui-package.md`          | Defines the component library that implements the default UIKit                     |
| `theming-system.md`      | Tokens apply to whichever UIKit is active. CSS variables cascade regardless of kit. |
| `widget-system-v2.md`    | Defines WidgetNode/WidgetProps which are the UIKit contract inputs                  |
| `custom-widget-build.md` | Custom widgets coexist with UIKit via LazyWidget fallback                           |

## Implementation Sequence

1. Complete `@rangka/ui` component library (current work — RAN-27)
2. Add `UIKit`, `ShellComponents`, `WidgetComponentMap` types to `@rangka/shared`
3. Move `WidgetProps` canonical definition to `@rangka/shared` (re-export from client)
4. Create `UIProvider` + hooks in client
5. Create `defaultKit` export in `@rangka/ui` (wrap existing components)
6. Move widget implementations from client to `@rangka/ui`
7. Update `WidgetRenderer` to resolve from UIProvider
8. Update route builder to resolve shell from UIProvider
9. Wire `createApp()` as public entry point
10. Delete `client/src/components/ui/` and `client/src/widgets/components/`
11. Add `shell` config option to CLI for custom dist paths
12. Document both modes for app developers

## Out of Scope

- Hooks SDK (exporting data hooks for "backend only" mode). Separate spec.
- Per-field type renderers (cell formatters for tables). Handled within widget implementations.
- Visual editor integration. The editor operates on WidgetNode data, not on UIKit components.
- Server-side rendering. The client is a SPA.
