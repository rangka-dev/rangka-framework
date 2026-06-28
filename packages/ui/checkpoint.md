# Shell Revamp Checkpoint

## Goal

Revamp the shell layer to match Plane.so's structure. The client writes zero divs, zero Tailwind — all rendering comes from `@rangka/ui` components exclusively.

## Plane.so Structure (from inspection)

- **Top bar** (horizontal, full width): workspace avatar + name + switcher, search input, action buttons (notifications, AI assistant), user avatar
- **Secondary nav** (horizontal, below top bar): workspace-level links (Projects, Wiki, AI, Settings)
- **Left sidebar** (vertical, below secondary nav): collapsible sections — "New work item" button, quick links (Home, Drafts, Your work, Stickies), Workspace section (Projects, More), Projects section (expandable per-project with sub-nav: Overview, Work items, Cycles, Modules, Views, Pages), "Try" section with tips
- **Main content area**: breadcrumb header row (project name + page title + actions) then page body
- Sidebar is resizable with a drag handle

## Current State

- Shell components exist: Sidebar (full composition), ShellContent (Header + Main), PageContainer, Breadcrumb
- Full shell story demonstrates the pattern at `stories/shell/full-shell.stories.tsx`
- Sidebar already has: Header, Content, Footer, Group, GroupLabel, Menu, MenuItem, MenuButton, MenuSub, etc.

## What Needs to Change

1. **Add a top-level workspace bar** — the horizontal bar at the very top with workspace switcher + search + user
2. **Add workspace-level navigation** — horizontal tabs below the top bar (Projects, Wiki, AI, Settings)
3. **Restructure the sidebar** — it sits below the workspace nav, not full-height. Contains project-level navigation.
4. **Update ShellContent.Header** — becomes the breadcrumb bar with project context + page actions
5. **Ensure the shell can render a full app** with only `@rangka/ui` imports — no intermediate divs

## Approach

1. Use Playwright to inspect Plane's DOM structure in detail (accessibility snapshots, not screenshots)
2. Design the component API to match that structure
3. Build new shell components or restructure existing ones
4. Update the full-shell story to demonstrate the new layout
5. Verify zero-div rendering from client perspective

## Token System

Tokens are now fully wired via `@theme inline`. Components use clean Tailwind utilities (bg-popover, text-muted-foreground, shadow-md, etc.) — no var() wrappers in component code.

## Remaining Non-Shell Work

- FileUpload component (for AttachmentWidget/AttachmentsWidget)
- DataTable (for TableWidget — biggest remaining item)
