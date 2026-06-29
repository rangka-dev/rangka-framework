---
status: stable
since: 0.2.0
last-updated: 2026-06-29
description: How to build custom widgets with defineWidget()
---

# Custom widgets

The built-in widgets handle most UI needs. When you need something they cannot express, you build a custom widget.

Use cases:

- Drag-and-drop boards, charts, maps, rich editors
- Third-party components from npm
- Complex rendering that does not map to declarative composition
- Real-time or WebSocket-driven UI

If you need to arrange built-in widgets differently, use layout widgets (`split`, `grid`, `group`) instead.

## Creating a widget

Custom widgets live in your app's `widgets/` directory. Each file exports a `meta` and `component`.

```tsx
// apps/sales/widgets/pipeline-board.tsx
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
      <button onClick={() => on.dealSelect?.('deal-1')}>Select</button>
    </div>
  );
}

export default { meta, component: PipelineBoard };
```

The framework handles registration. You do not call `registerWidget` yourself.

## Using it in a page

Reference your widget by name. It participates in the same system as built-in widgets: same context tree, same binding, same actions.

```typescript
import { definePage } from 'rangka';

export default definePage({
  key: 'sales.pipeline',
  label: 'Pipeline',
  widgets: [
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

## Styling

Custom widgets can use any Tailwind utility class. Shell theme tokens work automatically:

```tsx
<div className="rounded-lg border bg-card text-card-foreground p-4">
  <span className="text-primary font-semibold">{props.title}</span>
</div>
```

The full Tailwind palette and arbitrary values are available:

```tsx
<div className="w-[237px] bg-[#7c3aed] rounded-[13px]">Custom dimensions</div>
```

## Using npm packages

Install any browser-compatible package. The build bundles it into your widget's chunk.

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

Packages that import their own CSS are supported. The CSS is extracted and included automatically.

## Framework hooks

Import hooks from `@rangka/client` to interact with the shell and data layer.

```tsx
import { usePageState, useShell, useWidgetContext, useModelQuery } from '@rangka/client';
```

| Hook                 | Purpose                                                                  |
| -------------------- | ------------------------------------------------------------------------ |
| `usePageState()`     | Read/write page-level `$state`. Returns `{ get(key), set(key, val) }`    |
| `useShell()`         | Shell API: `toast(message, type?)`, `confirm(message)`, `navigate(path)` |
| `useWidgetContext()` | Current context: `{ record, model, mode, index }`                        |
| `useModelQuery()`    | Fetch a list with pagination, filtering, sorting                         |
| `useModelRecord()`   | Fetch a single record by model and ID                                    |

### Shared state between widgets

Two widgets on the same page share `$state`:

```tsx
import { usePageState } from '@rangka/client';

function Counter() {
  const state = usePageState();
  const count = (state.get('counter') as number) || 0;

  return <button onClick={() => state.set('counter', count + 1)}>Count: {count}</button>;
}
```

### Data fetching

```tsx
import { useModelQuery } from '@rangka/client';

function OrderList() {
  const { data, isLoading, error } = useModelQuery({
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

### Shell interactions

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

If your widget wraps other widgets, set `container: true`. Rendered children arrive via the `children` prop.

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

This scans `apps/*/widgets/`, bundles each widget with its dependencies, generates Tailwind CSS, and outputs to `.rangka/`. Run this after creating or modifying a widget.

At runtime, `rangka start` serves the bundles. The shell loads them on demand when a page references them.

## Error handling

If a custom widget throws at runtime, the framework catches it with an error boundary. The rest of the page continues working. You will see a red error box in place of the widget and a `console.error` with the full stack trace.

A broken widget cannot crash the entire application.

## Limitations

- **Server-side rendering** — custom widgets are client-only
- **Hot reload** — changes require `rangka build` + page reload
- **Custom Tailwind plugins** — the build does not load a user Tailwind config
- **Widget-to-widget communication** — widgets communicate via shared `$state` only

## Tips

- Keep widgets focused on rendering. Put data logic in services.
- Pass options through `schema` props so the same widget works across pages.
- Declare only the triggers you actually emit. The framework validates `on` keys against declared triggers.
- React is provided by the shell. Third-party libraries get bundled into your widget's chunk.
- Prefer built-in composition when possible. A custom widget for "two columns with a table" is unnecessary when `split` and `table` do the job.
