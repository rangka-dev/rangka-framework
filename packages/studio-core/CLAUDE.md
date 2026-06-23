# CLAUDE.md — @rangka/studio-core

## Package overview

The Rangka Studio backend. Provides the AI agent runtime, WebSocket server, file watcher, and subprocess manager for the studio development environment. The framework (`@rangka/core`) runs as a forked child process communicating over Node IPC.

## Tech stack

- Node.js >= 20, TypeScript 5
- WebSocket (ws) for real-time client communication
- `@earendil-works/pi-coding-agent` for AI agent sessions
- `@rangka/core` for framework boot and introspection (runs in child process)
- Node `child_process.fork()` for subprocess IPC
- Kysely + pg for parent-side read-only DB pool
- Chokidar for file watching
- TypeBox for schema validation

## Project structure

```
src/
├── server.ts             — StudioServer: WebSocket server, message routing, client management
├── subprocess-manager.ts — SubprocessManager: forks/kills/restarts child, IPC routing, query DB pool
├── child-process.ts      — Child entry point: 4-step boot pipeline (resolve → introspect → sync → serve)
├── ipc-protocol.ts       — All IPC message types (ChildMessage, ParentMessage, shared interfaces)
├── agent-engine.ts       — AgentEngine: manages AI agent sessions (create, resume, dispose)
├── tools.ts              — Studio-specific AI tools (introspect, apply_changes, sync_schema, get_status, etc.)
├── system-prompt.ts      — System prompt for the studio AI agent
├── protocol.ts           — ServerMessage/ClientMessage types (WebSocket protocol)
├── config.ts             — Studio configuration (load/save API key, model settings)
├── file-watcher.ts       — FileWatcher: watches project files, notifies UI (does NOT trigger restart)
├── dev.ts                — Dev entry point (starts studio server directly)
├── generated/            — Build-time generated files (bundled reference docs)
└── index.ts              — Public exports
```

## Key components

| Component           | File                    | Purpose                                                                      |
| ------------------- | ----------------------- | ---------------------------------------------------------------------------- |
| `StudioServer`      | `server.ts`             | WebSocket server, routes ClientMessage to handlers, broadcasts ServerMessage |
| `SubprocessManager` | `subprocess-manager.ts` | Forks child process, manages lifecycle, IPC routing, parent-side DB pool     |
| `child-process.ts`  | `child-process.ts`      | Standalone forked script. Boots core, runs sync gate, serves app.            |
| `AgentEngine`       | `agent-engine.ts`       | Creates/resumes AI agent sessions, wires tools, handles streaming            |
| `FileWatcher`       | `file-watcher.ts`       | Watches project files, emits `file.changed` (UI notification only)           |
| `createStudioTools` | `tools.ts`              | Defines AI tools the agent can call (all route through SubprocessManager)    |

## Subprocess architecture

The framework runs in a forked child process, not in-process.

```
StudioServer (parent)
├── SubprocessManager → fork() → child-process.ts (child)
│   ├── IPC: parent sends commands (shutdown, approve, introspect, get_status)
│   └── IPC: child reports state (phase, boot_success, sync_pending, errors)
├── AgentEngine (AI sessions, tool monkey-patches)
├── FileWatcher (notifies UI only, no restart)
└── WebSocketServer (browser communication)
```

Child boot pipeline:

1. **Resolve** — `ProjectScanner.scan()` + `boot({ skipAutoSync: true })`
2. **Introspect** — `SchemaToDesired` + `introspect` + `DiffEngine.diff()`, filter destructive ops
3. **Sync gate** — If safe ops exist: report to parent, await approval. If none: skip.
4. **Serve** — Apply DDL, seed core data, create session, serve client shell, listen on port

Restart happens only on explicit `apply_changes` / `sync_schema` tool call or user clicking "Apply Changes". File changes notify the UI but do NOT trigger a restart.

## IPC protocol

Defined in `ipc-protocol.ts`. Two directions:

- `ChildMessage` — child → parent (phase transitions, boot results, sync status, introspect responses)
- `ParentMessage` — parent → child (sync approve/reject, get_status, introspect, shutdown)

When adding a new IPC message, update the union in `ipc-protocol.ts`.

## Agent tools

| Tool            | Purpose                              | Implementation                                                                   |
| --------------- | ------------------------------------ | -------------------------------------------------------------------------------- |
| `apply_changes` | Restart subprocess, return new state | `subprocess.restart()` (synchronous, blocks until boot completes)                |
| `sync_schema`   | Approve pending DDL                  | Restart → broadcast diff to UI → wait approval gate → `subprocess.approveSync()` |
| `get_status`    | Query current state                  | `subprocess.getStatus()` via IPC                                                 |
| `introspect`    | Query registries                     | `subprocess.introspect(type, module)` via IPC (child formats response)           |
| `query_db`      | Read-only SQL                        | Parent-side Kysely pool (no IPC round-trip)                                      |
| `http_request`  | Hit child's Fastify                  | Uses `subprocess.getBaseUrl()` + `subprocess.getSessionToken()`                  |
| `build_widgets` | Compile custom widgets               | Runs in parent process, writes to `.rangka/`                                     |
| `get_status`    | Current subprocess state             | `subprocess.getStatus()` (phase, counts, errors)                                 |

All tools are synchronous from the agent's perspective. The agent never polls.

## Communication protocol

Client ↔ Server communication uses typed messages over WebSocket:

- `ServerMessage` — server → client (status updates, chat deltas, file changes, DDL diffs)
- `ClientMessage` — client → server (chat messages, schema approvals, settings)

All message types are defined in `protocol.ts`. When adding a new message type, add it to the union there.

## Commands

```bash
pnpm --filter @rangka/studio-core build   # Compile TypeScript (runs prebuild: bundle-docs)
pnpm --filter @rangka/studio-core dev     # Start studio server directly (tsx)
pnpm --filter @rangka/studio-core test    # Run tests
pnpm --filter @rangka/studio-core lint    # ESLint
```

## Don'ts

- Don't run framework logic in the parent process. All boot/introspection runs in the child via IPC.
- Don't add new IPC messages without updating `ipc-protocol.ts` unions
- Don't add new WebSocket messages without updating `protocol.ts` unions
- Don't create parallel AI agent management. Use `AgentEngine`.
- Don't access the database for writes in the parent. The parent pool is read-only (`query_db`). All writes happen in the child.
- Don't hardcode tool definitions. Add to `tools.ts` using the existing `ToolDefinition` interface.
- Don't import from `@rangka/client` for runtime logic. studio-core is server-side.
- Don't trigger child restart from file watcher. File changes notify the UI only. Restart is explicit.
