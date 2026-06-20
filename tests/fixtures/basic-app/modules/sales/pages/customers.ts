import { definePage } from '@rangka/shared';

export default definePage({
  key: 'sales.customers',
  label: 'Customers',
  type: 'collection',
  body: [
    {
      type: 'data',
      source: { model: 'sales.customer' },
      children: [{ type: 'text', bind: { field: 'name' }, props: { style: 'heading' } }],
    },
    {
      type: 'drawer',
      props: { width: 'md', title: 'Customer' },
      visible: { field: '$state.drawerOpen', operator: 'eq', value: true },
      children: [
        {
          type: 'data',
          source: { model: 'sales.customer', id: '$state.selectedId' },
          children: [{ type: 'text', bind: { field: 'name' }, props: { style: 'heading' } }],
        },
      ],
    },
  ],
});
