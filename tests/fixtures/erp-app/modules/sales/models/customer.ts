import { defineModel, field } from '@rangka/shared';

export default defineModel({
  name: 'customer',
  label: 'Customer',
  naming: 'name',
  traits: ['timestamped', 'soft_delete'],
  fields: {
    name: field.string({ required: true, label: 'Customer Name' }),
    email: field.string({ required: true, label: 'Email' }),
    phone: field.string({ label: 'Phone' }),
    is_active: field.boolean({ default: true, label: 'Active' }),
    credit_limit: field.decimal({ precision: 18, scale: 2, label: 'Credit Limit' }),
    notes: field.text({ label: 'Notes' }),
    metadata: field.json({ label: 'Metadata' }),
    logo: field.attachment({ label: 'Logo', accept: ['image/png', 'image/jpeg'] }),
    tags: field.manyToMany('sales_tag', { through: 'customer_tag' }),
  },
  indexes: [{ fields: ['email'], unique: true }, { fields: ['is_active'] }],
});
