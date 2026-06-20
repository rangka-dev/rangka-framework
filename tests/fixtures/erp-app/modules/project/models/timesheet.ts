import { defineModel, field } from '@rangka/shared';

export default defineModel({
  name: 'timesheet',
  label: 'Timesheet',
  traits: ['timestamped'],
  fields: {
    task: field.link('project.task', { required: true, label: 'Task' }),
    employee: field.link('hr.employee', { required: true, label: 'Employee' }),
    hours: field.decimal({ precision: 8, scale: 2, required: true, label: 'Hours' }),
    date: field.date({ required: true, label: 'Date' }),
    description: field.string({ label: 'Description' }),
  },
  indexes: [{ fields: ['task'] }, { fields: ['employee'] }, { fields: ['date'] }],
});
