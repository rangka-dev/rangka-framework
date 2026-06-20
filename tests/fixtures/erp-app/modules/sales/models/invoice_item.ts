import { defineModel, field } from '@rangka/shared';

export default defineModel({
  name: 'invoice_item',
  label: 'Invoice Item',
  fields: {
    invoice: field.link('invoice', { required: true }),
    item: field.link('inventory.item', { required: true }),
    qty: field.int({ required: true, label: 'Quantity' }),
    rate: field.decimal({ precision: 18, scale: 6, required: true, label: 'Rate' }),
    amount: field.computed({
      depends: ['qty', 'rate'],
      compute: (doc) => ((doc.qty as number) || 0) * ((doc.rate as number) || 0),
      stored: true,
    }),
    description: field.string({ label: 'Description' }),
  },
  indexes: [{ fields: ['invoice'] }, { fields: ['item'] }],
});
