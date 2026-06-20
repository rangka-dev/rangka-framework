import { defineModule } from '@rangka/shared';

export default defineModule({
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
