---
status: stable
since: 0.1.0
last-updated: 2026-06-28
description: Tutorial to build a working app in 15 minutes
---

# Your first app

Build a working Tasks app from scratch. By the end you will have a list page, a form, field validation, and auto-generated API endpoints.

## Prerequisites

- A Rangka project (run `pnpm create rangka my-app` if you don't have one)
- Node.js 20+
- No database setup needed (SQLite is used by default). For production, configure PostgreSQL.

## 1. Define the app

Create the folder structure and app definition:

```bash
mkdir -p models pages hooks
```

```typescript
// app.ts
import { defineApp } from 'rangka';

export default defineApp({
  name: 'tasks',
  label: 'Tasks',
  icon: 'check-square',
  navigation: [
    {
      section: 'Records',
      items: [{ page: 'tasks.tasks', label: 'Tasks', icon: 'list' }],
    },
  ],
});
```

## 2. Define the model

```typescript
// models/task.ts
import { defineModel, field } from 'rangka';

export default defineModel({
  name: 'task',
  label: 'Task',
  naming: 'title',
  traits: ['timestamped'],
  fields: {
    title: field.string({ required: true }),
    description: field.text(),
    status: field.enum(['open', 'in_progress', 'done'], { default: 'open' }),
    priority: field.enum(['low', 'medium', 'high'], { default: 'medium' }),
    due_date: field.date(),
  },
});
```

The `timestamped` trait adds `created_at` and `updated_at` automatically. You don't need to define `id` either.

## 3. Define the page

```typescript
// pages/tasks.ts
import { definePage } from 'rangka';
import type { WidgetNode } from 'rangka';

const widgets: WidgetNode[] = [
  {
    type: 'table',
    source: { model: 'tasks.task' },
    props: { pageSize: 20 },
    children: [
      {
        type: 'column',
        bind: { field: 'title' },
        props: { label: 'Title', sortable: true, filterable: true },
      },
      {
        type: 'column',
        bind: { field: 'status' },
        props: { label: 'Status', sortable: true, filterable: true },
        children: [{ type: 'badge', bind: { field: 'status' } }],
      },
      {
        type: 'column',
        bind: { field: 'priority' },
        props: { label: 'Priority', sortable: true, filterable: true },
        children: [{ type: 'badge', bind: { field: 'priority' } }],
      },
      { type: 'column', bind: { field: 'due_date' }, props: { label: 'Due Date', sortable: true } },
    ],
  },
];

export default definePage({
  key: 'tasks.tasks',
  label: 'Tasks',
  path: '/tasks',
  widgets,
});
```

This gives you a table with sortable columns, filtering, and pagination. Clicking a row opens the record form automatically.

## 4. Add a hook

```typescript
// hooks/task.ts
import { defineHooks } from 'rangka';

export default defineHooks('tasks.task', {
  validate(doc) {
    if (!doc.title || !doc.title.trim()) {
      throw new Error('Title cannot be empty');
    }
  },

  async beforeSave(doc) {
    if (doc.title && typeof doc.title === 'string') {
      doc.title = doc.title.trim();
    }
  },
});
```

`validate` runs before any save. Throw an error to abort and show the message to the user. `beforeSave` runs after validation passes and is where you apply transformations.

## 5. Run it

```bash
pnpm start
```

```
[rangka] Starting...
[rangka] Discovered app with 1 models
[rangka] Connecting to database...
[rangka] Schema synced: 1 models
[rangka] Listening on http://localhost:3000
```

Open the browser. You should see:

- The Tasks app in the sidebar
- A table view with columns for title, status, priority, and due date
- A form that opens when you click a row or create a new record

Try creating a task with an empty title to see the validation in action.

## What the framework generated

From those four files:

**API:**

- `GET /api/tasks/task` (list with filtering, sorting, pagination)
- `GET /api/tasks/task/:id` (single record)
- `POST /api/tasks/task` (create)
- `PUT /api/tasks/task/:id` (update)
- `DELETE /api/tasks/task/:id` (delete)

**UI:** table with search, sort, and filter. Form with inputs for every field. Sidebar navigation entry.

**Database:** `tasks__task` table with all fields plus `id`, `created_at`, `updated_at`.

## Next steps

- [Models](/concepts/models): field types, traits, and relationships
- [Pages](/concepts/pages): composing widgets into screens
- [Hooks](/concepts/hooks): validation, side effects, and lifecycle
- [Widgets](/concepts/widgets): the universal UI building block
