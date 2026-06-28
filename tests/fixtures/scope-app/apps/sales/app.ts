import { defineApp } from '@rangka/shared';

export default defineApp({
  name: 'sales',
  label: 'Sales',
  depends: ['tenant'],
});
