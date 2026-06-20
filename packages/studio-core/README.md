# @rangka/studio-core

Backend runtime for Rangka Studio, the AI-powered development environment.

## How it works

Runs a WebSocket server that connects the studio UI to the framework runtime and an AI coding agent. Boots the framework via `@rangka/core`, watches project files for changes, and provides introspection and scaffolding tools to the AI agent.

## Architecture

```
src/
├── server.ts          — WebSocket server, message routing
├── runtime-manager.ts — Boots @rangka/core, introspects state, applies DDL
├── agent-engine.ts    — AI agent session lifecycle (create, resume, stream)
├── tools.ts           — AI tools (introspect models/pages, scaffold, reference docs)
├── system-prompt.ts   — System prompt for studio agent
├── protocol.ts        — Typed WebSocket messages (ServerMessage, ClientMessage)
├── config.ts          — Settings persistence (API key, model selection)
├── file-watcher.ts    — Chokidar-based project file watching
├── dev.ts             — Direct dev entry point
├── generated/         — Build-time bundled reference docs
└── index.ts           — Public exports
```

## Key internals

| Component        | Purpose                                             |
| ---------------- | --------------------------------------------------- |
| `StudioServer`   | WebSocket lifecycle, routes messages to handlers    |
| `RuntimeManager` | Holds `BootResult` from core, exposes introspection |
| `AgentEngine`    | Wraps `@earendil-works/pi-coding-agent` sessions    |
| `FileWatcher`    | Triggers runtime reboot on file changes             |
| `protocol.ts`    | Single source of truth for all message types        |

## Commands

```bash
pnpm --filter @rangka/studio-core build   # Build (prebuild bundles docs)
pnpm --filter @rangka/studio-core dev     # Start dev server
pnpm --filter @rangka/studio-core test    # Run tests
```

## Contributing

- WebSocket protocol is defined in `protocol.ts`. Add new message types to the `ServerMessage` or `ClientMessage` unions there.
- AI tools follow the `ToolDefinition` interface in `tools.ts`. Add new tools there.
- Framework introspection goes through `RuntimeManager`. Never import core internals directly in other files.
- Agent sessions are managed by `AgentEngine`. Don't create parallel session management.
- The `generated/` directory is built at compile time by `scripts/bundle-docs.ts`. Don't edit manually.
