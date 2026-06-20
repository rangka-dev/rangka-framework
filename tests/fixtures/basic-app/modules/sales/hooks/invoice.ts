import { defineHooks } from '@rangka/shared';

export default defineHooks('sales.invoice', {
  validate: (doc) => {
    if (!doc.customer) {
      throw new Error('Customer is required');
    }
    if (doc.grand_total !== undefined && doc.grand_total < 0) {
      throw new Error('Grand total cannot be negative');
    }
  },
});
