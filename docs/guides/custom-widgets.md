---
status: stable
since: 0.2.0
last-updated: 2026-06-21
description: How to build custom widgets with defineWidget()
---

# Custom widgets

The built-in widgets handle most UI needs. When you need something the built-ins cannot express (a drag-and-drop board, a chart, a third-party component) you build a custom widget.

## When to use one

- Interaction patterns beyond standard inputs and tables
- Third-party components (maps, rich editors, chart libraries)
- Complex rendering logic that does not map to declarative composition
- Real-time or WebSocket-driven UI

If you just need to arrange built-in widgets differently, use layout widgets (`split`, `grid`, `group`) instead.

## Creating a custom widget

Custom widgets live in your module's `widgets/` directory. Each file exports a `meta` and `component` as its default export.

```tsx
// modules/sales/widgets/pipeline-board.tsx
import { defineWidget } from '@rangka/shared';

const meta = defineWidget({
  name: 'sales.pipeline-board',
  label: 'Pipeline Board',
  category: 'display',
  schema: {
    groupField: { type: 'string', required: true },
    showLabels: { type: 'boolean', default: true },
  },
  binding: 'none',
  triggers: ['dealSelect'],
  container: false,
});

function PipelineBoard({ props, on }: any) {
  return (
    <div className="flex flex-col gap-4 bg-card rounded-lg p-4">
      <h2 className="text-sm font-medium text-muted-foreground">Pipeline</h2>
      {/* implementation */}
      <button onClick={() => on.dealSelect?.('deal-1')}>Select</button>
    </div>
  );
}

export default { meta, component: PipelineBoard };
```

The framework handles registration and loading. You do not call `registerWidget` yourself.

## Using it in a page

Reference your widget by name in the page body. It participates in the same system as any built-in widget: same context tree, same binding, same actions, same expressions.

```typescript
definePage({
  key: 'sales.pipeline',
  label: 'Pipeline',
  type: 'collection',
  body: [
    {
      type: 'sales.pipeline-board',
      props: { groupField: 'status', showLabels: true },
      on: {
        dealSelect: { type: 'setValue', field: '$state.selectedId', value: '{{$args.0}}' },
      },
    },
  ],
});
```

## Styling with Tailwind

Custom widgets can use any Tailwind utility class. The build generates CSS containing only the classes your widget references.

Shell theme tokens work automatically:

```tsx
<div className="rounded-lg border bg-card text-card-foreground p-4">
  <span className="text-primary font-semibold">{props.title}</span>
</div>
```

The full Tailwind palette is available (emerald, fuchsia, amber, etc.) along with arbitrary values:

```tsx
<div className="w-[237px] bg-[#7c3aed] rounded-[13px]">Custom dimensions and colors</div>
```

## Using npm packages

Install any browser-compatible package and import it. The build bundles it into your widget's chunk.

```bash
pnpm add recharts
```

```tsx
import { BarChart, Bar, XAxis, YAxis } from 'recharts';

function SalesChart({ props }: any) {
  return (
    <BarChart data={props.data} width={400} height={300}>
      <XAxis dataKey="month" />
      <YAxis />
      <Bar dataKey="sales" fill="hsl(var(--primary))" />
    </BarChart>
  );
}
```

Packages that import their own CSS (like `@xyflow/react/dist/style.css`) are supported. The CSS is extracted and included automatically.

## Communicating with the framework

Import hooks from `@rangka/client` to interact with the shell and framework state.

```tsx
import { usePageState, useShell, useWidgetContext, useModelQuery } from '@rangka/client';
```

### Available hooks

| Hook                 | Purpose                                                                  |
| -------------------- | ------------------------------------------------------------------------ |
| `usePageState()`     | Read/write page-level `$state`. Returns `{ get(key), set(key, val) }`    |
| `useShell()`         | Shell API: `toast(message, type?)`, `confirm(message)`, `navigate(path)` |
| `useWidgetContext()` | Current context: `{ record, model, mode, index }`                        |
| `useModelQuery()`    | Fetch a list with pagination, filtering, sorting                         |
| `useModelRecord()`   | Fetch a single record by model and ID                                    |

### Example: shared state

Two widgets on the same page share `$state`:

```tsx
import { usePageState } from '@rangka/client';

function Counter() {
  const state = usePageState();
  const count = (state.get('counter') as number) || 0;

  return <button onClick={() => state.set('counter', count + 1)}>Count: {count}</button>;
}
```

### Example: data fetching

```tsx
import { useModelQuery } from '@rangka/client';

function OrderList() {
  const { data, isLoading, error, total } = useModelQuery({
    model: 'sales.order',
    pageSize: 10,
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <ul>
      {data.map((row) => (
        <li key={row.id as string}>{row.name as string}</li>
      ))}
    </ul>
  );
}
```

### Example: shell interactions

```tsx
import { useShell } from '@rangka/client';

function SaveButton() {
  const shell = useShell();

  const handleSave = async () => {
    const ok = await shell.confirm('Save changes?');
    if (ok) {
      shell.toast('Saved successfully', 'info');
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

## Container widgets

If your widget wraps other widgets, set `container: true`. You receive rendered children via the `children` prop.

```tsx
const meta = defineWidget({
  name: 'sales.card-wrapper',
  label: 'Card Wrapper',
  category: 'layout',
  schema: { elevation: { type: 'number', default: 1 } },
  binding: 'none',
  triggers: [],
  container: true,
});

function CardWrapper({ props, children }: any) {
  return <div className={`rounded-lg shadow-${props.elevation} p-4`}>{children}</div>;
}

export default { meta, component: CardWrapper };
```

Use `accepts` in the meta to restrict which widget types can be placed inside:

```typescript
accepts: ['column', 'text', 'badge'];
```

## Building

Run `rangka build` to compile your widgets:

```bash
rangka build
```

This scans `modules/*/widgets/`, bundles each widget with its npm dependencies, generates Tailwind CSS, and outputs everything to `.rangka/`. Run this after creating or modifying a widget.

At runtime, `rangka start` serves the bundles and the shell loads them on demand when a page references them.

## Error handling

If a custom widget throws a runtime error, the framework catches it with an error boundary. The rest of the page continues working. The error is logged to the browser console with the widget name and component stack.

You will see:

- A red error box in place of the widget showing the widget name and error message
- A `console.error` with the full stack trace and component stack

This means a broken widget cannot crash the entire application.

## Limitations

The following are not yet supported:

- **`useAction()` hook** — programmatic action dispatch from custom widgets is not available yet
- **`useModelRecord()` hook** — single record fetch is exposed but untested with custom widgets
- **Server-side rendering** — custom widgets are client-only
- **Hot module replacement** — changes require a full `rangka build` + page reload
- **Custom Tailwind plugins** — the build does not load a user Tailwind config
- **`dark:` variant** — depends on how the shell applies dark mode
- **Animations** — `animate-*` classes beyond Tailwind defaults are untested
- **Widget-to-widget communication** — widgets can only communicate via shared `$state`, not directly

## Tips

- Keep widgets focused on rendering. Put data logic in services.
- Pass options through `schema` props so the same widget works in different pages with different configurations.
- Declare only the triggers you actually emit. The framework validates `on` keys against declared triggers.
- Third-party libraries (charts, maps, editors) get bundled into your widget's chunk. React is provided by the shell.
- Prefer built-in composition when possible. A custom widget for "two columns with a table" is unnecessary when `split` and `table` do the job.
