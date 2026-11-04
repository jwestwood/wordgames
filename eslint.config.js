import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use a seeded Rng from @core/random.' },
      ],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    // Frozen puzzle rules/kernels must be self-contained (also enforced by src/versioning.test.ts).
    files: ['src/versioned/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@core/*', '**/core/**', '**/games/**', 'react', 'react-dom'],
              message: 'Versioned code may only import src/versioned kernels (ARCHITECTURE.md).',
            },
          ],
        },
      ],
    },
  },
  prettier,
);
