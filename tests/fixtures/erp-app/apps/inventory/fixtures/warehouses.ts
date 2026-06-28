import { defineFixture } from '@rangka/shared';

export default defineFixture({
  model: 'inventory.warehouse',
  key: 'name',
  records: [
    {
      name: 'Main Warehouse',
      code: 'WH-001',
      is_active: true,
      address: { city: 'Jakarta', country: 'ID' },
    },
    {
      name: 'Secondary Warehouse',
      code: 'WH-002',
      is_active: true,
      address: { city: 'Surabaya', country: 'ID' },
    },
  ],
});
