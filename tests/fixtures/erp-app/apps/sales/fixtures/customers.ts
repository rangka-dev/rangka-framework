import { defineFixture } from '@rangka/shared';

export default defineFixture({
  model: 'sales.customer',
  key: 'email',
  depends: [],
  records: [
    {
      name: 'Acme Corporation',
      email: 'acme@example.com',
      phone: '+1-555-0100',
      is_active: true,
      credit_limit: 50000,
    },
    {
      name: 'Globex Inc',
      email: 'globex@example.com',
      phone: '+1-555-0200',
      is_active: true,
      credit_limit: 100000,
    },
    {
      name: 'Initech',
      email: 'initech@example.com',
      phone: '+1-555-0300',
      is_active: false,
      credit_limit: 25000,
    },
  ],
});
