# Docs V2 Cleanup Spec — ✅ Implemented

Remove all references to the old page/view architecture from the documentation. The widget system v2 is the only UI model. No deprecation markers. No migration guides. Clean slate.

## Removed concepts

These no longer exist in the framework:

| Concept                                                                     | Replacement                                                                               |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `defineView()`                                                              | `defineWidget()`                                                                          |
| Built-in views (list, form, kanban, timeline, etc.)                         | Built-in widgets (table, data, repeat, etc.) + opinionated widgets (future)               |
| `panels` on PageDefinition                                                  | `widgets: WidgetNode[]`                                                                   |
| `layout` field (full/split/dashboard)                                       | `split`, `grid` layout widgets                                                            |
| `drawer` on PageDefinition                                                  | `drawer` widget with `visible` condition                                                  |
| `source` on panels                                                          | `data` widget                                                                             |
| `slots` on views/panels                                                     | Container widgets with `children`                                                         |
| `config` on panels                                                          | Widget `props`                                                                            |
| `tabs` on panels                                                            | Widget composition (group + button + visible conditions)                                  |
| View action slots (toolbar, row, bulk, card)                                | Widget triggers + actions                                                                 |
| DOM event communication (rangka:select, rangka:navigate, drawer:open/close) | `setValue` actions + `$state` reactivity                                                  |
| `ViewProps`, `SourceResult`, `ShellAPI` (view-level)                        | `WidgetProps`, widget hooks (`usePageState`, `useAction`, `useShell`, `useWidgetContext`) |
| `useSource()` hook                                                          | `data` widget handles fetching                                                            |
| `ActionButton` component                                                    | `button` widget with `on.click`                                                           |
| View resolution order (module views > built-in views)                       | Widget resolution order (module custom widgets > framework built-in widgets)              |
| `CanvasComponent`                                                           | Removed (no views)                                                                        |
| `ComponentRenderer`                                                         | Removed                                                                                   |
| `PanelSlot`                                                                 | Removed                                                                                   |
| `LayoutRenderer` layout modes                                               | Removed                                                                                   |
| `openDrawer` / `closeDrawer` actions                                        | `visible` + `$state` on `drawer` widget                                                   |
| `refreshPanel` action                                                       | `refreshSource` action                                                                    |

## Files to delete

| Path                            | Reason                                                      |
| ------------------------------- | ----------------------------------------------------------- |
| `docs/ui/views.md`              | Built-in views do not exist                                 |
| `docs/reference/define-view.md` | `defineView()` does not exist                               |
| `docs/guides/custom-views.md`   | Custom views do not exist. Replaced by custom widgets guide |

## Files to rewrite

These files are entirely about the old architecture. They need full rewrites, not patches.

### `docs/concepts/pages.md`

Rewrite to describe the v2 page model:

- A page is a flat widget tree (`widgets: WidgetNode[]`)
- Page types (collection, record, dashboard) control routing only
- No panels, no layouts, no views, no drawer config
- Data fetching handled by `data` widget
- Layout handled by `split`, `grid`, `group` widgets
- Overlays handled by `drawer`, `modal` widgets with `visible`
- Examples using the new API

### `docs/reference/define-page.md`

Rewrite to match current `PageDefinition`:

```typescript
interface PageDefinition {
  key: string;
  label: string;
  path?: string;
  actions?: Action[];
  widgets: WidgetNode[];
}
```

Remove: `layout`, `panels`, `drawer`, `Source`, `PanelDefinition`, `TabDefinition`, `DrawerDefinition`, view types table, action slots, communication events.

### `docs/concepts/shell.md`

Rewrite. The shell still exists (sidebar, topbar, breadcrumbs, command palette) but:

- Remove layouts section (full/split/dashboard)
- Remove panels and tabs section
- Remove drawer section (drawer is now a widget)
- Remove communication section (DOM events)
- Remove action string prefixes (`overlay:`, `emit:`)
- Shell renders the widget tree directly via `WidgetRenderer`

### `docs/guides/custom-views.md`

Replace with `docs/guides/custom-widgets.md`:

- Custom widgets use `defineWidget()` not `defineView()`
- Show `component` function receiving `WidgetProps`
- Show hooks: `usePageState`, `useAction`, `useShell`, `useWidgetContext`
- Registration: module custom widgets > framework built-in
- No slots, no schema (use widget `schema` prop definitions instead)

## Files to create

### `docs/concepts/widgets.md`

New concept page. The central concept that replaces views. Cover:

- Everything is a widget
- `WidgetNode` shape (type, props, bind, source, visible, on, children)
- Widget categories (input, display, layout, action, data)
- Binding modes (none, field, expression, record, model)
- Context tree (data widget creates scope, layout widgets pass through)
- Reactive variables ($state, $filter, $sort, $page, $route)
- Triggers and actions
- Expression language (brief, link to reference)
- Conditional rendering (visible)

### `docs/reference/define-widget.md`

Reference page for `defineWidget()`:

- `WidgetDefinition` interface
- Fields table (name, label, category, schema, binding, triggers, container, accepts, component)
- `WidgetProps` interface
- Binding modes table
- Registration and resolution order
- Example custom widget

### `docs/reference/built-in-widgets.md`

Reference for all built-in widgets:

- Input: `input`
- Display: `text`, `badge`, `icon`, `image`
- Layout: `group`, `section`, `split`, `grid`, `divider`, `spacer`
- Action: `button`
- Data: `data`, `repeat`, `table`, `column`
- Overlay: `drawer`, `modal`

For each widget: category, container (yes/no), binding mode, triggers, props table.

### `docs/reference/builder-api.md`

Reference for the chainable builder API:

- Widget factories (`$input`, `$text`, `$button`, `$badge`, `$table`, `$data`, `$repeat`, `$split`, `$grid`, `$drawer`, `$modal`, etc.)
- Action factories (`setValue`, `clearValue`, `setValues`, `service`, `navigate`, `sequence`, `conditional`)
- Page factory (`page(key, label).widgets([...]).toJSON()`)
- `WidgetBuilder` methods (props, bind, bindField, bindModel, source, visible, on, children, toJSON)

## Files to update

### `docs/concepts/how-it-works.md`

Line 30: Remove `views/dashboard.tsx → defineView()`. Replace with:

```
└── widgets/pipeline.ts  → defineWidget()     # "this custom widget exists"
```

Update any other references to views in the boot/discovery/validation flow description.

### `docs/concepts/modules.md`

Lines 79-80: Replace `views/` directory with `widgets/` directory:

```
└── widgets/
    └── PipelineBoard.tsx # defineWidget()
```

### `docs/concepts/project-structure.md`

Lines 71-72, 90: Replace views directory and table entry:

```
└── widgets/
    └── PipelineBoard.tsx # defineWidget()
```

Table row: `widgets/` | `defineWidget()` | Widget name from config

### `docs/concepts/actions.md`

Remove all examples using panels, views, drawer config. Replace with widget-based examples:

- Page-level actions (topbar) stay the same
- Widget-level actions use triggers and `on` wiring
- Remove view-level action slots concept entirely

### `docs/guides/extending-models.md`

Lines 121, 148-151: Replace page definition examples that use `layout`, `panels`, `view` with v2 widget tree.

### `docs/reference/cli.md`

Line 58, 67: Replace `views/` references with `widgets/`. Update manifest description to reference widget chunks.

### `docs/introduction.md`

Update "Next steps" links:

- Change `[Pages](/concepts/pages): defining screens` to also mention widgets
- Add link to widgets concept page
- Remove any implicit reference to views

### `docs/.vitepress/config.ts`

Update sidebar:

**Remove:**

- `{ text: 'Custom Views', link: '/guides/custom-views' }`
- `{ text: 'Views', link: '/ui/views' }`
- `{ text: 'defineView', link: '/reference/define-view' }`

**Add to "Building Your App":**

- `{ text: 'Widgets', link: '/concepts/widgets' }` (after Pages)

**Add to "Customizing":**

- `{ text: 'Custom Widgets', link: '/guides/custom-widgets' }` (replaces Custom Views)

**Add to "Reference":**

- `{ text: 'defineWidget', link: '/reference/define-widget' }` (after definePage)
- `{ text: 'Built-in Widgets', link: '/reference/built-in-widgets' }` (after defineWidget)
- `{ text: 'Builder API', link: '/reference/builder-api' }` (after Built-in Widgets)

### `docs/concepts/navigation.md`

No changes expected. Verify no view references. Navigation still works from module definitions pointing to page keys.

## Files unaffected

| Path                               | Reason                                                            |
| ---------------------------------- | ----------------------------------------------------------------- |
| `docs/concepts/models.md`          | Models are unchanged                                              |
| `docs/concepts/hooks.md`           | Hooks are unchanged                                               |
| `docs/concepts/services.md`        | Services are unchanged                                            |
| `docs/concepts/jobs.md`            | Jobs are unchanged                                                |
| `docs/concepts/fixtures.md`        | Fixtures are unchanged                                            |
| `docs/concepts/permissions.md`     | Permissions are unchanged                                         |
| `docs/concepts/module-switcher.md` | Module switcher is unchanged                                      |
| `docs/ui/fields.md`                | Field rendering is widget-level now but field types are unchanged |
| `docs/ui/theming.md`               | Theming is unchanged                                              |
| `docs/reference/define-model.md`   | Models are unchanged                                              |
| `docs/reference/define-module.md`  | Modules are unchanged                                             |
| `docs/reference/define-service.md` | Services are unchanged                                            |
| `docs/reference/define-hook.md`    | Hooks are unchanged                                               |
| `docs/reference/define-job.md`     | Jobs are unchanged                                                |
| `docs/reference/define-fixture.md` | Fixtures are unchanged                                            |
| `docs/reference/define-roles.md`   | Roles are unchanged                                               |
| `docs/reference/data-api.md`       | Data API is unchanged                                             |
| `docs/reference/meta-api.md`       | Meta API is unchanged                                             |
| `docs/guides/deployment.md`        | Deployment is unchanged                                           |
| `docs/guides/extending-models.md`  | Only page examples need updating (listed above)                   |
| `docs/contributing/*`              | Internal docs, separate concern                                   |

## Implementation order

1. Delete obsolete files (views.md, define-view.md, custom-views.md)
2. Create new concept page (widgets.md)
3. Create new reference pages (define-widget.md, built-in-widgets.md, builder-api.md)
4. Create new guide (custom-widgets.md)
5. Rewrite pages.md
6. Rewrite define-page.md
7. Rewrite shell.md
8. Update how-it-works.md, modules.md, project-structure.md, actions.md, extending-models.md, cli.md, introduction.md
9. Update .vitepress/config.ts sidebar
10. Verify no remaining references to old concepts (grep for defineView, panels, layout:, view:, drawer:, PanelSlot, ComponentRenderer, CanvasComponent, LayoutRenderer)
