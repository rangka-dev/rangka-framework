import { defineModel, field } from '@rangka/shared';

export default defineModel({
  name: 'account',
  label: 'Account',
  naming: 'name',
  fields: {
    name: field.string({ required: true, label: 'Account Name' }),
    account_number: field.string({ required: true, label: 'Account Number' }),
    parent: field.tree({ parentField: 'parent', strategy: 'closure_table' }),
    account_type: field.enum(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'], {
      required: true,
      label: 'Account Type',
    }),
    is_group: field.boolean({ default: false, label: 'Is Group' }),
  },
  indexes: [{ fields: ['account_number'], unique: true }, { fields: ['account_type'] }],
});
