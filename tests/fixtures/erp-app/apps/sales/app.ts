import { defineApp } from '@rangka/shared';

export default defineApp({
  name: 'sales',
  label: 'Sales',
  icon: 'shopping-cart',
  depends: ['inventory'],
  navigation: [
    {
      section: 'Transactions',
      items: [
        { page: 'sales.customers', label: 'Customers', icon: 'users' },
        { page: 'sales.invoices', label: 'Invoices', icon: 'file-text' },
        { page: 'sales.payments', label: 'Payments', icon: 'credit-card' },
      ],
    },
  ],
});
