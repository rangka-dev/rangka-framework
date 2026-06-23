# Spec: Page Extension (`extendPage`)

Status: Draft
Packages affected: shared (types, schema, define helper), core (scanner, boot, patch engine)

---

## Context

Rangka apps are modular. Module A defines pages with widget trees. Module B needs to extend those pages without modifying module A's source. Examples: adding a column to a table, adding a field to a form, injecting a button next to an existing widget.

Pages are widget trees. Extending a page means patching that tree declaratively before it reaches the client. This is the same concept as Odoo's view inheritance (XPath + position) adapted to TypeScript and JSON widget trees.

---

## Design Decisions

- Page extensions live in the same `pages/` folder as page definitions. No separate directory.
- The scanner distinguishes definitions from extensions by shape: `key` + `widgets` is a definition, `target` + `patches` is an extension.
- Extensions are declarative patch descriptors. No imperative callbacks.
- Selectors match widgets by `id`, `type`, `source` (model name), `bind` (field name), or any combination.
- Selectors traverse the tree depth-first and match the first node satisfying all criteria.
- Each patch specifies exactly one positional operation: `append`, `prepend`, `before`, `after`, `replace`, `remove`, or `props` (merge).
- Boot applies all extensions after collecting all pages. Order: sorted by module load order, then file order within a module.
- Boot-time validation errors when a selector matches nothing (target page missing or selector finds no widget).
- `extendPage()` is a type-only helper like `definePage()`. Returns the config unchanged.
- Widget `id` is optional. Most selectors work without it. Page authors should add `id` to key structural widgets (forms, tables, sections) to make them stable extension targets.
- Extensions can also patch page-level `actions` (toolbar buttons).

---

## API

### `extendPage` definition

```typescript
import { extendPage, widget, action } from '@rangka/shared';

export default extendPage({
  target: 'sales.orders',
  patches: [
    {
      find: { type: 'table', source: 'sales.order' },
      append: [widget.column('tax_total', { label: 'Tax' })],
    },
    {
      find: { id: 'order-form' },
      prepend: [widget.input('po_number', { label: 'PO Number' })],
    },
    {
      find: { id: 'submit-btn' },
      before: [
        widget.button({
          label: 'Validate Tax',
          on: { click: action.service('accounting.validateTax') },
        }),
      ],
    },
    {
      find: { type: 'input', bind: 'email' },
      props: { required: true, placeholder: 'Enter email' },
    },
    {
      find: { type: 'column', props: { label: 'Status' } },
      remove: true,
    },
  ],
});
```

### Page-level actions

```typescript
export default extendPage({
  target: 'sales.orders',
  actions: {
    append: [
      {
        type: 'button',
        label: 'Export to Accounting',
        action: action.service('accounting.export'),
      },
    ],
  },
  patches: [],
});
```

---

## Types

```typescript
export interface PageExtension {
  target: string;
  patches: PagePatch[];
  actions?: {
    append?: Action[];
    prepend?: Action[];
  };
}

export interface WidgetSelector {
  id?: string;
  type?: string;
  source?: string;
  bind?: string;
  props?: Record<string, unknown>;
}

export type PagePatch =
  | { find: WidgetSelector; append: WidgetNode[] }
  | { find: WidgetSelector; prepend: WidgetNode[] }
  | { find: WidgetSelector; before: WidgetNode[] }
  | { find: WidgetSelector; after: WidgetNode[] }
  | { find: WidgetSelector; replace: WidgetNode[] }
  | { find: WidgetSelector; remove: true }
  | { find: WidgetSelector; props: Record<string, unknown> };
```

---

## Selector Matching

A `WidgetSelector` matches a `WidgetNode` when ALL specified fields match:

| Selector field | Matches against                                                               |
| -------------- | ----------------------------------------------------------------------------- |
| `id`           | `node.id === selector.id`                                                     |
| `type`         | `node.type === selector.type`                                                 |
| `source`       | `node.source?.model === selector.source`                                      |
| `bind`         | `node.bind?.field === selector.bind`                                          |
| `props`        | Every key/value in `selector.props` exists in `node.props` (shallow equality) |

The tree is traversed depth-first. The first matching node wins. If no node matches, boot emits a validation warning (non-fatal, same severity as unresolved source models).

---

## Patch Operations

| Operation | Behavior                                                                        |
| --------- | ------------------------------------------------------------------------------- |
| `append`  | Add widgets as last children of the matched node                                |
| `prepend` | Add widgets as first children of the matched node                               |
| `before`  | Insert widgets as siblings before the matched node (in parent's children array) |
| `after`   | Insert widgets as siblings after the matched node (in parent's children array)  |
| `replace` | Replace the matched node with the provided widgets                              |
| `remove`  | Remove the matched node from its parent's children array                        |
| `props`   | Shallow-merge the provided props into the matched node's `props`                |

For `before`, `after`, `replace`, and `remove`: the matched node must have a parent (cannot target root-level widgets this way). Targeting a root widget for `before`/`after` operates on the page's `widgets` array directly.

---

## Boot Sequence Integration

Current flow:

1. Scan all `pages/` folders -> collect PageDefinitions
2. Validate pages (duplicate keys, sources, bindings)
3. Pass pages to route generator and meta-handler

New flow:

1. Scan all `pages/` folders -> collect PageDefinitions AND PageExtensions
2. Register all pages
3. Apply all extensions to their targets (ordered by module load order)
4. Validate the final merged page trees (duplicate keys, sources, bindings)
5. Pass merged pages to route generator and meta-handler

---

## Scanner Changes

`ProjectScanner.scanPages()` currently skips files without `widgets`. It will now also detect extension exports:

- If default export has `target` + `patches` -> it is a `PageExtension`
- If default export has `key` + `widgets` -> it is a `PageDefinition`
- Otherwise -> skip with warning

Both are returned from the scan. The boot sequence separates them before applying.

---

## Validation

### Zod schema (in `shared/src/validation/schemas/page-extension.ts`)

- `target`: non-empty string
- `patches`: array of patch objects (min 1 unless `actions` is present)
- Each patch: `find` (WidgetSelector) + exactly one operation
- `actions`: optional object with `append`/`prepend` arrays

### Boot-time validation (in `core/src/boot/page-utils.ts`)

- Warn if `target` page key does not exist
- Warn if a selector matches no widget in the target page (after applying prior patches in order)
- Existing source/binding validation runs on the final merged tree

---

## File Structure

```
packages/shared/src/
├── types/page.ts              — Add PageExtension, WidgetSelector, PagePatch types
├── validation/schemas/
│   └── page-extension.ts      — Zod schema for PageExtension
├── define.ts                  — Add extendPage() helper
└── index.ts                   — Export extendPage

packages/core/src/boot/
├── project-scanner.ts         — Detect and collect extensions from pages/ folder
├── page-utils.ts              — Add applyPageExtensions(), validateExtensionTargets()
└── index.ts                   — Wire extension application into boot pipeline
```

---

## Edge Cases

- Multiple modules extend the same page: patches apply in module load order. Later patches see earlier patches' results.
- Extension targets a page that does not exist: boot warning (not fatal). The extension is silently skipped.
- Selector matches nothing: boot warning. The patch is skipped.
- `append`/`prepend` on a leaf widget (no children): creates the `children` array.
- `before`/`after` on a root-level widget: operates on the page's top-level `widgets` array.
- Extension file exports both `key` and `target`: treated as extension (target takes precedence). Boot warns about ambiguity.

---

## Not In Scope

- Imperative/callback-based extensions (considered, rejected for serialization and validation reasons)
- Conditional extensions (show patch only if another module is installed). Can be added later with an optional `when` field.
- Priority/weight ordering between extensions. Module load order is deterministic enough for v1.
- `extendModel` (separate feature, separate spec)
- Client-side dynamic patching (all patching happens at boot, client receives the final tree)
