import { defineModule } from '@rangka/shared';

export default defineModule({
  name: 'inventory',
  label: 'Inventory',
  icon: 'package',
  navigation: [
    {
      section: 'Masters',
      items: [
        { page: 'inventory.items', label: 'Items', icon: 'box' },
        { page: 'inventory.categories', label: 'Categories', icon: 'folder' },
        { page: 'inventory.warehouses', label: 'Warehouses', icon: 'home' },
      ],
    },
    {
      section: 'Transactions',
      items: [
        { page: 'inventory.stock_entries', label: 'Stock Entries', icon: 'arrow-right-left' },
      ],
    },
  ],
});
