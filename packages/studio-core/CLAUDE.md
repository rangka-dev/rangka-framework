# CLAUDE.md — @rangka/studio-core

## Package overview

The Rangka Studio backend. Provides the AI agent runtime, WebSocket server, file watcher, and framework runtime manager for the studio development environment. Connects the studio UI to the framework and the AI coding agent.

## Tech stack

- Node.js >= 20, TypeScript 5
- WebSocket (ws) for real-time client communication
- `@earendil-works/pi-coding-agent` for AI agent sessions
- `@rangka/core` for framework boot and introspection
- Chokidar for file watching
- TypeBox for schema validation

## Project structure

```
src/
├── server.ts          — StudioServer: WebSocket server, message routing, client management
├── runtime-manager.ts — RuntimeManager: boots framework, introspects state, applies DDL
├── agent-engine.ts    — AgentEngine: manages AI agent sessions (create, resume, dispose)
├── tools.ts           — Studio-specific AI tools (introspect, scaffold, reference docs)
├── system-prompt.ts   — System prompt for the studio AI agent
├── protocol.ts        — ServerMessage/ClientMessage types (WebSocket protocol)
├── config.ts          — Studio configuration (load/save API key, model settings)
├── file-watcher.ts    — FileWatcher: watches project files, triggers reload
├── dev.ts             — Dev entry point (starts studio server directly)
├── generated/         — Build-time generated files (bundled reference docs)
└── index.ts           — Public exports
```

## Key components

| Component           | File                 | Purpose                                                                         |
| ------------------- | -------------------- | ------------------------------------------------------------------------------- |
| `StudioServer`      | `server.ts`          | WebSocket server, routes ClientMessage to handlers, broadcasts ServerMessage    |
| `RuntimeManager`    | `runtime-manager.ts` | Boots `@rangka/core`, exposes introspection (models, pages, services, DDL diff) |
| `AgentEngine`       | `agent-engine.ts`    | Creates/resumes AI agent sessions, wires tools, handles streaming               |
| `FileWatcher`       | `file-watcher.ts`    | Watches project files, emits `file.changed` and triggers runtime reboot         |
| `createStudioTools` | `tools.ts`           | Defines AI tools the agent can call (introspect, scaffold, lookup docs)         |

## Communication protocol

Client ↔ Server communication uses typed messages over WebSocket:

- `ServerMessage` — server → client (status updates, chat deltas, file changes, DDL diffs)
- `ClientMessage` — client → server (chat messages, schema approvals, settings)

All message types are defined in `protocol.ts`. When adding a new message type, add it to the union there.

## How it connects to the framework

`RuntimeManager` imports and calls `boot()` from `@rangka/core`. It holds the `BootResult` and uses it for:

- Introspecting models, pages, services, hooks via `SchemaRegistry`
- Computing DDL diffs via `DiffEngine` and `introspect`
- Applying schema changes on user approval
- Providing a session token for API calls

The studio never duplicates core logic. It calls into core's public API.

## Commands

```bash
pnpm --filter @rangka/studio-core build   # Compile TypeScript (runs prebuild: bundle-docs)
pnpm --filter @rangka/studio-core dev     # Start studio server directly (tsx)
pnpm --filter @rangka/studio-core test    # Run tests
```

## Don'ts

- Don't duplicate framework boot/introspection logic — use `RuntimeManager` which calls `@rangka/core`
- Don't add new message types without updating `protocol.ts` unions
- Don't create parallel AI agent management — use `AgentEngine`
- Don't access the database directly — go through `RuntimeManager.getBootResult().db`
- Don't hardcode tool definitions — add to `tools.ts` using the existing `ToolDefinition` interface
- Don't import from `@rangka/client` for runtime logic — studio-core is server-side
