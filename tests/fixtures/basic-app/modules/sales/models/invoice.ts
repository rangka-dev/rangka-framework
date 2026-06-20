import { defineModel, field } from '@rangka/shared';

export default defineModel({
  name: 'invoice',
  label: 'Sales Invoice',
  naming: 'invoice_number',
  fields: {
    invoice_number: field.sequence({ prefix: 'INV-', digits: 5 }),
    customer: field.link('customer', { required: true }),
    posting_date: field.date({ required: true }),
    grand_total: field.decimal({ precision: 18, scale: 6 }),
    status: field.enum(['Draft', 'Submitted', 'Paid', 'Cancelled']),
  },
  indexes: [{ fields: ['customer', 'posting_date'] }, { fields: ['status'] }],
});
