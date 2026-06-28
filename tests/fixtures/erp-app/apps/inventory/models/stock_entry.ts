import { defineModel, field } from '@rangka/shared';

export default defineModel({
  name: 'stock_entry',
  label: 'Stock Entry',
  naming: 'entry_number',
  traits: ['timestamped'],
  fields: {
    entry_number: field.sequence({ prefix: 'STE-', digits: 5 }),
    warehouse: field.link('warehouse', { required: true, label: 'Warehouse' }),
    item: field.link('item', { required: true, label: 'Item' }),
    qty: field.decimal({ precision: 18, scale: 6, required: true, label: 'Quantity' }),
    entry_type: field.enum(['Receipt', 'Issue', 'Transfer'], { required: true, label: 'Type' }),
    posting_date: field.datetime({ required: true, label: 'Posting Date' }),
    remarks: field.text({ label: 'Remarks' }),
  },
  indexes: [
    { fields: ['warehouse', 'item'] },
    { fields: ['entry_type'] },
    { fields: ['posting_date'] },
  ],
});
