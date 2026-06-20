# CLAUDE.md — @rangka/studio-local

## Package overview

The Rangka Studio frontend. A React SPA that provides the AI chat interface, resource explorer, schema diff viewer, and settings panel. Connects to `@rangka/studio-core` via WebSocket.

## Tech stack

- React 19, TypeScript 5
- Tailwind CSS v4
- Vite (build and dev server)
- WebSocket for real-time communication with studio-core
- `@rangka/studio-core/protocol` for typed messages

## Project structure

```
src/
├── components/
│   ├── chat/       — Chat interface (input, messages, tool calls, schema diff)
│   ├── canvas/     — Visual canvas for model graphs
│   ├── code/       — Code editor/viewer components
│   ├── layout/     — Shell layout (Canvas, LeftPanel, TopBar, StatusBar)
│   ├── resources/  — Model/page/service explorer
│   ├── settings/   — API key, model selection, config
│   └── ui/         — Shared UI primitives (shadcn)
├── hooks/
│   └── useStudio.tsx — Central state: WebSocket connection, messages, runtime status
├── lib/            — Utilities (WebSocket client, helpers)
├── mock/           — Mock data for development without backend
├── App.tsx         — Root component
└── main.tsx        — Entry point
```

## Key internals

### useStudio hook

`hooks/useStudio.tsx` is the central state manager. It provides:

- WebSocket connection lifecycle
- Chat message state (send, receive, stream)
- Runtime status (booting/ready/error, model count)
- Session management (create, resume, list)
- Schema diff approval flow
- Resource data (modules, models, graph)

All components access studio state through `useStudio()`. Never create parallel WebSocket connections or state management.

### Communication protocol

All messages are typed in `@rangka/studio-core/protocol`:

- `ServerMessage` — incoming from studio-core (chat deltas, runtime status, file changes, DDL diffs)
- `ClientMessage` — outgoing to studio-core (chat input, schema approvals, settings)

Import types from `@rangka/studio-core/protocol`, never redefine them locally.

### Component organization

- `layout/` — top-level shell structure (panels, bars)
- `chat/` — chat-specific UI (messages, input, tool call rendering)
- `resources/` — model/page explorer panels
- `ui/` — shadcn primitives shared across all components

## Commands

```bash
pnpm --filter @rangka/studio-local build   # Production build (Vite)
pnpm --filter @rangka/studio-local dev     # Dev server with HMR
```

## Don'ts

- Don't create parallel WebSocket connections — use `useStudio()` context
- Don't define protocol message types locally — import from `@rangka/studio-core/protocol`
- Don't import from `@rangka/core` or `@rangka/client` — this is an independent React app
- Don't bypass `useStudio()` for state — all chat, runtime, and session state lives there
- Don't hardcode WebSocket URLs — use the connection config from `lib/ws`
- Don't use inline styles — use Tailwind classes
- Don't add UI primitives outside `components/ui/` — use existing shadcn components
