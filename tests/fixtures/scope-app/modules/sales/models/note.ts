import { defineModel, field } from '@rangka/shared';

export default defineModel({
  name: 'note',
  label: 'Note',
  traits: ['timestamped'],
  fields: {
    title: field.string({ required: true }),
    body: field.text(),
  },
});
