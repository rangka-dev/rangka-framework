import { defineModel, field } from '@rangka/shared';

export default defineModel({
  name: 'customer',
  label: 'Customer',
  naming: 'name',
  fields: {
    name: field.string({ required: true, label: 'Customer Name' }),
    email: field.string({ required: true, label: 'Email' }),
  },
  indexes: [{ fields: ['email'], unique: true }],
});
