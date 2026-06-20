---
status: stable
since: 0.2.0
last-updated: 2026-06-19
description: defineWidget() API — props, triggers, binding, and rendering
---

# defineWidget

Registers widget metadata including accepted props, binding mode, and triggers.

See [Widgets concept](/concepts/widgets) for how widgets compose into pages. See [Built-in Widgets](/reference/built-in-widgets) for the widgets that ship with Rangka.

## Signature

```typescript
import { defineWidget } from 'rangka';

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
```

To register a widget with its component, use `registerWidget`:

```typescript
import { registerWidget } from 'rangka';

registerWidget(meta, ({ props, on }) => {
  const state = usePageState();
  const { fire } = useAction(handlers);
  return <PipelineBoard onSelect={(id) => on.dealSelect?.(id)} />;
});
```

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

## Hooks

Custom widgets can use these hooks for framework integration.

```typescript
usePageState(); // Read/write $state
useAction(handlers); // Fire actions programmatically. Takes ActionHandlers, returns { fire }
useShell(); // toast, confirm, navigate
useWidgetContext(); // Access current record/model/mode
```

## Resolution

Widgets are resolved from the registry by type name. If no widget is registered for a given type, the renderer throws an error.

## File location

Custom widgets live in your module's `widgets/` directory:

```
modules/sales/
└── widgets/
    └── pipeline-board.tsx
```

They are compiled by `rangka build` into `.rangka/` and loaded at runtime via dynamic `import()`.

## Example

```typescript
// modules/sales/widgets/pipeline-board.tsx
import { defineWidget, registerWidget } from 'rangka';

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

registerWidget(meta, ({ props, on }) => {
  const state = usePageState();
  const { fire } = useAction({
    selectDeal: (id) => { /* ... */ },
  });
  const shell = useShell();

  return (
    <PipelineBoard
      showLabels={props.showLabels}
      onSelect={(id) => {
        on.dealSelect?.(id);
        state.set('selectedDeal', id);
      }}
    />
  );
});
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
