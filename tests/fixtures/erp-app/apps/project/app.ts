import { defineApp } from '@rangka/shared';

export default defineApp({
  name: 'project',
  label: 'Projects',
  icon: 'briefcase',
  depends: ['hr'],
  navigation: [
    {
      section: 'Management',
      items: [
        { page: 'project.projects', label: 'Projects', icon: 'briefcase' },
        { page: 'project.tasks', label: 'Tasks', icon: 'check-square' },
        { page: 'project.timesheets', label: 'Timesheets', icon: 'clock' },
      ],
    },
  ],
});
