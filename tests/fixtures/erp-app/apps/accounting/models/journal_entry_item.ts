import { defineModel, field } from '@rangka/shared';

export default defineModel({
  name: 'journal_entry_item',
  label: 'Journal Entry Item',
  fields: {
    journal_entry: field.link('journal_entry', { required: true }),
    account: field.link('accounting.account', { required: true, label: 'Account' }),
    debit: field.money({ label: 'Debit' }),
    credit: field.money({ label: 'Credit' }),
    description: field.string({ label: 'Description' }),
  },
  indexes: [{ fields: ['journal_entry'] }, { fields: ['account'] }],
});
