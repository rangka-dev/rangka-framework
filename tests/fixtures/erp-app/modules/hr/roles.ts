import { defineRoles } from '@rangka/shared';

export default defineRoles({
  'HR Manager': {
    label: 'HR Manager',
    models: {
      'hr.employee': { create: true, read: true, write: true, delete: true },
      'hr.department': { create: true, read: true, write: true, delete: true },
      'hr.leave_request': { create: true, read: true, write: true, delete: true },
    },
  },
  'HR User': {
    label: 'HR User',
    models: {
      'hr.employee': { create: false, read: true, write: false, delete: false },
      'hr.department': { create: false, read: true, write: false, delete: false },
      'hr.leave_request': { create: true, read: 'own', write: 'own', delete: false },
    },
  },
});
