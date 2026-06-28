import { defineModel, field } from '@rangka/shared';

export default defineModel({
  name: 'project',
  label: 'Project',
  naming: 'name',
  traits: ['timestamped'],
  fields: {
    name: field.string({ required: true, label: 'Project Name' }),
    code: field.sequence({ prefix: 'PRJ-', digits: 4 }),
    start_date: field.date({ label: 'Start Date' }),
    end_date: field.date({ label: 'End Date' }),
    status: field.enum(['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'], {
      default: 'Planning',
      label: 'Status',
    }),
    budget: field.money({ label: 'Budget' }),
    manager: field.link('hr.employee', { label: 'Project Manager' }),
    description: field.text({ label: 'Description' }),
  },
  indexes: [{ fields: ['status'] }, { fields: ['manager'] }],
});
