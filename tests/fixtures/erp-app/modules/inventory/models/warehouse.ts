import { defineModel, field } from '@rangka/shared';

export default defineModel({
  name: 'warehouse',
  label: 'Warehouse',
  naming: 'name',
  fields: {
    name: field.string({ required: true, label: 'Warehouse Name' }),
    code: field.string({ required: true, label: 'Code' }),
    is_active: field.boolean({ default: true, label: 'Active' }),
    address: field.json({ label: 'Address' }),
  },
  indexes: [{ fields: ['code'], unique: true }, { fields: ['is_active'] }],
});
