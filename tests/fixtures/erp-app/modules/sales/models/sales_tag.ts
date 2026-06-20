import { defineModel, field } from '@rangka/shared';

export default defineModel({
  name: 'sales_tag',
  label: 'Sales Tag',
  naming: 'name',
  fields: {
    name: field.string({ required: true, label: 'Tag Name' }),
    color: field.string({ label: 'Color', default: '#000000' }),
  },
  indexes: [{ fields: ['name'], unique: true }],
});
