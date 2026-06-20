import { defineHooks } from '@rangka/shared';

export default defineHooks('sales.invoice', {
  validate: (doc) => {
    if (!doc.customer) {
      throw new Error('Customer is required');
    }
    if (doc.grand_total !== undefined && (doc.grand_total as number) < 0) {
      throw new Error('Grand total cannot be negative');
    }
  },
  beforeCreate: (doc) => {
    if (!doc.status) {
      doc.status = 'Draft';
    }
    return doc;
  },
  afterCreate: (doc) => {
    console.log(`[hook] Invoice created: ${doc.invoice_number}`);
  },
});
