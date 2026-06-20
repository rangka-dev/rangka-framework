import { defineService } from '@rangka/shared';

export default defineService({
  name: 'sales.invoice_service',
  label: 'Invoice Service',
  deps: [],
  factory(ctx) {
    return {
      async calculateTotal(items: Array<{ qty: number; rate: number }>) {
        return items.reduce((sum, item) => sum + item.qty * item.rate, 0);
      },
      async markAsPaid(invoiceId: string) {
        await ctx.db
          .updateTable('sales__invoice')
          .set({ status: 'Paid' })
          .where('id', '=', invoiceId)
          .execute();
      },
    };
  },
});
