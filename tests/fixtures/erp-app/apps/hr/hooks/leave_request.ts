import { defineHooks } from '@rangka/shared';

export default defineHooks('hr.leave_request', {
  validate: (doc) => {
    if (!doc.employee) {
      throw new Error('Employee is required');
    }
    if (!doc.start_date || !doc.end_date) {
      throw new Error('Start and end dates are required');
    }
    const start = new Date(doc.start_date as string);
    const end = new Date(doc.end_date as string);
    if (end < start) {
      throw new Error('End date must be after start date');
    }
  },
  beforeCreate: (doc) => {
    if (!doc.status) {
      doc.status = 'Pending';
    }
    return doc;
  },
});
