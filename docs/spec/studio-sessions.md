# Studio session management

> **Status: Design**

## Overview

Studio conversations are ephemeral. The agent uses an in-memory session manager so all history is lost on restart. This spec defines how sessions are persisted, listed, resumed, and managed through the UI.

Sessions are stored as JSONL files in `.rangka/studio/conversations/` at the project root. The pi-coding-agent SDK provides a file-based SessionManager that handles serialization, tree structure, and metadata. Studio wraps this with a WebSocket protocol and a session picker in the chat panel.

## Storage

Sessions live at `<projectRoot>/.rangka/studio/conversations/`. Each session is a single `.jsonl` file containing:

- A header line with session metadata (id, timestamp, cwd)
- Append-only entries for messages, tool results, model changes, and compaction summaries

The directory is project-scoped. Different projects have independent session histories.

```
project-root/
  .rangka/
    studio/
      conversations/
        2026-06-18T14-00-00-000Z_a1b2c3d4.jsonl
        2026-06-19T09-15-22-456Z_e5f6g7h8.jsonl
```

## Session lifecycle

| Action                       | Behavior                                                   |
| ---------------------------- | ---------------------------------------------------------- |
| First launch                 | Creates a new session file                                 |
| Restart                      | Auto-resumes the most recent session                       |
| New session (user action)    | Creates a fresh session file, agent starts with no history |
| Resume session (user action) | Opens selected session file, agent restores full history   |
| Rename session               | Appends a name entry to the session file                   |

On resume, the agent automatically restores all messages, model settings, and conversation context from the session file. No manual reconstruction needed.

## Protocol additions

Server to client:

| Type               | Payload                              | Description                       |
| ------------------ | ------------------------------------ | --------------------------------- |
| `session.list`     | `{ sessions: SessionInfo[] }`        | List of available sessions        |
| `session.current`  | `{ sessionId, name?, messageCount }` | Active session metadata           |
| `session.switched` | `{ sessionId }`                      | Confirms session switch completed |

Client to server:

| Type             | Payload           | Description                          |
| ---------------- | ----------------- | ------------------------------------ |
| `session.list`   | `{}`              | Request session list                 |
| `session.new`    | `{}`              | Create new session                   |
| `session.resume` | `{ sessionPath }` | Resume a specific session            |
| `session.rename` | `{ name }`        | Set display name for current session |

SessionInfo type:

| Field          | Type      | Description                            |
| -------------- | --------- | -------------------------------------- |
| `path`         | `string`  | File path (used as session identifier) |
| `name`         | `string?` | User-assigned display name             |
| `created`      | `string`  | ISO timestamp                          |
| `modified`     | `string`  | ISO timestamp of last entry            |
| `messageCount` | `number`  | Total user+assistant messages          |
| `firstMessage` | `string?` | First user message (for display)       |

## Agent engine changes

The AgentEngine gains three session methods:

**`createNewSession()`** — Disposes current session. Creates a new SessionManager pointing to a fresh file in the conversations directory. Reinitializes the agent with empty history.

**`resumeSession(path)`** — Disposes current session. Opens the specified session file via `SessionManager.open()`. Reinitializes the agent with restored history.

**`getSessionInfo()`** — Returns metadata about the current session (id, name, message count).

The initialization flow changes from `SessionManager.inMemory()` to `SessionManager.continueRecent()` on first boot. This means restarting Studio automatically resumes where the user left off.

## Server behavior

On client connection, the server sends `session.current` with active session info. This lets the UI show which session is active immediately.

When handling `session.new` or `session.resume`, the server:

1. Calls the corresponding AgentEngine method
2. Sends `session.switched` to confirm
3. The client clears its local message list (history now lives in the session file)

The local `Session` class (packages/studio-core/src/session.ts) is removed. It duplicated conversation tracking that the pi SessionManager handles natively.

## UI: session picker

The session picker sits at the top of the chat panel as a compact header. It shows the current session name (or "New conversation" for unnamed sessions).

Clicking the session name opens a popover dropdown:

```
┌──────────────────────────────┐
│  + New conversation          │
│──────────────────────────────│
│  "Add pagination to orders"  │
│  2 hours ago · 12 messages   │
│                              │
│  "Set up inventory module"   │
│  Yesterday · 34 messages     │
│                              │
│  "Fix customer validation"   │
│  3 days ago · 8 messages     │
└──────────────────────────────┘
```

Each entry shows:

- Session name or first user message (truncated)
- Relative timestamp of last activity
- Message count

Selecting a session sends `session.resume`. The message list clears and the agent operates with full restored context. The user does not see old messages replayed in the UI. They see an empty chat that continues the prior conversation from the agent's perspective.

## Frontend state

The `useStudio` hook gains:

- `currentSession` state — id and name of active session
- `sessions` state — list of available sessions
- `listSessions()` — fetches session list
- `newSession()` — creates fresh session, clears messages
- `resumeSession(path)` — switches session, clears messages
- `renameSession(name)` — updates current session name

On `session.switched`, the frontend clears its local messages array. The agent has the history in its context but the UI starts clean. This avoids replaying potentially long conversation histories in the UI on resume.

## Open questions

- Should resumed sessions show a summary of prior context in the UI? A single "Continuing from previous session" indicator may help orientation.
- Should sessions auto-name based on the first user message, or require manual naming?
- Maximum session file size before suggesting a new session (compaction handles context window limits, but file size on disk could grow unbounded).
