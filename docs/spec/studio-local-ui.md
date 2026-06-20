# Studio Local UI

> **Status: To be implemented**

## Overview

Studio Local is a web-based development tool that runs on localhost. It provides a chat-driven interface for building Rangka apps through natural language conversation with an AI agent. The UI is a standalone Vite + React app in `packages/studio-local/`.

Studio Local connects to Studio Core via WebSocket. This spec covers the frontend only. Backend behavior is defined in `docs/spec/studio.md`.

## Tech stack

| Concern     | Technology                         |
| ----------- | ---------------------------------- |
| Framework   | React 19, TypeScript               |
| Bundler     | Vite                               |
| Styling     | Tailwind CSS 4, shadcn (preset)    |
| Code editor | Monaco Editor                      |
| Model graph | React Flow                         |
| Icons       | Lucide React                       |
| Resizable   | react-resizable-panels             |
| Fonts       | Noto Sans Variable, Inter Variable |

## Visual direction

Cursor-style aesthetic. Clean, minimal chrome. Dark by default. Generous spacing. No compaction or density. Thin borders, subtle backgrounds. The tool is not a heavy IDE. It is a conversational builder with supporting views.

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Top Bar                                                     │
├──────────────────┬──────────────────────────────────────────┤
│                  │                                           │
│  Left Panel      │  Canvas                                  │
│  (resizable)     │                                          │
│                  │                                           │
│                  │                                           │
│                  │                                           │
│                  │                                           │
│                  │                                           │
├──────────────────┴──────────────────────────────────────────┤
│  Status Bar                                                  │
└─────────────────────────────────────────────────────────────┘
```

The app fills the full viewport height. Four structural regions:

1. **Top Bar** — project identity and settings
2. **Left Panel** — chat, resources, code tree
3. **Canvas** — preview, model graph, code editor
4. **Status Bar** — connection and runtime state

The left panel and canvas are separated by a thin draggable divider with no visible handle.

## Top Bar

Height: 48px. Full width.

| Position | Content                   |
| -------- | ------------------------- |
| Left     | Rangka Studio wordmark    |
| Center   | Project name              |
| Right    | Settings gear icon button |

Minimal. No tabs, no menus, no breadcrumbs.

## Left Panel

Default width: 380px. Min: 280px. Max: 500px. Resizable via the divider.

### Tab bar

A row of three tabs at the top of the panel. Each tab shows an icon and a label.

| Tab       | Icon    | Label     |
| --------- | ------- | --------- |
| Chat      | message | Chat      |
| Resources | folder  | Resources |
| Code      | code    | Code      |

Only one tab is active at a time. The active tab has a subtle highlight (accent underline or muted background). Clicking a tab switches the panel content. Default active tab is Chat.

### Chat tab

The chat tab is the primary interaction surface.

**Message list:**

- Scrollable, newest messages at the bottom
- User messages: right-aligned with a subtle secondary background
- Agent messages: left-aligned, no background
- Streaming: tokens appear progressively in the current agent message
- Tool calls: collapsible inline blocks between messages. Collapsed state shows tool name and a one-line summary. Expanded state shows input and output.
- Schema approval: inline card with a diff view (green/red lines for additions/removals). Two buttons: Approve and Reject.

**Input area:**

- Sticky at the bottom of the chat tab
- Single-line text input that auto-grows to max 4 lines, then scrolls
- Send button on the right
- Enter sends. Shift+Enter inserts a newline.
- Placeholder text: "Describe what you want to build..."

**Point-and-refine context:**

When the user selects an element in the preview, a context chip appears above the input. The chip shows the widget path and is dismissable. The user types their refinement instruction in the same input field.

### Resources tab

A tree view of all framework primitives in the project, grouped by module.

```
sales/
  Models
    order
    customer
  Pages
    order-list
    order-detail
  Services
    submit-order
  Hooks
    validate-order
inventory/
  Models
    product
    warehouse
```

Each module is a collapsible section. Inside each module: Models, Pages, Services, Hooks as sub-groups. Leaf items show a type icon and the resource name.

**Click behavior:**

- Model: opens the Model Graph tab in canvas
- Page: navigates the Preview tab to that page
- Service or Hook: opens a Code tab for that file

**Empty state:** "No resources yet. Start a conversation to build your app."

### Code tab

A file explorer tree of the project source.

- Folders collapse and expand
- File icons vary by extension (ts, yaml, json)
- Clicking a file opens it in a Code tab in the canvas
- The file currently open in the canvas is highlighted
- No toolbars or action buttons. File operations happen through the agent.

## Canvas

Fills the remaining width to the right of the left panel.

### Tab bar

A row of tabs at the top of the canvas area. Each tab has a label and a close button (except Preview which cannot be closed).

Tabs open on demand:

| Tab         | Opened by                            | Closeable |
| ----------- | ------------------------------------ | --------- |
| Preview     | Always open                          | No        |
| Models      | Clicking a model in Resources        | Yes       |
| Code (file) | Clicking a file in Code or Resources | Yes       |

### Preview tab

The main view for seeing the live app.

**Toolbar (above iframe):**

| Position | Content                                                         |
| -------- | --------------------------------------------------------------- |
| Left     | URL bar showing current route (e.g. `/sales/orders`), read-only |
| Right    | Pointer tool button — toggles element selection mode            |

**Iframe:**

- Loads the Rangka app (client shell) served on the framework's port
- Full height and width of the canvas content area
- Communicates with Studio via postMessage

**Selection mode (when pointer tool is active):**

1. Hover: light blue outline on the hovered element
2. Click: locks selection. A floating popover appears near the element with a text input ("What do you want to change?")
3. Submit: sends `chat.select_element` with the widget path and the user's text to Studio Core. The popover closes. The context chip appears in the chat input.

When pointer tool is inactive, the iframe behaves normally (user can interact with the app).

### Model Graph tab

A React Flow canvas showing all models and their relationships.

- Nodes: model name with a field count badge
- Edges: labeled with relationship type (hasMany, belongsTo, manyToMany)
- Interactions: pan, zoom
- Minimap: bottom-right corner
- Auto-layout: dagre or elk on first render

### Code tabs

One tab per open file. Each renders a Monaco editor instance.

- Dark theme matching the Studio color palette
- Syntax highlighting for TypeScript and YAML
- Read-only by default. The agent writes files. Manual editing is a future enhancement.

## Status Bar

Height: 32px. Full width along the bottom.

| Position | Content                                                          |
| -------- | ---------------------------------------------------------------- |
| Left     | Connection indicator: green/red dot + "Connected"/"Disconnected" |
| Right    | Runtime stats: `models: 4 · pages: 3 · services: 2`              |

Font: monospace. Color: muted foreground.

**Error state:** When the runtime reports an error, the status bar background changes to a subtle destructive color and shows the error message.

## Theme

Dark mode is the default and only mode for this initial build. The app uses the `.dark` class on the root element.

Color tokens come from the shadcn preset (oklch-based). Key decisions:

- Background: deep dark (`--background`)
- Panel borders: `--border` token, 1px, subtle
- Text: `--foreground` for primary, `--muted-foreground` for secondary
- Accent: used sparingly for active states and interactive highlights
- Code/editor: Monaco's built-in dark theme, aligned with background token

## Data flow (mocked for UI-first build)

Since Studio Core does not exist yet, the UI uses mocked data:

- **Chat:** hardcoded conversation with sample messages, tool calls, and a schema diff
- **Resources:** static tree with a few modules, models, pages
- **Code:** static file tree with placeholder content
- **Preview:** placeholder iframe (empty page or static HTML)
- **Model Graph:** hardcoded nodes and edges
- **Status bar:** static "Connected" state with sample counts
- **WebSocket:** not connected. All state is local.

This allows the full UI to be built, styled, and evaluated without a backend.

## Package structure

```
packages/studio-local/
  src/
    main.tsx
    App.tsx
    index.css
    components/
      layout/
        TopBar.tsx
        StatusBar.tsx
        LeftPanel.tsx
        Canvas.tsx
      chat/
        ChatTab.tsx
        MessageList.tsx
        MessageBubble.tsx
        ToolCallBlock.tsx
        SchemaDiffCard.tsx
        ChatInput.tsx
        ContextChip.tsx
      resources/
        ResourcesTab.tsx
        ResourceTree.tsx
      code/
        CodeTab.tsx
        FileTree.tsx
      canvas/
        CanvasTabBar.tsx
        PreviewTab.tsx
        PreviewToolbar.tsx
        SelectionPopover.tsx
        ModelGraphTab.tsx
        CodeEditorTab.tsx
      ui/
        (shadcn components)
    lib/
      utils.ts
    mock/
      messages.ts
      resources.ts
      files.ts
      models.ts
```

## Dependencies

| Package                | Purpose       |
| ---------------------- | ------------- |
| react, react-dom       | UI framework  |
| @monaco-editor/react   | Code editor   |
| @xyflow/react          | Model graph   |
| react-resizable-panels | Panel divider |
| lucide-react           | Icons         |
| shadcn components      | UI primitives |

## Open questions

- Should the Preview tab show a loading skeleton while the iframe loads?
- Should Code tabs support unsaved-indicator (dot on tab) for future manual editing?
- Should the Model Graph support clicking a node to expand its fields inline?
