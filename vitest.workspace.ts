import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/client/vitest.config.ts',
  'packages/core/vitest.config.ts',
  'tests/vitest.config.ts',
]);
