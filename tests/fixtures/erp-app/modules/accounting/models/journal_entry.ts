import { defineModel, field } from '@rangka/shared';

export default defineModel({
  name: 'journal_entry',
  label: 'Journal Entry',
  naming: 'entry_number',
  traits: ['timestamped'],
  fields: {
    entry_number: field.sequence({ prefix: 'JE-', digits: 5 }),
    posting_date: field.date({ required: true, label: 'Posting Date' }),
    reference: field.dynamicLink('reference_type'),
    memo: field.text({ label: 'Memo' }),
    is_posted: field.boolean({ default: false, label: 'Posted' }),
    items: field.children('journal_entry_item', { foreignKey: 'journal_entry' }),
  },
  indexes: [{ fields: ['posting_date'] }, { fields: ['is_posted'] }],
});
