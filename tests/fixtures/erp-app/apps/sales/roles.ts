import { defineRoles } from '@rangka/shared';

export default defineRoles({
  'Sales Manager': {
    label: 'Sales Manager',
    models: {
      'sales.customer': { create: true, read: true, write: true, delete: true },
      'sales.invoice': { create: true, read: true, write: true, delete: false },
      'sales.invoice_item': { create: true, read: true, write: true, delete: true },
      'sales.payment': { create: true, read: true, write: true, delete: false },
      'sales.sales_tag': { create: true, read: true, write: true, delete: true },
    },
  },
  'Sales User': {
    label: 'Sales User',
    models: {
      'sales.customer': { create: true, read: true, write: 'own', delete: false },
      'sales.invoice': { create: true, read: true, write: 'own', delete: false },
      'sales.invoice_item': { create: true, read: true, write: true, delete: false },
      'sales.payment': { create: false, read: true, write: false, delete: false },
      'sales.sales_tag': { create: false, read: true, write: false, delete: false },
    },
  },
});
