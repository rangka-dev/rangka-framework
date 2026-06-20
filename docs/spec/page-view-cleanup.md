# Page & View System Spec — ✅ Implemented

A clean foundation for the page and view system. Removes all opinionated built-in views and the `custom` page type. Establishes `canvas` as the single built-in view. Opinionated views (table, form, kanban, etc.) will be specified and added separately later.

## Goals

1. Pages are structural. They handle routing, layout, and panel arrangement. No content logic.
2. Views are the content layer. A view declares slots. Widgets fill those slots.
3. Start with one built-in view: `canvas`. A blank slate with a single `body` slot.
4. The widget system (already implemented) is the primary composition primitive.
5. No legacy drift. Remove all opinionated views so future implementations start clean.

## Principles

- A page does not know about widgets. It knows about panels and which view fills each panel.
- A view does not know about pages. It declares slots and renders widget trees placed in those slots.
- Widgets are the universal building block. Everything visible inside a view is a widget tree.
- Opinionated views (when added later) are convenience layers. They auto-render from model metadata but still expose slots for customization. They follow the same `defineView()` contract as canvas.

---

## 1. Page Types

Three page types. Each defines the data context available to views within its panels.

| Type         | Context                              | URL Pattern          |
| ------------ | ------------------------------------ | -------------------- |
| `collection` | List of records from a model         | `/:module/:page`     |
| `record`     | Single record (by ID)                | `/:module/:page/:id` |
| `dashboard`  | No single record. Panels independent | `/:module/:page`     |

The `custom` type is removed. Any "custom" screen is a `dashboard` with canvas views.

```typescript
type PageType = 'collection' | 'record' | 'dashboard';
```

---

## 2. definePage() API

```typescript
interface PageDefinition {
  key: string;
  label: string;
  type: PageType;
  path?: string;
  layout?: 'full' | 'split' | 'dashboard';
  actions?: Action[];
  panels: Record<string, PanelDefinition>;
  drawer?: DrawerDefinition;
}
```

### Fields

| Field     | Type                               | Required | Description                                  |
| --------- | ---------------------------------- | -------- | -------------------------------------------- |
| `key`     | string                             | yes      | Unique identifier (`module.name`)            |
| `label`   | string                             | yes      | Display name for nav, breadcrumbs, tab title |
| `type`    | PageType                           | yes      | Data context type                            |
| `path`    | string                             | no       | Custom route path. Auto-generated if omitted |
| `layout`  | `'full' \| 'split' \| 'dashboard'` | no       | How content area divides. Default: `full`    |
| `actions` | Action[]                           | no       | Topbar action buttons                        |
| `panels`  | Record<string, PanelDefinition>    | yes      | Named content regions                        |
| `drawer`  | DrawerDefinition                   | no       | Right-docked push panel                      |

### Layouts

**full** — One panel takes all available space.

**split** — Two panels side by side. First declared is left, second is right.

**dashboard** — 4-column grid. Each panel declares `size` (1-4) for column span.

---

## 3. Panels

A panel is a named slot in the layout. It holds a view and passes widget trees into that view's slots.

```typescript
interface PanelDefinition {
  view: string;
  source?: Source;
  config?: Record<string, unknown>;
  size?: number;
  slots?: Record<string, WidgetNode[]>;
  tabs?: TabDefinition[];
}
```

### Fields

| Field    | Type                         | Required | Description                                     |
| -------- | ---------------------------- | -------- | ----------------------------------------------- |
| `view`   | string                       | yes      | View name to render (e.g. `'canvas'`)           |
| `source` | Source                       | no       | Data source for the view                        |
| `config` | Record<string, unknown>      | no       | View-specific configuration                     |
| `size`   | number                       | no       | Column span in dashboard layout (1-4)           |
| `slots`  | Record<string, WidgetNode[]> | no       | Widget trees placed into the view's named slots |
| `tabs`   | TabDefinition[]              | no       | Multiple tabbed views within this panel         |

When `tabs` is provided, each tab acts as its own mini-panel with its own view, source, config, and slots.

```typescript
interface TabDefinition {
  key: string;
  label: string;
  icon?: string;
  view: string;
  source?: Source;
  config?: Record<string, unknown>;
  slots?: Record<string, WidgetNode[]>;
}
```

### Source

```typescript
interface Source {
  model?: string;
  endpoint?: string;
  service?: { name: string; method: string };
  params?: Record<string, unknown>;
}
```

---

## 4. Drawer

The drawer is a right-side push panel. It opens programmatically (via `openDrawer` action or shell API). Its content follows the same structure as a panel.

```typescript
interface DrawerDefinition {
  width: 'sm' | 'md' | 'lg';
  title?: { field: string } | string;
  description?: { field: string } | string;
  view: string;
  source?: Source;
  config?: Record<string, unknown>;
  slots?: Record<string, WidgetNode[]>;
  tabs?: TabDefinition[];
}
```

When `tabs` is provided, the drawer renders tabbed content. Each tab has its own view and slots.

---

## 5. defineView() API

Views declare named slots where widget trees can be placed. The view component decides where each slot renders in its layout.

```typescript
interface ViewDefinition {
  name: string;
  label: string;
  schema: Record<string, ViewPropSchema>;
  slots: Record<string, SlotDefinition>;
  component: (props: ViewProps) => ReactNode;
}

interface SlotDefinition {
  label: string;
  multiple: boolean;
}
```

### Fields

| Field       | Type                           | Required | Description                                   |
| ----------- | ------------------------------ | -------- | --------------------------------------------- |
| `name`      | string                         | yes      | Unique identifier. Referenced by `panel.view` |
| `label`     | string                         | yes      | Display name                                  |
| `schema`    | Record<string, ViewPropSchema> | yes      | Config the view accepts. Validated at boot    |
| `slots`     | Record<string, SlotDefinition> | yes      | Named slots this view exposes                 |
| `component` | function                       | yes      | React component                               |

### Slot rules

- No required slots. Views render gracefully when slots are empty.
- Views do not restrict what widget types go in their slots.
- `multiple: true` means the slot accepts an array of widgets. `multiple: false` means one widget only.

### ViewProps (what the component receives)

```typescript
interface ViewProps {
  source?: UseSourceResult;
  config: Record<string, unknown>;
  slots: Record<string, ReactNode>;
  shell: ShellAPI;
  modelMeta?: ModelMeta;
}
```

---

## 6. Canvas View

The single built-in view. A blank container with one slot.

```typescript
defineView({
  name: 'canvas',
  label: 'Canvas',
  schema: {},
  slots: {
    body: { label: 'Body', multiple: true },
  },
  component: ({ slots }) => <div>{slots.body}</div>,
});
```

### Usage

```typescript
definePage({
  key: 'sales.orders',
  label: 'Sales Orders',
  type: 'collection',
  layout: 'full',
  panels: {
    main: {
      view: 'canvas',
      source: { model: 'sales.order' },
      slots: {
        body: [
          {
            type: 'table',
            bind: { model: { name: 'sales.order' } },
            children: [
              {
                type: 'column',
                props: { label: 'Name' },
                children: [{ type: 'text', bind: { field: 'name' } }],
              },
              {
                type: 'column',
                props: { label: 'Status' },
                children: [{ type: 'badge', bind: { field: 'status' } }],
              },
              {
                type: 'column',
                props: { label: 'Total' },
                children: [
                  { type: 'text', bind: { expression: '{{format_currency(total, currency)}}' } },
                ],
              },
            ],
          },
        ],
      },
    },
  },
});
```

Canvas does not auto-render anything. What you place in `body` is exactly what renders.

---

## 7. Boot Payload

The boot response includes page definitions and view metadata. The client uses this to build routes and resolve views.

```typescript
interface BootResponse {
  user: BootUser;
  permissions: BootPermissions;
  navigation: NavigationTree[];
  pages: PageDefinition[];
  models: Record<string, ModelMeta>;
  widgets: WidgetDefinitionMeta[];
  views: ViewDefinitionMeta[];
}
```

`views` is no longer optional. It always includes at least the `canvas` view.

---

## 8. Validation at Boot

The framework validates page definitions at startup:

1. `type` must be `'collection' | 'record' | 'dashboard'`.
2. `panel.view` must reference a registered view name.
3. `panel.slots` keys must match the view's declared slot names.
4. `panel.config` is validated against the view's schema.
5. Widget trees in slots are validated per widget system rules (type exists, props match schema, children only on containers, triggers match, binding mode matches).

Invalid definitions produce a startup error with the path to the problem (e.g. `pages.sales.orders.panels.main.slots.body[0]`).

---

## 9. Rendering Chain

```
Route match
  → PageOutlet (looks up PageDefinition by key)
    → LayoutRenderer (full / split / dashboard)
      → PanelSlot (for each panel)
        → ComponentRenderer (resolves view by name from ViewRegistry)
          → View component receives: source, config, slots (rendered widget trees)
            → SlotRenderer (renders WidgetNode[] via widget system)
```

The rendering chain stays the same. The only change is that `ComponentRenderer` resolves from a registry that initially contains only `canvas`. Module-defined views (via `defineView()`) register at boot and become available alongside canvas.

---

## 10. Cleanup

### Files to delete

| Path                                                    | Reason                   |
| ------------------------------------------------------- | ------------------------ |
| `packages/client/src/components/TableComponent.tsx`     | Opinionated view removed |
| `packages/client/src/components/FormComponent.tsx`      | Opinionated view removed |
| `packages/client/src/components/PeekComponent.tsx`      | Opinionated view removed |
| `packages/client/src/components/KanbanComponent.tsx`    | Opinionated view removed |
| `packages/client/src/components/TreeComponent.tsx`      | Opinionated view removed |
| `packages/client/src/components/TimelineComponent.tsx`  | Opinionated view removed |
| `packages/client/src/components/StatusBarComponent.tsx` | Opinionated view removed |

### Files to modify

| Path                                                        | Change                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| `packages/shared/src/types/page.ts`                         | Remove `'custom'` from PageType union                                    |
| `packages/client/src/components/index.ts`                   | Remove all built-in imports and registry entries. Register only `canvas` |
| `packages/client/src/index.ts`                              | Remove built-in component exports                                        |
| `tests/fixtures/basic-app/modules/sales/pages/orders.ts`    | Replace `view: 'peek'` with `view: 'canvas'` + widget slots              |
| `tests/fixtures/basic-app/modules/sales/pages/customers.ts` | Replace `view: 'form'` with `view: 'canvas'` + widget slots              |
| `packages/core/src/__tests__/widgets.test.ts`               | Update view registry tests to use canvas                                 |
| `packages/core/src/auth/__tests__/meta-boot.test.ts`        | Update boot response assertions                                          |
| `packages/shared/src/__tests__/page-types.test.ts`          | Remove custom type tests                                                 |
| `packages/core/src/boot/__tests__/page-scanning.test.ts`    | Update view references                                                   |
| `packages/core/src/boot/__tests__/page-utils.test.ts`       | Update view references                                                   |

### Infrastructure to keep

| Path                                                  | Reason                                           |
| ----------------------------------------------------- | ------------------------------------------------ |
| `packages/client/src/shell/ComponentRenderer.tsx`     | Resolves views from registry. Works unchanged    |
| `packages/client/src/shell/PanelSlot.tsx`             | Renders panels. Works unchanged                  |
| `packages/client/src/shell/TabbedPanel.tsx`           | Tab switching. Works unchanged                   |
| `packages/client/src/shell/DrawerContext.tsx`         | Drawer lifecycle. Works unchanged                |
| `packages/core/src/widgets/view-registry.ts`          | View discovery and registration. Works unchanged |
| `packages/shared/src/define.ts` (`defineView`)        | View definition API. Works unchanged             |
| Widget system (entire `packages/client/src/widgets/`) | Primary composition layer. Works unchanged       |

---

## 11. Build Phases

### Phase 1: Cleanup

Remove all opinionated view components and their references. Update types to drop `custom` page type. Ensure build passes with empty component registry.

### Phase 2: Canvas view

Implement the `canvas` view. Register it as the single built-in view. Verify it renders widget trees from panel slots.

### Phase 3: Fixture update

Update test fixtures to use canvas + widget composition instead of opinionated views. Ensure all tests pass.

### Phase 4: Documentation

Update `docs/concepts/pages.md` to reflect the new API. Remove references to removed views. Document canvas as the starting point.
