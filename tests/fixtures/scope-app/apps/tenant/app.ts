import { defineApp } from '@rangka/shared';

export default defineApp({
  name: 'tenant',
  label: 'Tenant',
  scopes: {
    company: {
      model: 'tenant.company',
      default: 'user.default_company',
      switchable: true,
    },
  },
});
