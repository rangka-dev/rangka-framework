import { defineModel, field } from '@rangka/shared';

export default defineModel({
  name: 'company',
  label: 'Company',
  fields: {
    name: field.string({ required: true }),
  },
});
