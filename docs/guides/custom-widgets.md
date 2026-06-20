---
status: stable
since: 0.2.0
last-updated: 2026-06-15
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

Custom widgets live in your module's `widgets/` directory. They use `defineWidget()` with the same contract as built-in widgets.

```tsx
// modules/sales/widgets/pipeline-board.tsx
import { defineWidget } from 'rangka';

export default defineWidget({
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
  component: ({ props, on }) => {
    const state = usePageState();
    const shell = useShell();

    return (
      <PipelineBoard
        groupField={props.groupField}
        showLabels={props.showLabels}
        onSelect={(id) => on.dealSelect?.(id)}
      />
    );
  },
});
```

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

## Hooks

Custom widgets have access to framework hooks for state management and shell interactions.

| Hook                 | Returns                                                                    |
| -------------------- | -------------------------------------------------------------------------- |
| `usePageState()`     | Read/write `$state`. Returns `{ get(key), set(key, value), state }`.       |
| `useAction()`        | Fire actions programmatically. Returns `{ fire(action) }`.                 |
| `useShell()`         | Shell API: `toast(message, type?)`, `confirm(message)`, `setTitle(title)`. |
| `useWidgetContext()` | Current context: `{ record, model, mode, index }`.                         |

```tsx
component: ({ props, on }) => {
  const state = usePageState();
  const action = useAction();
  const shell = useShell();
  const ctx = useWidgetContext();

  const handleSave = async () => {
    const confirmed = await shell.confirm('Save changes?');
    if (confirmed) {
      action.fire({ type: 'model.update', data: { status: 'saved' } });
      shell.toast('Saved');
    }
  };

  return <CustomEditor record={ctx.record} onSave={handleSave} />;
},
```

## Container widgets

If your widget wraps other widgets, set `container: true`. You receive rendered children via the `children` prop.

```tsx
defineWidget({
  name: 'sales.card-wrapper',
  label: 'Card Wrapper',
  category: 'layout',
  schema: {
    elevation: { type: 'number', default: 1 },
  },
  binding: 'none',
  triggers: [],
  container: true,
  component: ({ props, children }) => {
    return <Card elevation={props.elevation}>{children}</Card>;
  },
});
```

Use `accepts` to restrict which widget types can be placed inside:

```typescript
accepts: ['column', 'text', 'badge'];
```

## Data-fetching widgets

For widgets that fetch their own data (like a kanban board or calendar), use `binding: 'model'`. The widget creates its own context scope and responds to `$filter`, `$sort`, and `$page` reactive variables.

```tsx
defineWidget({
  name: 'sales.kanban',
  label: 'Kanban Board',
  category: 'data',
  schema: {
    groupBy: { type: 'string', required: true },
  },
  binding: 'model',
  triggers: ['cardClick', 'cardDrop'],
  container: true,
  component: ({ props, bind, on, children }) => {
    // bind.value is the fetched record set
    const records = bind.value;
    return (
      <KanbanBoard
        records={records}
        groupBy={props.groupBy}
        onCardClick={(id) => on.cardClick?.(id)}
        onDrop={(id, newStatus) => on.cardDrop?.(id, newStatus)}
        cardTemplate={children}
      />
    );
  },
});
```

## Resolution order

1. Custom widgets in the module's `widgets/` directory
2. Framework built-in widgets
3. Error at boot

If two modules export a widget with the same name, the module that owns the page wins.

## Build and loading

Custom widgets are compiled into async chunks:

```bash
rangka build
```

This scans for custom widgets, bundles each one into `.rangka/`, and produces a manifest. At runtime, `rangka start` serves these chunks and the shell loads them on demand via dynamic `import()`.

## Tips

- Keep widgets focused on rendering. Put data logic in services.
- Pass options through `schema` props so the same widget works in different pages with different configurations.
- Declare only the triggers you actually emit. The framework validates `on` keys against declared triggers at boot.
- Third-party libraries (charts, maps) get bundled into your widget's chunk. React and `@rangka/client` are externals.
- Prefer built-in composition when possible. A custom widget for "two columns with a table" is unnecessary when `$split` and `$table` do the job.
