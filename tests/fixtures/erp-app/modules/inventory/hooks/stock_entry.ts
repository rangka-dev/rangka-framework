import { defineHooks } from '@rangka/shared';

export default defineHooks('inventory.stock_entry', {
  validate: (doc) => {
    if (!doc.warehouse) {
      throw new Error('Warehouse is required');
    }
    if (!doc.item) {
      throw new Error('Item is required');
    }
    if ((doc.qty as number) <= 0) {
      throw new Error('Quantity must be positive');
    }
  },
  afterCreate: async (doc, ctx) => {
    await ctx.models.update('inventory.item', doc.item as string, {
      description: `Last stocked: qty ${doc.qty}`,
    });
  },
  afterDelete: async (doc, ctx) => {
    await ctx.db
      .updateTable('inventory__item')
      .set({ description: 'Stock entry removed' })
      .where('id', '=', doc.item as string)
      .execute();
  },
});
