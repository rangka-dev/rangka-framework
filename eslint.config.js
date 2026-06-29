import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(eslint.configs.recommended, ...tseslint.configs.recommended, {
  ignores: ['**/dist/', '**/node_modules/', '**/.turbo/', '**/*.stories.tsx'],
}, {
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
  },
}, {
  files: ['**/__tests__/**/*.ts', '**/tests/**/*.ts'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
  },
}, {
  files: ['packages/ui/src/**/*.ts', 'packages/ui/src/**/*.tsx'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [{
        group: ['@rangka/client', '@rangka/client/*'],
        message: 'ui must not import from client — see docs/architecture/widget-system.md',
      }],
    }],
  },
});
