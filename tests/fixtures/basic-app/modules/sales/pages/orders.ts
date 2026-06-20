import { definePage } from '@rangka/shared';

export default definePage({
  key: 'sales.orders',
  label: 'Orders',
  type: 'collection',
  body: [
    {
      type: 'data',
      source: { model: 'sales.invoice' },
      children: [{ type: 'text', bind: { field: 'name' }, props: { style: 'heading' } }],
    },
  ],
});
