import { defineRoles } from '@rangka/shared';

export default defineRoles({
  'Sales User': {
    label: 'Sales User',
    models: {
      'sales.customer': { read: true, write: true, create: true, delete: false },
      'sales.invoice': { read: true, write: true, create: true, delete: false },
    },
  },
  'Sales Manager': {
    label: 'Sales Manager',
    extends: 'Sales User',
    models: {
      'sales.invoice': { read: true, write: true, create: true, delete: true },
    },
  },
});
