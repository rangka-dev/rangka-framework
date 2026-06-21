# Spec: Modular Boot Pipeline & Studio Subprocess Architecture

Status: Draft
Packages affected: studio-core, core (exports only)

---

## Context

The current `RuntimeManager` in studio-core runs `@rangka/core`'s `boot()` in the same process and uses `rescan()` to hot-patch registries. This rebuilds `SchemaRegistry` but leaves `HookRegistry`, `ServiceRegistry`, `JobRegistry` stale. Old hook chains accumulate, service instances cache, and there's no way to guarantee consistent state. The fix is to run core as a subprocess that gets killed and cleanly respawned on demand.

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│  studio-core (parent process)           │
│  - StudioServer (WebSocket + HTTP)      │
│  - File watcher (notifies UI only)      │
│  - Agent engine                         │
│  - SubprocessManager                    │
└────────────────────┬────────────────────┘
                     │ fork() / IPC channel
                     ▼
┌─────────────────────────────────────────┐
│  child process (long-lived)             │
│  - Boots: resolve → introspect → sync → serve │
│  - Holds all registries + DB + Fastify  │
│  - Reports status via process.send()    │
│  - Killed + respawned on explicit restart │
└─────────────────────────────────────────┘
```

Key principles:

- Child is forked once at studio start, stays alive until explicit restart
- Restart only happens when agent calls `apply_changes` or user clicks "Apply Changes"
- File watcher notifies the UI that files changed. Does NOT trigger restart.
- IPC uses Node's built-in `fork()` channel (`process.send()` / `child.on('message')`). Not stdout.
- The 4-step pipeline is internal to the child's boot sequence. Not exposed as tools or CLI commands.

---

## End-to-End Flow

### Studio Startup

1. `StudioServer.start()` creates `SubprocessManager`
2. `SubprocessManager.start()` forks `child-process.ts`
3. Child runs: resolve → introspect → (sync gate if needed) → serve
4. Child reports `boot_success` with status, session token, and DB config
5. Parent opens a read-only DB connection using the received config
6. Parent broadcasts `runtime.status: ready` to WebSocket clients
7. Studio UI is live, preview app running on :3000

### Agent Edits Files, Applies Changes

1. Agent writes/modifies model/page/service files
2. File watcher notifies UI: "files changed since last apply"
3. Agent calls `apply_changes` tool when ready
4. Tool calls `subprocess.restart()`. Kills child, forks new one.
5. New child boots from scratch (clean module cache, fresh registries)
6. If no schema diff: child reaches `serving`, tool returns success + counts
7. If schema diff exists: child enters `waiting_for_sync`, tool returns pending ops

### Schema Sync Approval

1. `apply_changes` returns "3 schema operations pending approval"
2. Agent calls `sync_schema` tool
3. Tool broadcasts `schema.diff` to UI, waits for approval gate
4. User sees diff in UI, clicks "Approve All"
5. UI sends `schema.approve` → parent sends `parent:sync_approve` to child
6. Child applies DDL, starts server, reports `boot_success`
7. Tool returns "synced, server running"

Only non-destructive operations are ever presented. Destructive ops (DROP TABLE, DROP COLUMN, etc.) are filtered out during introspect and never applied. Data loss prevention is handled by a future migration system, not studio.

### User Clicks "Apply Changes" Button

1. UI sends `runtime.apply` WebSocket message
2. Server calls `subprocess.restart()`
3. Same flow as agent-triggered restart
4. Results broadcast to all connected clients

---

## IPC Protocol

All messages use Node's built-in IPC channel. Stdout stays clean for logs.

### Child → Parent

```typescript
type ChildMessage =
  | { type: 'child:phase'; phase: ChildPhase }
  | {
      type: 'child:boot_success';
      status: RuntimeStatus;
      sessionToken: string | null;
      dbConfig: DatabaseConfig;
    }
  | { type: 'child:boot_error'; error: string; phase: ChildPhase; details?: string }
  | { type: 'child:sync_pending'; operations: SerializedDdlOperation[] }
  | { type: 'child:sync_applied'; appliedIds: string[] }
  | { type: 'child:sync_error'; error: string; appliedIds: string[] }
  | { type: 'child:serving'; port: number }
  | { type: 'child:status_response'; requestId: string; status: ChildStatusSnapshot }
  | { type: 'child:introspect_response'; requestId: string; data: unknown[]; count: number }
  | { type: 'child:introspect_error'; requestId: string; error: string }
  | { type: 'child:log'; level: 'info' | 'warn' | 'error'; message: string };
```

### Parent → Child

```typescript
type ParentMessage =
  | { type: 'parent:sync_approve'; operationIds: string[] }
  | { type: 'parent:sync_reject'; reason?: string }
  | { type: 'parent:get_status'; requestId: string }
  | { type: 'parent:introspect'; requestId: string; resource: IntrospectType; module?: string }
  | { type: 'parent:shutdown' };
```

### Shared Types

```typescript
type ChildPhase =
  | 'resolving'
  | 'introspecting'
  | 'waiting_for_sync'
  | 'syncing'
  | 'serving'
  | 'stopped'
  | 'error';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

interface RuntimeStatus {
  models: number;
  pages: number;
  services: number;
  hooks: number;
  jobs: number;
  modules: string[];
}

interface ChildStatusSnapshot {
  phase: ChildPhase;
  runtime: RuntimeStatus | null;
  pendingOps: SerializedDdlOperation[];
  serverPort: number | null;
  sessionToken: string | null;
  error: string | null;
}

interface SerializedDdlOperation {
  id: string;
  type: string;
  table: string;
  ddl: string;
  destructive: boolean;
  detail?: string;
}
```

---

## Child Process

File: `packages/studio-core/src/child-process.ts`

The child is a standalone script that runs the 4-step boot pipeline:

```
1. RESOLVE    — ProjectScanner.scan() + loadSchemas + mergeSchemas + buildRegistries
2. INTROSPECT — connect DB, SchemaToDesired + introspect + DiffEngine.diff(), filter to safe ops only
3. SYNC GATE  — if safe ops exist: report ops, wait for parent approval. If no ops: skip.
4. SERVE      — apply approved DDL, seed core data, create session, start Fastify, serve .rangka/ static, listen on port, report ready
```

Behavior:

- Reads config from env vars: `RANGKA_PROJECT_ROOT`, `RANGKA_FRAMEWORK_PORT`
- Reports each phase transition via `child:phase`
- Handles `parent:get_status` and `parent:introspect` at any time (even while serving)
- On `parent:shutdown`: closes server, destroys DB pool, exits cleanly
- Always registers `.rangka/` as a static route during serve (if directory exists). Custom widget bundles are served automatically.
- Destructive operations (DROP TABLE, DROP COLUMN, ALTER COLUMN TYPE) are never applied. They are filtered out during introspect and excluded from `sync_pending`. Data loss prevention is deferred to a future migration system.

The sync gate is a simple awaited Promise that resolves when `parent:sync_approve` or `parent:sync_reject` arrives via IPC.

---

## Widget Build Pipeline

The `build_widgets` tool runs in the parent process (calls `buildWidgets()` from `@rangka/cli/build`). It writes compiled bundles to `.rangka/` in the project root. Since the child always serves `.rangka/` as a static directory, new bundles are immediately available without restart or IPC coordination.

Flow: agent creates widget source → agent calls `build_widgets` → parent runs esbuild → output written to `.rangka/` → child already serves it → `reload_preview` refreshes the UI.

---

## SubprocessManager

File: `packages/studio-core/src/subprocess-manager.ts`

Replaces `RuntimeManager`. Lives in the parent process.

```typescript
class SubprocessManager extends EventEmitter {
  // Lifecycle
  async start(): Promise<void>; // Fork child, wait for boot_success or sync_pending
  async restart(): Promise<void>; // kill() + start()
  async kill(): Promise<void>; // Graceful shutdown (SIGTERM → wait 5s → SIGKILL)

  // Sync control
  async approveSync(ids: string[]): Promise<{ applied: boolean; error?: string }>;
  rejectSync(reason?: string): void;

  // Queries (round-trip IPC to child)
  async getStatus(): Promise<ChildStatusSnapshot>;
  async introspect(
    type: IntrospectType,
    module?: string,
  ): Promise<{ data: unknown[]; count: number }>;

  // Cached state (no round-trip needed)
  getPhase(): ChildPhase;
  isRunning(): boolean;
  isWaitingForSync(): boolean;
  getSessionToken(): string | null;
  getBaseUrl(): string;

  // Events emitted
  phase(phase: ChildPhase);
  ready(status: RuntimeStatus, sessionToken: string | null);
  error(error: string, phase: ChildPhase);
  sync_pending(operations: SerializedDdlOperation[]);
  serving(port: number);
  exit(code: number | null, signal: string | null);
}
```

Config:

```typescript
interface SubprocessManagerConfig {
  projectRoot: string;
  frameworkPort?: number;
  bootTimeout?: number; // default 30000ms
}
```

---

## Agent Tools

Three primary tools replace the current set:

| Tool            | Purpose                       | Implementation                                                         |
| --------------- | ----------------------------- | ---------------------------------------------------------------------- |
| `apply_changes` | Restart app, return new state | `subprocess.restart()` → return status or pending ops                  |
| `sync_schema`   | Approve pending DDL           | Broadcast diff to UI → wait approval gate → `subprocess.approveSync()` |
| `get_status`    | Query current state           | `subprocess.getStatus()` → format summary                              |

The existing `introspect` tool stays but calls `subprocess.introspect(type, module)` instead of reading from in-process `BootResult`.

Tools that don't change: `delete_file`, `http_request`, `reload_preview`, `build_widgets`, `list_docs`, `read_doc`.

The `query_db` tool uses a read-only DB connection in the parent process. The child sends parsed `DatabaseConfig` in `boot_success`. The parent opens a lightweight Kysely pool (size=1) from that config. Single source of truth. Parent never parses `rangka.config.ts` itself.

---

## Integration with StudioServer

Changes to `server.ts`:

- Replace `private runtime: RuntimeManager` with `private subprocess: SubprocessManager`
- Wire SubprocessManager events to WebSocket broadcasts:
  - `'ready'` → broadcast `runtime.status: ready`
  - `'error'` → broadcast `runtime.error`
  - `'sync_pending'` → broadcast `schema.diff`
  - `'exit'` → broadcast `runtime.error` (crashed)
- Message handlers:
  - `runtime.apply` → `subprocess.restart()` + broadcast result
  - `schema.approve` → `subprocess.approveSync(ids)` + broadcast `schema.applied`
  - `schema.reject` → `subprocess.rejectSync(reason)`

---

## Error Handling

| Scenario                                   | Behavior                                                                                             |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Resolve failure (bad syntax, missing refs) | Child sends `boot_error` with phase=resolving, exits. Parent reports error. Agent can fix and retry. |
| DB connection failure                      | Child sends `boot_error` with phase=introspecting. Parent reports.                                   |
| DDL apply failure (partial)                | Child sends `sync_error` with what succeeded. Proceeds to serve with partial schema.                 |
| Destructive ops detected                   | Filtered out during introspect. Never presented, never applied. Not an error.                        |
| Child crash (unexpected exit)              | Parent catches `exit` event, rejects pending promises, emits error.                                  |
| Boot timeout (30s default)                 | Parent kills child, rejects with timeout error.                                                      |
| Graceful shutdown                          | `parent:shutdown` → child closes Fastify + DB → exits 0. Parent waits 5s then SIGKILL if stuck.      |

---

## File Layout

| File                        | Action | Purpose                                               |
| --------------------------- | ------ | ----------------------------------------------------- |
| `src/ipc-protocol.ts`       | NEW    | All IPC message types + shared interfaces             |
| `src/child-process.ts`      | NEW    | Child entry point (forked script, runs boot pipeline) |
| `src/subprocess-manager.ts` | NEW    | SubprocessManager class                               |
| `src/runtime-manager.ts`    | DELETE | Replaced entirely                                     |
| `src/server.ts`             | MODIFY | Wire SubprocessManager instead of RuntimeManager      |
| `src/tools.ts`              | MODIFY | Rewrite tools to use SubprocessManager                |
| `src/agent-engine.ts`       | MODIFY | Pass SubprocessManager, adjust schema gate            |

---

## Implementation Order

1. `ipc-protocol.ts` — types only, no runtime deps
2. `child-process.ts` — extract boot logic into standalone script with IPC reporting
3. `subprocess-manager.ts` — fork/kill/message management
4. Update `tools.ts` — swap RuntimeManager for SubprocessManager
5. Update `server.ts` — replace RuntimeManager instantiation and event wiring
6. Update `agent-engine.ts` — adjust schema gate to work with subprocess
7. Delete `runtime-manager.ts`
8. Add parent-side read-only DB connection for `query_db` tool (using dbConfig from boot_success)

---

## Existing Code to Reuse

| What                                          | From                                 | In                                          |
| --------------------------------------------- | ------------------------------------ | ------------------------------------------- |
| `ProjectScanner.scan()`                       | `@rangka/core`                       | child-process.ts (resolve step)             |
| `boot()` with `skipAutoSync: true`            | `@rangka/core`                       | child-process.ts (resolve + serve)          |
| `SchemaToDesired`, `introspect`, `DiffEngine` | `@rangka/core`                       | child-process.ts (introspect step)          |
| `sql.raw().execute()` for DDL                 | `kysely`                             | child-process.ts (sync step)                |
| `createStudioSession()` logic                 | current `runtime-manager.ts:88-122`  | child-process.ts (serve step)               |
| `serveClientShell()` logic                    | current `runtime-manager.ts:124-160` | child-process.ts (serve step)               |
| `introspectResource()`                        | current `tools.ts:35-227`            | child-process.ts (introspect handler)       |
| `buildWidgets()`                              | `@rangka/cli/build`                  | tools.ts (stays in parent)                  |
| Schema approval gate pattern                  | current `agent-engine.ts`            | tools.ts sync_schema (same Promise pattern) |

---

## Verification

1. `pnpm build` passes (studio-core compiles clean)
2. Start studio with a test app → child boots, UI shows "ready", preview works on :3000
3. Edit a model file → UI shows "files changed" (no restart yet)
4. Click "Apply Changes" → child restarts, new model appears in status
5. Add a new field → apply → schema diff shown → approve → DDL applied → server resumes
6. Kill child manually (SIGKILL) → parent detects crash, UI shows error
7. Agent calls `apply_changes` tool → gets structured response
8. Agent calls `get_status` → sees current registry state
9. `query_db` works (parent's read-only connection)
10. `http_request` works (hits child's Fastify on :3000)
