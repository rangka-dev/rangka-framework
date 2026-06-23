# Realtime Primitives

> **Experimental idea** — this is an exploration, not a committed design. The primitives described here are not implemented.

## Motivation

The widget system is reactive on the client. State changes propagate through bindings automatically. But all state originates from the local session. When data changes on the server (another user, a hook, a job), the client doesn't know until the next manual fetch.

Realtime primitives close that gap. The framework can push server-side changes into the client's reactive tree using the same mechanisms that already exist.

## Proof of concept: chat

Chat is the hardest realtime UI to express declaratively. It combines live collection updates, ephemeral shared state, presence, optimistic inserts, ordering, and scoped subscriptions. If the widget system can express a full chat without custom components, simpler cases (notifications, activity feeds, collaborative indicators) are trivially covered.

```typescript
definePage({
  key: 'messaging.conversation',
  multiplayer: true,
  widgets: [
    { type: 'presence', props: { display: 'avatars' } },

    {
      type: 'text',
      visible: { field: '$shared.typing', operator: 'notEmpty' },
      bind: { expression: '{{$shared.typing}} is typing...' },
    },

    {
      type: 'data',
      source: { model: 'messaging.message', filter: { conversation_id: '$route.id' } },
      realtime: true,
      children: [
        {
          type: 'repeat',
          props: { scrollable: true, direction: 'bottom-up', pageSize: 50 },
          on: { scrollTop: { type: 'model.list', append: 'prepend' } },
          children: [
            {
              type: 'group',
              props: { direction: 'row' },
              children: [
                { type: 'text', bind: { field: 'sender.name' }, props: { style: 'label' } },
                { type: 'text', bind: { field: 'body' } },
                { type: 'text', bind: { field: 'created_at' }, props: { style: 'caption' } },
              ],
            },
          ],
        },
      ],
    },

    {
      type: 'group',
      props: { direction: 'row' },
      children: [
        {
          type: 'input',
          bind: { field: '$state.draft' },
          on: {
            change: { type: 'setShared', field: 'typing', value: '$session.user.name' },
            blur: { type: 'clearShared', field: 'typing' },
          },
        },
        {
          type: 'button',
          props: { label: 'Send' },
          on: {
            click: {
              type: 'sequence',
              actions: [
                {
                  type: 'model.create',
                  model: 'messaging.message',
                  data: {
                    conversation_id: '$route.id',
                    widgets: '$state.draft',
                    sender_id: '$session.user.id',
                  },
                },
                { type: 'clearValue', field: '$state.draft' },
                { type: 'clearShared', field: 'typing' },
              ],
            },
          },
        },
      ],
    },
  ],
});
```

## New primitives

Three additions to the existing widget system.

### 1. `realtime: true` on data widgets

When a `data` or `table` widget declares `realtime: true`, the framework subscribes to server-side changes matching the current source and filter. Inserts, updates, and deletes are applied to the local collection automatically.

```typescript
{ type: 'data',
  source: { model: 'sales.order', filter: { status: 'draft' } },
  realtime: true,
  children: [...] }
```

The subscription lifecycle follows the widget lifecycle. Mount subscribes. Unmount unsubscribes. Filter changes re-subscribe.

For single-record mode (source has an `id`), the framework patches the record in place when an update arrives.

### 2. `$shared` namespace

Ephemeral key-value state shared across all users viewing the same page and record. Scoped to `page + record`. When everyone leaves, the state evaporates.

```
$shared.typing         // who's typing
$shared.editingField   // which field someone is focused on
$shared.selectedTab    // a collaboratively shared tab selection
```

Same reactive rules as `$state`. Widgets bind to it, conditions reference it, it drives re-renders.

New actions:

| Action        | Behavior                                   |
| ------------- | ------------------------------------------ |
| `setShared`   | Broadcast a key-value to all other viewers |
| `clearShared` | Remove a shared key                        |

```typescript
{ type: 'setShared', field: 'typing', value: '$session.user.name' }
{ type: 'clearShared', field: 'typing' }
```

Conflict resolution: last-write-wins. These are ephemeral signals, not persisted data.

### 3. Presence

Automatic. When `multiplayer: true` is set on a page, the framework tracks which users have the page mounted. A built-in `presence` widget renders the list.

```typescript
{ type: 'presence', props: { display: 'avatars' } }
```

No subscription code. No actions needed. Mount joins, unmount leaves, disconnect cleans up.

## Reactive namespace summary

| Namespace                     | Source              | Writable              | Persisted | Scope                      |
| ----------------------------- | ------------------- | --------------------- | --------- | -------------------------- |
| `$state`                      | Local UI            | Yes                   | No        | Tab                        |
| `$filter` / `$sort` / `$page` | Local UI            | Yes                   | No        | Tab                        |
| `$shared`                     | WebSocket broadcast | Yes (via `setShared`) | No        | Page + record, all viewers |
| `$presence`                   | WebSocket presence  | Read-only             | No        | Page + record, all viewers |

## Widget additions

### `repeat` with virtual scrolling

For large collections (chat history, activity logs), the `repeat` widget supports virtual rendering.

```typescript
{ type: 'repeat',
  props: {
    scrollable: true,       // enable virtual list
    direction: 'bottom-up', // anchor to bottom, new items appear below
    pageSize: 50,           // records per fetch
  },
  on: {
    scrollTop: { type: 'model.list', append: 'prepend' },  // load older
  },
  children: [...] }
```

Only DOM nodes for the visible viewport are rendered. The client maintains a buffer window. Scroll triggers page loading in either direction. Whether the collection has 100 or 1 million records, the DOM stays fixed size.

### `presence` widget

Renders the list of users currently viewing the page.

```typescript
{ type: 'presence', props: { display: 'avatars' | 'list' | 'count' } }
```

## Optimistic inserts

When `model.create` fires inside a `realtime: true` data widget and the created record matches the widget's source model, the framework immediately inserts a placeholder into the local collection. When the server confirms via the realtime subscription, the placeholder is replaced. On failure, it is removed and an error surfaces.

No explicit syntax. The framework infers this from context.

## Server architecture (sketch)

1. WebSocket connection authenticates via existing JWT session
2. Client sends subscription intents derived from mounted data widgets
3. Server validates against the user's permissions (can they read this model?)
4. Server listens to Postgres changes (LISTEN/NOTIFY or logical replication)
5. On change, server matches against active subscriptions and pushes to authorized clients
6. `$shared` state routes through the server as ephemeral pub/sub (no persistence)
7. Presence tracked server-side with automatic cleanup on disconnect

## Open questions

- Should `realtime: true` be opt-in per widget, or a page-level default when `multiplayer: true` is set?
- Should `$shared` support nested values or stay flat like `$state`?
- What's the right transport for the server listener? LISTEN/NOTIFY is simpler but has payload size limits. Logical replication is more powerful but more complex to operate.
- Should the virtual `repeat` buffer have a max size (evict oldest pages when memory grows)?
- How does `realtime: true` interact with `$filter`? If a filter changes, does the subscription update immediately?
