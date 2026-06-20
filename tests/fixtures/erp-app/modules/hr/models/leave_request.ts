import { defineModel, field } from '@rangka/shared';

export default defineModel({
  name: 'leave_request',
  label: 'Leave Request',
  traits: ['timestamped'],
  fields: {
    employee: field.link('employee', { required: true, label: 'Employee' }),
    leave_type: field.enum(['Annual', 'Sick', 'Personal'], { required: true, label: 'Leave Type' }),
    start_date: field.date({ required: true, label: 'Start Date' }),
    end_date: field.date({ required: true, label: 'End Date' }),
    status: field.enum(['Pending', 'Approved', 'Rejected'], {
      default: 'Pending',
      label: 'Status',
    }),
    days: field.computed({
      depends: ['start_date', 'end_date'],
      compute: (doc) => {
        if (!doc.start_date || !doc.end_date) return 0;
        const start = new Date(doc.start_date as string);
        const end = new Date(doc.end_date as string);
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      },
      stored: true,
    }),
    reason: field.text({ label: 'Reason' }),
  },
  indexes: [
    { fields: ['employee'] },
    { fields: ['status'] },
    { fields: ['start_date', 'end_date'] },
  ],
});
