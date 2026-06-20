import { defineHooks } from '@rangka/shared';

export default defineHooks('sales.customer', {
  validate: (doc) => {
    if (!doc.name) {
      throw new Error('Customer name is required');
    }
    if (!doc.email) {
      throw new Error('Email is required');
    }
    if (doc.email && !(doc.email as string).includes('@')) {
      throw new Error('Invalid email format');
    }
  },
  beforeSave: (doc) => {
    if (doc.email) {
      doc.email = (doc.email as string).toLowerCase().trim();
    }
    return doc;
  },
});
