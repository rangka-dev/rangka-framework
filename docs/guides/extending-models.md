---
status: stable
since: 0.1.0
last-updated: 2026-06-29
description: How to extend another app's models with new fields or traits
---

# Extending models

You can add fields, hooks, and UI to another app's model without modifying the source. This keeps apps decoupled while allowing cross-app functionality.

## The scenario

You have a `sales` app with a `customer` model. You are building a `loyalty` app that needs to add points and tiers to every customer, recalculate tiers on save, and show a leaderboard.

Instead of editing the sales app, you extend it.

## 1. Declare the dependency

```typescript
// apps/loyalty/app.ts
import { defineApp } from 'rangka';

export default defineApp({
  name: 'loyalty',
  label: 'Loyalty',
  icon: 'star',
  order: 50,
  depends: ['sales'],
  navigation: [
    {
      section: 'Loyalty',
      items: [{ page: 'loyalty.dashboard', label: 'Points Overview', icon: 'trophy' }],
    },
  ],
});
```

`depends: ['sales']` ensures the sales app loads first. Your extensions apply after the base model is registered.

## 2. Add fields

```typescript
// apps/loyalty/extensions/customer.ts
import { defineExtension, field } from 'rangka';

export default defineExtension('sales.customer', {
  fields: {
    loyalty_points: field.int({ default: 0, readOnly: true }),
    loyalty_tier: field.enum(['Bronze', 'Silver', 'Gold', 'Platinum'], {
      default: 'Bronze',
      readOnly: true,
    }),
    points_last_updated: field.datetime({ hidden: true }),
  },
});
```

The first argument is the target model. These fields merge into `sales.customer`. The database migration runs automatically.

## 3. Add hooks

```typescript
// apps/loyalty/hooks/customer.ts
import { defineHooks } from 'rangka';

export default defineHooks('sales.customer', {
  async afterSave(doc, ctx) {
    const points = doc.loyalty_points as number;
    let tier = 'Bronze';

    if (points >= 10000) tier = 'Platinum';
    else if (points >= 5000) tier = 'Gold';
    else if (points >= 1000) tier = 'Silver';

    if (tier !== doc.loyalty_tier) {
      await ctx.db
        .updateTable('sales_customer')
        .set({ loyalty_tier: tier })
        .where('id', '=', doc.id as string)
        .execute();
    }
  },
});
```

Extension hooks append to the hook chain. The original app's hooks run first. Then extensions run in dependency order.

## 4. React to other models

Award points when a sales order is created:

```typescript
// apps/loyalty/hooks/order-points.ts
import { defineHooks } from 'rangka';

export default defineHooks('sales.order', {
  async afterCreate(doc, ctx) {
    const pointsEarned = Math.floor((doc.grand_total as number) / 10);

    await ctx.db
      .updateTable('sales_customer')
      .set({
        loyalty_points: ctx.db.raw('loyalty_points + ?', [pointsEarned]),
        points_last_updated: new Date().toISOString(),
      })
      .where('id', '=', doc.customer as string)
      .execute();
  },
});
```

## 5. Inject into the original form

Add your fields to the customer form without modifying the sales app:

```typescript
// apps/loyalty/extensions/customer-layout.ts
import { defineExtension } from 'rangka';

export default defineExtension('sales.customer', {
  layout: {
    form: {
      sections: [
        {
          label: 'Loyalty',
          fields: ['loyalty_points', 'loyalty_tier', 'points_last_updated'],
          after: 'Basic Info',
          columns: 3,
        },
      ],
    },
  },
});
```

The `after` option places your section after an existing one. If the target section does not exist, yours goes at the end.

## 6. Add your own pages

```typescript
// apps/loyalty/pages/dashboard.ts
import { definePage } from 'rangka';

export default definePage({
  key: 'loyalty.dashboard',
  label: 'Points Overview',
  widgets: [
    {
      type: 'table',
      source: { model: 'sales.customer', filters: { loyalty_points: { gt: 0 } } },
      children: [
        { type: 'column', props: { label: 'Name' }, bind: { field: 'name' } },
        {
          type: 'column',
          props: { label: 'Points', sortable: true },
          bind: { field: 'loyalty_points' },
        },
        {
          type: 'column',
          props: { label: 'Tier' },
          children: [{ type: 'badge', bind: { field: 'loyalty_tier' } }],
        },
      ],
    },
  ],
});
```

This page lives in the loyalty app but queries `sales.customer`. The extension fields are available because they are part of the schema.

## Rules

- You can add fields, not remove them
- You can append hooks, not override existing ones
- Field name conflicts throw at startup. Prefix with your app name (`loyalty_points`) to avoid collisions
- Circular dependencies are detected and rejected
- Extension hooks run after the base app's hooks, in dependency order
