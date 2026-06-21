---
status: stable
since: 0.2.0
last-updated: 2026-06-21
description: defineWidget() API — props, triggers, binding, and rendering
---

# defineWidget

Registers widget metadata including accepted props, binding mode, and triggers.

See [Widgets concept](/concepts/widgets) for how widgets compose into pages. See [Built-in Widgets](/reference/built-in-widgets) for the widgets that ship with Rangka.

## Signature

```typescript
import { defineWidget } from '@rangka/shared';

const meta = defineWidget({
  name: 'sales.pipeline-board',
  label: 'Pipeline Board',
  category: 'display',
  schema: {
    showLabels: { type: 'boolean', default: true },
    columnField: { type: 'string', required: true },
  },
  binding: 'none',
  triggers: ['dealSelect'],
  container: false,
});

function PipelineBoard({ props, on }: WidgetProps) {
  return (
    <div className="flex flex-col gap-4 bg-card rounded-lg p-4">
      <h2 className="text-sm font-medium text-muted-foreground">Pipeline</h2>
      {/* widget implementation */}
    </div>
  );
}

export default { meta, component: PipelineBoard };
```

The widget file exports a default object with `meta` and `component`. The framework handles registration at runtime.

## WidgetDefinitionMeta

```typescript
interface WidgetDefinitionMeta {
  name: string;
  label: string;
  category: 'input' | 'display' | 'layout' | 'action' | 'data';
  schema: Record<string, WidgetPropSchema>;
  binding: 'none' | 'field' | 'expression' | 'model';
  triggers: string[];
  container: boolean;
  accepts?: string[];
}
```

### Fields

| Field       | Type     | Required | Description                                         |
| ----------- | -------- | -------- | --------------------------------------------------- |
| `name`      | string   | yes      | Unique identifier. Used in `WidgetNode.type`.       |
| `label`     | string   | yes      | Display name for the visual editor.                 |
| `category`  | enum     | yes      | Grouping for the visual editor palette.             |
| `schema`    | object   | yes      | Props the widget accepts. Validated on the client.  |
| `binding`   | enum     | yes      | What data binding mode this widget supports.        |
| `triggers`  | string[] | yes      | Events this widget can emit. Empty array if none.   |
| `container` | boolean  | yes      | Whether this widget can hold children.              |
| `accepts`   | string[] | no       | If container, restricts allowed child widget types. |

## Schema

The schema declares what props a widget accepts. The client validates `props` passed in page definitions against this schema at render time. The server validates container, accepts, triggers, and binding but not individual prop types.

```typescript
interface WidgetPropSchema {
  type: 'string' | 'number' | 'boolean' | 'enum' | 'object' | 'array';
  required?: boolean;
  default?: unknown;
  options?: string[];
}
```

| Property   | Type     | Description                                        |
| ---------- | -------- | -------------------------------------------------- |
| `type`     | string   | Data type of the prop value.                       |
| `required` | boolean  | Whether the prop must be provided. Default: false. |
| `default`  | unknown  | Default value if not provided.                     |
| `options`  | string[] | Allowed values (for `enum` type).                  |

## Binding modes

| Mode         | Meaning                                                         |
| ------------ | --------------------------------------------------------------- |
| `none`       | No data connection. Renders from props only.                    |
| `field`      | Binds to a single field on the nearest record in scope.         |
| `expression` | Binds to a computed expression. Read-only.                      |
| `model`      | Fetches its own data from a model. Creates a new context scope. |

## WidgetProps

What the component receives at runtime.

```typescript
interface WidgetProps {
  props: Record<string, any>;
  bind: {
    value: any;
    setValue?: (val: any) => void;
    meta?: {
      type: string;
      label: string;
      required: boolean;
      options?: any[];
      readOnly: boolean;
    };
  };
  on: Record<string, (...args: any[]) => void>;
  context: {
    record: Record<string, any>;
    model: string;
    mode: 'view' | 'edit';
    index?: number;
  };
  children?: ReactNode;
}
```

| Prop            | Description                                                          |
| --------------- | -------------------------------------------------------------------- |
| `props`         | Static props from the widget node, validated against schema.         |
| `bind.value`    | Current value from the bound field or expression.                    |
| `bind.setValue` | Setter for the bound field. Only present for writable bindings.      |
| `bind.meta`     | Field metadata from the model (type, label, required, options).      |
| `on`            | Trigger callbacks. Call `on.click()` or `on.rowClick(data)` to fire. |
| `context`       | Current data context (record, model name, mode, iteration index).    |
| `children`      | Rendered child widgets. Only present if `container: true`.           |

## Resolution

Widgets are resolved from the registry by type name. Built-in widgets are registered at boot. Custom widgets are loaded on demand from the manifest when first encountered.

If no widget is registered and no manifest entry exists for a given type, the renderer shows an error placeholder.

## File location

Custom widgets live in your module's `widgets/` directory:

```
modules/sales/
└── widgets/
    └── pipeline-board.tsx
```

They are compiled by `rangka build` into `.rangka/` and loaded at runtime via dynamic `import()`.

## Build and runtime

Running `rangka build` does the following for each widget file:

1. Bundles the widget with esbuild (React is provided by the shell, npm deps are bundled in)
2. Generates scoped Tailwind CSS for utility classes used in the widget
3. Writes the bundle and CSS to `.rangka/widgets/`
4. Produces a `manifest.json` mapping widget keys to bundle paths

At runtime, the shell fetches the manifest and lazily imports widgets when a page references them. CSS is injected via `<link>` elements before the component renders.

## Using Tailwind

Custom widgets can use any Tailwind utility class. The build generates CSS containing only the classes the widget references. Semantic tokens from the shell theme (`bg-primary`, `text-muted-foreground`, `border`, etc.) work automatically.

```tsx
function MyWidget({ props }: WidgetProps) {
  return (
    <div className="rounded-lg border bg-card p-4 hover:shadow-md">
      <span className="text-emerald-600 font-semibold">{props.value}</span>
    </div>
  );
}
```

## Using npm packages

Install any browser-compatible npm package in your project and import it in a widget. The build bundles it into the widget chunk.

```tsx
import { BarChart, Bar, XAxis, YAxis } from 'recharts';

function SalesChart({ props }: WidgetProps) {
  return (
    <BarChart data={props.data} width={400} height={300}>
      <XAxis dataKey="month" />
      <YAxis />
      <Bar dataKey="sales" fill="hsl(var(--primary))" />
    </BarChart>
  );
}
```

Packages that import their own CSS (like `@xyflow/react/dist/style.css`) are supported. The CSS is extracted and merged with the Tailwind output.

## Example

```typescript
// modules/sales/widgets/pipeline-board.tsx
import { defineWidget } from '@rangka/shared';

const meta = defineWidget({
  name: 'sales.pipeline-board',
  label: 'Pipeline Board',
  category: 'display',
  schema: {
    showLabels: { type: 'boolean', default: true },
  },
  binding: 'none',
  triggers: ['dealSelect'],
  container: false,
});

function PipelineBoard({ props, on }: any) {
  return (
    <div className="flex flex-col gap-4 bg-card rounded-lg p-4">
      <h3 className="text-sm font-medium">Pipeline</h3>
      {/* implementation */}
      <button onClick={() => on.dealSelect?.('deal-1')}>Select Deal</button>
    </div>
  );
}

export default { meta, component: PipelineBoard };
```

Use it in a page:

```typescript
definePage({
  key: 'sales.pipeline',
  label: 'Pipeline',
  type: 'collection',
  body: [
    {
      type: 'sales.pipeline-board',
      props: { showLabels: true },
      on: { dealSelect: { type: 'setValue', field: '$state.selectedId', value: '{{$args.0}}' } },
    },
  ],
});
```
