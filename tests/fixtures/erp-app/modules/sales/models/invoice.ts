import { defineModel, field } from '@rangka/shared';

export default defineModel({
  name: 'invoice',
  label: 'Sales Invoice',
  naming: 'invoice_number',
  traits: ['timestamped'],
  fields: {
    invoice_number: field.sequence({ prefix: 'INV-', digits: 5 }),
    customer: field.link('customer', { required: true }),
    posting_date: field.date({ required: true, label: 'Posting Date' }),
    due_date: field.date({ label: 'Due Date' }),
    grand_total: field.money({ label: 'Grand Total' }),
    tax_amount: field.decimal({ precision: 18, scale: 6, label: 'Tax Amount' }),
    status: field.enum(['Draft', 'Submitted', 'Paid', 'Cancelled'], { default: 'Draft' }),
    remarks: field.text({ label: 'Remarks' }),
    attachments: field.attachments({ label: 'Attachments', maxCount: 10 }),
    items: field.children('invoice_item', { foreignKey: 'invoice' }),
  },
  indexes: [
    { fields: ['customer', 'posting_date'] },
    { fields: ['status'] },
    { fields: ['due_date'] },
  ],
});
