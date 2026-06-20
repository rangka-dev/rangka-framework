import { defineHooks } from '@rangka/shared';

export default defineHooks('accounting.journal_entry', {
  validate: (doc) => {
    if (!doc.posting_date) {
      throw new Error('Posting date is required');
    }
  },
  beforeSave: (doc) => {
    if (doc.is_posted === undefined) {
      doc.is_posted = false;
    }
    return doc;
  },
});
