# Rangka Studio

> **Status: To be implemented**

## Motivation

The framework's 4 definition types (defineModel, definePage, defineService, defineHook) are compact, structured, and predictable. This makes them ideal targets for AI generation. Non-code users can describe what they want in natural language, and an AI agent produces valid definitions that the existing runtime interprets immediately.

Studio is a local development tool that lets users build and preview Rangka apps through natural language conversation. It runs via `rangka studio` and serves a web-based IDE on localhost.

Studio Core is also the foundation for the managed Rangka Platform, where the same agent runtime powers a hosted multi-user experience.

## Architecture

### System components

```
rangka studio (CLI command)
  │
  ├── Studio Core (@rangka/studio-core)
  │     ├── Agent Engine (Pi Agent SDK)
  │     │     ├── System prompt (framework overview + conventions)
  │     │     ├── Custom tools (introspect, schema diff, reload)
  │     │     ├── Docs search tool (framework documentation)
  │     │     └── Built-in tools (read, write, edit files)
  │     │
  │     ├── Runtime Manager
  │     │     ├── Boots @rangka/core (scan, resolve, serve API)
  │     │     ├── File watcher → re-scan on changes
  │     │     ├── Validation error capture → feed back to agent
  │     │     └── Schema diff (model changes → ask user before DDL)
  │     │
  │     └── WebSocket API
  │           ├── Chat messages (streaming tokens)
  │           ├── File change events
  │           ├── Preview reload signals
  │           ├── Schema diff approval requests
  │           └── Element selection from preview
  │
  └── Studio Local (@rangka/studio-local)
        └── Web UI (React app on localhost)
              ├── Left Panel (3 tabs)
              │     ├── Chat — conversation with agent
              │     ├── Resources — model/page/service/hook tree
              │     └── Code — file tree with Monaco editor
              │
              └── Canvas (tabbed)
                    ├── Preview — live app in iframe
                    ├── Model Graph — react-flow visualizer
                    └── Code tabs — Monaco editor per file
```

### Package structure

```
packages/
  studio-core/     — headless: agent engine, runtime manager, WebSocket API
  studio-local/    — UI: React app served on localhost by CLI
```

### Two deployment modes

| Concern      | CLI Mode (local)            | Platform Mode (hosted)                   |
| ------------ | --------------------------- | ---------------------------------------- |
| UI           | Studio Local (bundled)      | Platform UI (proprietary, separate repo) |
| Process      | Single process on localhost | Pod per app, spun up on demand           |
| File storage | Local filesystem            | Workspace volume                         |
| Database     | User's Postgres             | Platform-provisioned Postgres            |
| AI keys      | BYOK (user's API key)       | Platform-provided (metered)              |
| Users        | Single developer            | Multi-user with roles                    |
| Build/Deploy | Manual                      | Platform-managed                         |
| Monitoring   | None                        | Platform-provided                        |

Both modes connect to Studio Core via the same WebSocket protocol.

## Studio Core

### Agent Engine

Uses Pi Agent SDK for conversation management, tool dispatch, and streaming.

```typescript
import { createAgentSession } from '@anthropic-ai/pi-coding-agent';

const { session } = await createAgentSession({
  tools: [...builtInTools, ...customTools],
  systemPrompt: frameworkOverview,
});
```

The agent has:

- **System prompt** — framework overview, conventions, definition patterns, available widget types. Enough context to generate valid definitions without querying docs for every action.
- **Built-in tools** — read, write, edit files (from Pi SDK). Handles all file generation.
- **Custom tools** — framework-specific operations (see below).
- **Docs search tool** — queries framework documentation on demand for detailed API reference.

### Custom tools

| Tool                    | Purpose                                            |
| ----------------------- | -------------------------------------------------- |
| `introspect_models`     | List all models with fields, relationships, traits |
| `introspect_pages`      | List all pages with widget trees                   |
| `introspect_services`   | List all services with methods                     |
| `introspect_navigation` | Get current navigation structure                   |
| `list_widget_types`     | Available widget types with accepted props         |
| `schema_diff`           | Generate DDL diff for pending model changes        |
| `reload_preview`        | Trigger runtime re-scan and preview reload         |
| `search_docs`           | Search framework documentation                     |

### Runtime Manager

Wraps `@rangka/core` boot pipeline. Manages the framework lifecycle within Studio.

Responsibilities:

- Boot the framework (scan → resolve → DB connect → serve API)
- Watch definition files for changes
- Re-scan on file change (triggered by agent writes or manual edits)
- Capture validation errors and feed them back to the agent
- Serve the client shell as the preview app
- Hold schema diffs for user approval before applying DDL

### Schema management

Schema sync is not automatic. When the agent modifies a model:

1. Agent writes the model file
2. Runtime re-scans and resolves the new model
3. Runtime generates schema diff (new columns, new tables, etc.)
4. Studio sends diff to the UI as an approval request
5. User reviews the diff in chat and approves or rejects
6. If approved, DDL is applied to the database
7. If rejected, agent is informed and can adjust

This prevents accidental data loss from AI-generated model changes.

### WebSocket API

The protocol between Studio Core and any UI client.

Message types (server → client):

| Type               | Payload                                                      | Description                   |
| ------------------ | ------------------------------------------------------------ | ----------------------------- |
| `chat.delta`       | `{ text: string }`                                           | Streaming token from agent    |
| `chat.complete`    | `{ messageId: string }`                                      | Agent finished responding     |
| `chat.tool_use`    | `{ tool: string, input: object }`                            | Agent is calling a tool       |
| `chat.tool_result` | `{ tool: string, output: object }`                           | Tool execution result         |
| `file.changed`     | `{ path: string, action: 'create' \| 'update' \| 'delete' }` | File was modified             |
| `preview.reload`   | `{}`                                                         | Preview should reload         |
| `schema.diff`      | `{ operations: DdlOperation[] }`                             | Schema diff awaiting approval |
| `runtime.error`    | `{ message: string, file?: string, line?: number }`          | Validation error              |

Message types (client → server):

| Type                  | Payload                                     | Description                     |
| --------------------- | ------------------------------------------- | ------------------------------- |
| `chat.send`           | `{ text: string, context?: object }`        | User message                    |
| `chat.select_element` | `{ widgetPath: string[], pageKey: string }` | User clicked element in preview |
| `schema.approve`      | `{ operationIds: string[] }`                | Approve schema changes          |
| `schema.reject`       | `{ reason?: string }`                       | Reject schema changes           |

### Conversation persistence

Conversations are persisted per project in `.rangka/studio/conversations/`. When the user reopens Studio, they can resume the previous conversation or start fresh. The agent retains awareness of what was previously built.

## Studio Local (UI)

### Layout

```
┌────────────────────────────────────────────────────────┐
│ ┌──────────────┬─────────────────────────────────────┐ │
│ │ Left Panel   │ Canvas                              │ │
│ │              │                                     │ │
│ │ [Chat]       │ [Preview] [Models] [file.ts] ...    │ │
│ │ [Resources]  │                                     │ │
│ │ [Code]       │  ┌─────────────────────────────┐    │ │
│ │              │  │                             │    │ │
│ │              │  │   Active tab content        │    │ │
│ │              │  │                             │    │ │
│ │              │  │                             │    │ │
│ │              │  └─────────────────────────────┘    │ │
│ └──────────────┴─────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### Left panel tabs

**Chat tab** — conversation with the AI agent. Shows streaming messages, tool calls (collapsible), and schema approval prompts inline. Input at the bottom.

**Resources tab** — tree view of all framework primitives in the project:

```
modules/
  sales/
    models/
      order
      customer
    pages/
      order-list
      order-detail
    services/
      submit-order
    hooks/
      validate-order
  inventory/
    models/
      product
      warehouse
```

Clicking a resource opens it in the canvas (model → graph view, page → preview or code, service/hook → code editor).

**Code tab** — file tree of the project source. Like VS Code explorer. Clicking a file opens it in Monaco in the canvas.

### Canvas tabs

**Preview** — iframe running the actual app (client shell connected to the framework runtime). User can interact with it. Clicking an element in the preview selects it and shows a popover input for refinement.

**Model Graph** — react-flow visualization of all models and their relationships. Opened when user clicks a model in the Resources tab.

**Code tabs** — Monaco editor instances. Opened when user clicks a file in the Code tab or a service/hook in Resources.

### Point-and-refine

When the user clicks an element in the preview:

1. Preview iframe emits the widget path (array of widget IDs from root to selected element)
2. Studio highlights the element with an overlay
3. A popover appears with a text input
4. User types what they want to change ("make this 3 columns", "add a date filter here")
5. Studio sends `chat.select_element` with the widget path + user text to Core
6. Agent receives context: which page, which widget node, what the user wants
7. Agent edits the page definition
8. Preview reloads with the change

This requires the preview (client shell) to emit widget selection events. The shell already knows which widget node it's rendering — it just needs to expose a selection mode when running inside Studio.

## Platform integration

### How Platform uses Studio Core

The Rangka Platform (proprietary, separate repo) runs Studio Core in pods:

```
Platform Service (orchestrator)
  │
  ├── Authenticates user
  ├── Routes WebSocket to correct pod
  ├── Manages pod lifecycle
  │     ├── Spin up pod when user opens app
  │     ├── Keep alive during activity
  │     └── Shut down after idle timeout
  │
  └── Platform UI (proprietary React app)
        ├── Workspace management, teams, billing
        ├── App list, deploy controls, monitoring
        └── Studio interface (connects to pod WebSocket)

Pod (per app):
  ├── @rangka/studio-core
  ├── Workspace volume mounted (app source files)
  ├── Platform-provisioned Postgres connection
  └── Platform-provided AI key
```

### What Platform adds beyond Studio Core

| Feature                          | Provided by                       |
| -------------------------------- | --------------------------------- |
| Multi-user collaboration         | Platform UI + Platform Service    |
| Build pipeline                   | Platform Service                  |
| Deployment (staging, production) | Platform Service                  |
| Environment management           | Platform Service                  |
| Monitoring, logs, error tracking | Platform Service                  |
| Auto-scaling                     | Platform infrastructure           |
| SSO integration                  | Auth plugin (managed by platform) |
| Billing and metering             | Platform Service                  |
| Workspace/team management        | Platform Service                  |

### Code segregation

Studio Local and Platform UI are completely separate codebases. They share only the WebSocket protocol types exported from `@rangka/studio-core`.

|            | Studio Local             | Platform UI                 |
| ---------- | ------------------------ | --------------------------- |
| Repo       | rangka monorepo          | Proprietary platform repo   |
| Purpose    | Local dev tool           | Managed product             |
| Complexity | Simple, single-user      | Multi-tenant, collaborative |
| Features   | Core building experience | Full lifecycle management   |
| Community  | Open to contributions    | Closed source               |

No shared UI components. Platform can add features that local doesn't have. Community can contribute to local without touching proprietary code.

## Agent behavior

### What the agent knows (system prompt)

- Framework primitives: defineModel, definePage, defineService, defineHook, defineModule
- All field types and their options
- Widget types and their props/bindings/triggers
- Action types and flow control
- Expression syntax
- Relationship types
- Trait behaviors
- Convention: file locations, naming patterns, qualified names

### How the agent works

1. User describes what they want (chat or point-and-refine)
2. Agent queries docs tool if needed for detailed API reference
3. Agent introspects current app state (models, pages, etc.)
4. Agent generates/modifies definition files using write/edit tools
5. Runtime re-scans, validates
6. If validation passes → preview reloads
7. If validation fails → error fed back to agent → agent self-corrects
8. If model changed → schema diff presented to user for approval

### Error recovery loop

```
Agent writes file
  → Runtime re-scans
  → Validation error? (e.g., broken model reference)
      → Error returned as tool result to agent
      → Agent reads error, fixes the file
      → Runtime re-scans again
      → Repeat until valid (max 3 attempts, then surface to user)
  → Valid?
      → Preview reloads
      → Model changed? → Schema diff → user approval
```

## CLI integration

`rangka studio` command starts Studio:

```typescript
// packages/cli/src/commands/studio.ts
export const studioCommand = defineCommand({
  meta: {
    name: 'studio',
    description: 'Start the Rangka Studio development environment',
  },
  args: {
    root: { type: 'string', default: '.' },
    port: { type: 'string', default: '4000' },
  },
  async run({ args }) {
    // 1. Start Studio Core (agent + runtime)
    // 2. Serve Studio Local UI
    // 3. Open browser
  },
});
```

Studio serves on a separate port from the app preview. The preview runs on the framework's normal port (3000). Studio UI runs on the studio port (4000).

## Tech stack

| Component             | Technology              |
| --------------------- | ----------------------- |
| Studio Core agent     | Pi Agent SDK            |
| Studio Core runtime   | @rangka/core (existing) |
| Studio Core WebSocket | ws (Node.js)            |
| Studio Local UI       | React, Tailwind, shadcn |
| Code editor           | Monaco Editor           |
| Model graph           | React Flow              |
| Preview               | iframe (client shell)   |
| File watching         | chokidar                |

## Preview auth

The preview is the full app — same as what `rangka start` serves, but with auth bypassed. It renders the complete shell (sidebar, navigation, breadcrumbs, topbar) with all pages accessible. The user sees and navigates the real app as a full-permission admin.

This is a dev tool for building, not for testing auth flows. When the agent creates a new module or page, it appears in the sidebar immediately. Navigation order, labels, icons, and permission-filtered sections all render as they would in production (minus the login gate).

Role impersonation (preview as specific role to test permission-filtered views) is a platform feature, not part of Studio Core or Studio Local.

## Open questions

- Should the agent support multiple concurrent conversations (e.g., one per module)?
- How does conversation history interact with git? Should conversations be committed or gitignored?
- Should Studio Local support offline mode (cached docs, no AI, just preview and manual editing)?
- What's the max context size strategy? Large apps could exceed token limits even with tools-based approach.
- Should the preview selection mode be opt-in (toggle button) or always active?
