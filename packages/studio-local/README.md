# @rangka/studio-local

Frontend UI for Rangka Studio.

## How it works

A React SPA that connects to `@rangka/studio-core` via WebSocket. Provides the chat interface, model/page explorer, DDL diff viewer, and settings panel for the AI-powered development environment.

## Architecture

```
src/
├── components/   — UI components (chat, explorer, diff viewer, settings)
├── hooks/        — React hooks (WebSocket connection, state management)
├── lib/          — Utilities
├── mock/         — Mock data for development
├── assets/       — Static assets
├── App.tsx       — Root component
└── main.tsx      — Entry point
```

## Commands

```bash
pnpm --filter @rangka/studio-local build   # Production build (Vite)
pnpm --filter @rangka/studio-local dev     # Dev server with HMR
```

## Contributing

- Communicates with `@rangka/studio-core` via WebSocket using typed messages from `@rangka/studio-core/protocol`
- All message types are defined in `@rangka/studio-core`. Don't define protocol types here.
- This is a standalone React app. It does not import from `@rangka/core` or `@rangka/client`.
