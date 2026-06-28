import { defineModel, field } from '@rangka/shared';

export default defineModel({
  name: 'category',
  label: 'Item Category',
  naming: 'name',
  fields: {
    name: field.string({ required: true, label: 'Category Name' }),
    parent: field.tree({ parentField: 'parent', strategy: 'materialized_path' }),
  },
  indexes: [{ fields: ['name'], unique: true }],
});
