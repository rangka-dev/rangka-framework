import { defineModel, field } from '@rangka/shared';

export default defineModel({
  name: 'employee',
  label: 'Employee',
  naming: 'employee_id',
  traits: ['timestamped', 'soft_delete'],
  fields: {
    employee_id: field.sequence({ prefix: 'EMP-', digits: 4 }),
    first_name: field.string({ required: true, label: 'First Name' }),
    last_name: field.string({ required: true, label: 'Last Name' }),
    email: field.string({ required: true, label: 'Email' }),
    department: field.link('department', { label: 'Department' }),
    hire_date: field.date({ required: true, label: 'Hire Date' }),
    salary: field.money({ label: 'Salary' }),
    is_active: field.boolean({ default: true, label: 'Active' }),
    resume: field.attachment({ label: 'Resume', accept: ['application/pdf'] }),
    skills: field.json({ label: 'Skills' }),
  },
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['department'] },
    { fields: ['is_active'] },
  ],
});
