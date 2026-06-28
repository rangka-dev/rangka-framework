import { defineModel, field } from '@rangka/shared';

export default defineModel({
  name: 'invoice',
  label: 'Invoice',
  scope: 'company',
  traits: ['timestamped'],
  fields: {
    company: field.link('tenant.company', { required: true }),
    total: field.decimal({ precision: 18, scale: 2 }),
    description: field.string(),
  },
});
