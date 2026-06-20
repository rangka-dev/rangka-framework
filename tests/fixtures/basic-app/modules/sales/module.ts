import { defineModule } from '@rangka/shared';

export default defineModule({
  name: 'sales',
  label: 'Sales',
  icon: 'shopping-cart',
  navigation: [
    {
      section: 'Transactions',
      items: [
        { page: 'sales.customers', label: 'Customers', icon: 'users' },
        { page: 'sales.orders', label: 'Orders', icon: 'file-text' },
      ],
    },
  ],
});
