import { defineHooks } from '@rangka/shared';

export default defineHooks('project.task', {
  validate: (doc) => {
    if (!doc.project) {
      throw new Error('Project is required');
    }
    if (!doc.title) {
      throw new Error('Task title is required');
    }
  },
  beforeSave: (doc) => {
    if (doc.actual_hours !== undefined && doc.estimated_hours !== undefined) {
      if ((doc.actual_hours as number) > (doc.estimated_hours as number) * 2) {
        console.warn(`[hook] Task "${doc.title}" actual hours exceeding 2x estimate`);
      }
    }
    return doc;
  },
});
