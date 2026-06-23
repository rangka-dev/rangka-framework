---
status: stable
since: 0.2.0
last-updated: 2026-06-15
description: Mental model bridge for React developers adopting Rangka
---

# Coming from React

If you write React, Rangka will feel familiar in some ways and foreign in others. The rendering model is reactive and component-based. But you do not write components, manage state, or handle side effects. You declare everything as data.

## The mental model shift

In React, you write functions that return UI. You manage state with hooks. You handle events with callbacks. You compose components into trees.

In Rangka, you write JSON that describes UI. State is a shared reactive store. Events are handled by declarative actions. You compose widgets into trees.

The tree structure is the same. The difference is code vs data.

## Concept mapping

| React                                    | Rangka                                     | Notes                                                    |
| ---------------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| Component                                | Widget                                     | But you do not write the render function (unless custom) |
| JSX tree                                 | `widgets: WidgetNode[]`                    | Same tree structure, data instead of code                |
| `useState`                               | `$state.key`                               | Page-scoped, flat, no hook rules                         |
| `useEffect` for fetching                 | `data` widget with `source`                | Declarative. No cleanup. No race conditions.             |
| `useContext`                             | Context tree (automatic)                   | `data` widget creates scope, children inherit            |
| Props                                    | `props` on WidgetNode                      | Static values or expressions                             |
| `onClick={() => ...}`                    | `on: { click: { type: 'setValue', ... } }` | Action is data, not a function                           |
| Conditional rendering (`{x && <Y/>}`)    | `visible: { field, operator, value }`      | Declarative condition                                    |
| `.map()` for lists                       | `repeat` widget                            | No keys needed. Framework handles identity.              |
| Redux / Zustand                          | `$state` + `$filter` + `$sort` + `$page`   | Built-in. No setup. No reducers.                         |
| React Query / SWR                        | `data` widget, `table` widget              | Fetching is declarative. Caching handled.                |
| Form libraries (Formik, React Hook Form) | `input` widget with field binding          | Validation from model metadata. No schema duplication.   |

## State management

React:

```tsx
const [selectedId, setSelectedId] = useState(null);
const [drawerOpen, setDrawerOpen] = useState(false);

<Table
  onRowClick={(row) => {
    setSelectedId(row.id);
    setDrawerOpen(true);
  }}
/>;

{
  drawerOpen && (
    <Drawer onClose={() => setDrawerOpen(false)}>
      <OrderDetail id={selectedId} />
    </Drawer>
  );
}
```

Rangka:

```typescript
{ type: 'table', source: { model: 'sales.order' },
  on: { rowClick: { type: 'setValues', values: {
    '$state.selectedId': '{{id}}',
    '$state.drawerOpen': true,
  } } },
  children: [...] },

{ type: 'drawer', visible: { field: '$state.drawerOpen', operator: 'eq', value: true },
  children: [
    { type: 'data', source: { model: 'sales.order', id: '$state.selectedId' }, children: [...] },
  ] }
```

No useState. No setter callbacks. No re-render coordination. Set the values, everything reacts.

## Data fetching

React:

```tsx
function OrderDetail({ id }) {
  const { data, isLoading, error } = useQuery(['order', id], () => fetchOrder(id));

  if (isLoading) return <Skeleton />;
  if (error) return <Error />;

  return (
    <div>
      <h1>{data.name}</h1>
      <Badge>{data.status}</Badge>
    </div>
  );
}
```

Rangka:

```typescript
{ type: 'data', source: { model: 'sales.order', id: '$state.selectedId' },
  props: { loading: 'Loading...', placeholder: 'Select an order' },
  children: [
    { type: 'text', bind: { field: 'name' }, props: { style: 'heading' } },
    { type: 'badge', bind: { field: 'status' } },
  ] }
```

No hook. No loading/error branching in your code. The `data` widget handles all fetch states internally.

## When you still write React

Custom widgets use React. When the built-in widgets cannot express what you need, you write a `defineWidget()` with a React component. Inside that component, you have full React power plus framework hooks.

```tsx
defineWidget({
  name: 'sales.pipeline-board',
  label: 'Pipeline Board',
  category: 'display',
  schema: { groupBy: { type: 'string', required: true } },
  binding: 'none',
  triggers: ['cardClick'],
  container: false,
  component: ({ props, on }) => {
    const state = usePageState();
    // Full React here — hooks, effects, third-party libraries
    return <KanbanBoard groupBy={props.groupBy} onClick={(id) => on.cardClick?.(id)} />;
  },
});
```

The boundary is clear: the framework handles standard CRUD screens declaratively. You write React only for genuinely custom interactions.

## What you give up

- **Arbitrary render logic.** You cannot conditionally render based on complex JS expressions. Conditions are field/operator/value comparisons.
- **Custom hooks everywhere.** Framework hooks only available inside custom widgets.
- **Component composition patterns.** No render props, no HOCs, no compound components. Widget trees are the composition model.
- **Client-side routing control.** Routes are derived from page definitions. No React Router.

## What you gain

- **No boilerplate.** No form state, no fetch wrappers, no loading skeletons, no error boundaries per component.
- **Serializable UI.** The entire page is JSON. A visual editor can produce and consume it.
- **Consistency.** Every screen follows the same data flow. No "which state library did this team use?"
- **Speed.** Standard CRUD screens take minutes, not hours. Save React for the 20% that is genuinely custom.
