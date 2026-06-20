import { defineModel, field } from '@rangka/shared';

export default defineModel({
  name: 'department',
  label: 'Department',
  naming: 'name',
  fields: {
    name: field.string({ required: true, label: 'Department Name' }),
    parent: field.tree({ parentField: 'parent', strategy: 'nested_set' }),
  },
  indexes: [{ fields: ['name'], unique: true }],
});
