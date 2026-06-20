---
status: stable
since: 0.1.0
last-updated: 2026-06-12
description: Tutorial to build a working module in 15 minutes
---

# Your First Module

Build a working Contacts module from scratch. By the end, you'll have a list and form view, status transitions via actions, email validation, and auto-generated API endpoints.

## Prerequisites

- A Rangka project (`rangka init`)
- Node.js 18+
- A running PostgreSQL database

## 1. Create the folder

```bash
mkdir -p modules/contacts/{models,pages,services,hooks}
```

## 2. Define the module

```typescript
// modules/contacts/module.ts
import { defineModule } from 'rangka';

export default defineModule({
  name: 'contacts',
  label: 'Contacts',
  icon: 'contact',
  order: 20,
  navigation: [
    {
      section: 'Records',
      items: [{ page: 'contacts.contacts', label: 'All Contacts', icon: 'users' }],
    },
  ],
});
```

## 3. Define the model

```typescript
// modules/contacts/models/contact.ts
import { defineModel, field } from 'rangka';

export default defineModel({
  name: 'contact',
  label: 'Contact',
  naming: 'name',
  traits: ['timestamped'],
  fields: {
    name: field.string({ required: true }),
    email: field.string(),
    phone: field.string(),
    company: field.link('contacts.company'),
    type: field.enum(['Customer', 'Supplier', 'Partner', 'Other'], { default: 'Customer' }),
    status: field.enum(['Active', 'Inactive'], { default: 'Active' }),
    notes: field.text(),
  },
});
```

The `timestamped` trait adds `created_at` and `updated_at` automatically. You don't need to define `id` either.

## 4. Define the page

```typescript
// modules/contacts/pages/contacts.ts
import { definePage } from 'rangka';

export default definePage({
  key: 'contacts.contacts',
  label: 'Contacts',
  type: 'collection',
  body: [
    {
      type: 'split',
      props: { sizes: [60, 40] },
      children: [
        {
          type: 'table',
          bind: { model: { name: 'contacts.contact' } },
          on: { rowClick: { type: 'setValue', field: '$state.selectedId', value: '{{id}}' } },
          children: [
            { type: 'column', props: { label: 'Name', sortable: true }, bind: { field: 'name' } },
            { type: 'column', props: { label: 'Email' }, bind: { field: 'email' } },
            { type: 'column', props: { label: 'Company' }, bind: { field: 'company' } },
            {
              type: 'column',
              props: { label: 'Type' },
              children: [{ type: 'badge', bind: { field: 'type' } }],
            },
            {
              type: 'column',
              props: { label: 'Status' },
              children: [{ type: 'badge', bind: { field: 'status' } }],
            },
          ],
        },
        {
          type: 'data',
          source: { model: 'contacts.contact', id: '$state.selectedId' },
          children: [
            {
              type: 'section',
              props: { label: 'Basic Info' },
              children: [
                { type: 'input', bind: { field: 'name' } },
                { type: 'input', bind: { field: 'email' } },
                { type: 'input', bind: { field: 'phone' } },
                { type: 'input', bind: { field: 'type' } },
                { type: 'input', bind: { field: 'status' } },
              ],
            },
            {
              type: 'section',
              props: { label: 'Organization' },
              children: [{ type: 'input', bind: { field: 'company' } }],
            },
            {
              type: 'section',
              props: { label: 'Additional' },
              children: [{ type: 'input', bind: { field: 'notes' } }],
            },
            {
              type: 'group',
              props: { direction: 'row', gap: 'sm' },
              children: [
                {
                  type: 'button',
                  props: { label: 'Deactivate', variant: 'danger' },
                  on: { click: { type: 'service', name: 'contacts.deactivateContact' } },
                },
                {
                  type: 'button',
                  props: { label: 'Reactivate', variant: 'secondary' },
                  on: { click: { type: 'service', name: 'contacts.reactivateContact' } },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
});
```

Split layout: table on the left, detail form on the right. Click a row to load that record. Action buttons let you transition the status via services.

## 5. Define the service for status transitions

```typescript
// modules/contacts/services/deactivateContact.ts
import { defineService } from 'rangka';

export default defineService({
  name: 'contacts.deactivateContact',
  factory(ctx) {
    return {
      async execute(doc) {
        if (doc.status !== 'Active') throw new Error('Contact is already inactive');
        await ctx.db.update('contacts.contact', doc.id, { status: 'Inactive' });
      },
    };
  },
});
```

```typescript
// modules/contacts/services/reactivateContact.ts
import { defineService } from 'rangka';

export default defineService({
  name: 'contacts.reactivateContact',
  factory(ctx) {
    return {
      async execute(doc) {
        if (doc.status !== 'Inactive') throw new Error('Contact is already active');
        await ctx.db.update('contacts.contact', doc.id, { status: 'Active' });
      },
    };
  },
});
```

Services own the logic: validation, state change, side effects. The framework just calls them when the user clicks a button.

## 6. Define the hook

```typescript
// modules/contacts/hooks/contact.ts
import { defineHooks } from 'rangka';

export default defineHooks('contacts.contact', {
  validate(doc) {
    if (doc.email && typeof doc.email === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(doc.email)) {
        throw new Error('Invalid email address format');
      }
    }
  },

  async beforeSave(doc, ctx) {
    if (doc.email && typeof doc.email === 'string') {
      doc.email = doc.email.toLowerCase().trim();
    }
  },
});
```

`validate` runs before any save. Throw an error to abort. `beforeSave` is for transformations (normalizing the email here).

Note: `validate` is synchronous only. Use `beforeSave` or `beforeCreate` for async validation like uniqueness checks.

## 7. Run it

```bash
rangka start
```

```
[rangka] Starting...
[rangka] Discovered app "my-erp" with 1 models
[rangka] Connecting to postgres://...
[rangka] Schema synced: 1 models
[rangka] Listening on http://localhost:3000
```

Open the browser. You should see:

- The Contacts module in the sidebar
- A split view with an empty list and a ready form
- Action buttons (Deactivate/Reactivate) in the form toolbar and row actions

Try creating a contact with an invalid email to see the validation in action.

## What the framework generated

From those files:

**API:**

- `GET /api/contacts/contact` (list with filtering, sorting, pagination)
- `GET /api/contacts/contact/:id` (single record)
- `POST /api/contacts/contact` (create)
- `PUT /api/contacts/contact/:id` (update)
- `DELETE /api/contacts/contact/:id` (delete)

**UI:** list view with search/sort/filter, form view with sections, action buttons backed by services, sidebar navigation entry.

**Database:** `contacts_contact` table with all fields plus `id`, `status`, `created_at`, `updated_at`.

## Next steps

- [Extending Models](/guides/extending-models): add a Company model and link it
- [Custom Widgets](/guides/custom-widgets): build a custom dashboard widget
- [Actions](/concepts/actions): add more service-backed actions to your models
- [Permissions](/concepts/permissions): restrict who can deactivate contacts
- [Jobs](/concepts/jobs): sync contacts from an external CRM
