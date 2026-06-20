import { defineModule } from '@rangka/shared';

export default defineModule({
  name: 'hr',
  label: 'Human Resources',
  icon: 'users',
  navigation: [
    {
      section: 'Masters',
      items: [
        { page: 'hr.employees', label: 'Employees', icon: 'user' },
        { page: 'hr.departments', label: 'Departments', icon: 'building' },
      ],
    },
    {
      section: 'Transactions',
      items: [{ page: 'hr.leave_requests', label: 'Leave Requests', icon: 'calendar' }],
    },
  ],
});
