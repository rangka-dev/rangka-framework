import { defineFixture } from '@rangka/shared';

export default defineFixture({
  model: 'inventory.category',
  key: 'name',
  records: [
    { name: 'Electronics' },
    { name: 'Computers', parent: { ref: 'inventory.category', key: 'Electronics' } },
    { name: 'Peripherals', parent: { ref: 'inventory.category', key: 'Electronics' } },
    { name: 'Furniture' },
  ],
});
