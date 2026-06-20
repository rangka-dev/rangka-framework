---
status: stable
since: 0.1.0
last-updated: 2026-06-14
description: How to extend another module's models with new fields or traits
---

# Extending models

You can add fields, hooks, and UI to another module's model without modifying the source. This keeps modules decoupled while allowing cross-module functionality.

## The scenario

You have a `sales` module with a `customer` model. You're building a `loyalty` module that needs to add points and tiers to every customer, recalculate tiers on save, and show a leaderboard page.

Instead of editing the sales module, you extend it.

## 1. Declare the dependency

```typescript
// modules/loyalty/module.ts
import { defineModule } from 'rangka';

export default defineModule({
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

`depends: ['sales']` ensures the sales module loads first and your extensions apply after the base model is registered.

## 2. Add fields

```typescript
// modules/loyalty/extensions/customer.ts
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
// modules/loyalty/hooks/customer.ts
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

Extension hooks append to the hook chain. The original module's hooks run first, then extensions in dependency order.

## 4. React to other models

Award points when a sales order is created:

```typescript
// modules/loyalty/hooks/order-points.ts
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

Add your fields to the customer form without modifying the sales module:

```typescript
// modules/loyalty/extensions/customer-layout.ts
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

The `after` option places your section after an existing one. If it doesn't exist, your section goes at the end.

## 6. Add your own pages

```typescript
// modules/loyalty/pages/dashboard.ts
import { definePage } from 'rangka';

export default definePage({
  key: 'loyalty.dashboard',
  label: 'Points Overview',
  type: 'collection',
  body: [
    {
      type: 'table',
      bind: { model: { name: 'sales.customer', filters: { loyalty_points: { gt: 0 } } } },
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

This page lives in the loyalty module but queries `sales.customer`. The extension fields are available because they're part of the schema.

## Rules

- You can add fields, not remove them
- You can append hooks, not override existing ones
- Field name conflicts throw at startup. Prefix with your module name (`loyalty_points`) to avoid collisions
- Circular dependencies are detected and rejected
- Extension hooks run after the base module's hooks, in dependency order
