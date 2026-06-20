import { defineModule } from '@rangka/shared';

export default defineModule({
  name: 'accounting',
  label: 'Accounting',
  icon: 'calculator',
  navigation: [
    {
      section: 'Masters',
      items: [{ page: 'accounting.accounts', label: 'Chart of Accounts', icon: 'list-tree' }],
    },
    {
      section: 'Transactions',
      items: [{ page: 'accounting.journal_entries', label: 'Journal Entries', icon: 'book-open' }],
    },
  ],
});
