import { defineFixture } from '@rangka/shared';

export default defineFixture({
  model: 'inventory.item',
  key: 'name',
  depends: ['inventory.category'],
  records: [
    {
      name: 'Laptop Pro 15',
      category: { ref: 'inventory.category', key: 'Computers' },
      unit: 'Piece',
      weight: 2.1,
      is_stockable: true,
    },
    {
      name: 'Wireless Mouse',
      category: { ref: 'inventory.category', key: 'Peripherals' },
      unit: 'Piece',
      weight: 0.15,
      is_stockable: true,
    },
    {
      name: 'Office Desk',
      category: { ref: 'inventory.category', key: 'Furniture' },
      unit: 'Piece',
      weight: 25.0,
      is_stockable: true,
    },
  ],
});
