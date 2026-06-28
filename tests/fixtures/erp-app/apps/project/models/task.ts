import { defineModel, field } from '@rangka/shared';

export default defineModel({
  name: 'task',
  label: 'Task',
  naming: 'title',
  traits: ['timestamped'],
  fields: {
    project: field.link('project', { required: true, label: 'Project' }),
    title: field.string({ required: true, label: 'Title' }),
    parent: field.tree({ parentField: 'parent', strategy: 'materialized_path' }),
    assigned_to: field.link('hr.employee', { label: 'Assigned To' }),
    due_date: field.date({ label: 'Due Date' }),
    priority: field.enum(['Low', 'Medium', 'High', 'Critical'], {
      default: 'Medium',
      label: 'Priority',
    }),
    estimated_hours: field.decimal({ precision: 8, scale: 2, label: 'Estimated Hours' }),
    actual_hours: field.decimal({ precision: 8, scale: 2, label: 'Actual Hours' }),
    status: field.enum(['Open', 'In Progress', 'Review', 'Done', 'Blocked'], {
      default: 'Open',
      label: 'Status',
    }),
    notes: field.code({ language: 'expression' }),
  },
  indexes: [
    { fields: ['project'] },
    { fields: ['assigned_to'] },
    { fields: ['status'] },
    { fields: ['priority'] },
  ],
});
