import { defineModel, field } from '@rangka/shared';

export default defineModel({
  name: 'item',
  label: 'Item',
  naming: 'name',
  traits: ['timestamped', 'soft_delete'],
  fields: {
    item_code: field.sequence({ prefix: 'ITM-', digits: 5 }),
    name: field.string({ required: true, label: 'Item Name' }),
    category: field.link('category', { label: 'Category' }),
    unit: field.enum(['Piece', 'Kg', 'Litre', 'Metre', 'Box'], { default: 'Piece', label: 'Unit' }),
    weight: field.decimal({ precision: 10, scale: 3, label: 'Weight (kg)' }),
    is_stockable: field.boolean({ default: true, label: 'Stockable' }),
    description: field.text({ label: 'Description' }),
    barcode: field.string({ label: 'Barcode' }),
  },
  indexes: [{ fields: ['name'] }, { fields: ['barcode'], unique: true }, { fields: ['category'] }],
});
