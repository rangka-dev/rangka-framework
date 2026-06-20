import { defineModel, field } from '@rangka/shared';

export default defineModel({
  name: 'payment',
  label: 'Payment',
  naming: 'payment_number',
  traits: ['timestamped'],
  fields: {
    payment_number: field.sequence({ prefix: 'PAY-', digits: 5 }),
    reference: field.dynamicLink('reference_type'),
    amount: field.money({ label: 'Amount' }),
    payment_date: field.date({ required: true, label: 'Payment Date' }),
    method: field.enum(['Cash', 'Bank', 'Credit'], { required: true }),
    bank_account: field.string({ label: 'Bank Account' }),
  },
  indexes: [{ fields: ['payment_date'] }, { fields: ['method'] }],
});
