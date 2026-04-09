import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import playwrightPlugin from 'eslint-plugin-playwright';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  // ── Global ignores ──
  {
    ignores: [
      'node_modules/',
      'playwright-report/',
      'test-results/',
      'allure-results/',
      'allure-report/',
      'blob-report/',
      'scripts/',
      'tools/',
      'dist/',
    ],
  },

  // ── TypeScript files (main config) ──
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      playwright: playwrightPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      // ── Prettier ──
      'prettier/prettier': 'error',

      // ── ESLint recommended (manually applied for flat config) ──
      'no-unused-vars': 'off', // handled by @typescript-eslint
      'no-undef': 'off', // TypeScript handles this

      // ── TypeScript: recommended ──
      ...tsPlugin.configs['recommended'].rules,

      // ── TypeScript: strict additions ──
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/no-confusing-void-expression': 'warn',
      '@typescript-eslint/no-meaningless-void-operator': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',

      // ── TypeScript: type-aware (require parserOptions.project) ──
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',

      // ── TypeScript: overrides ──
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      // CoffeePrices enum has intentional duplicate values (different coffees, same price)
      '@typescript-eslint/no-duplicate-enum-values': 'off',

      // ── Playwright ──
      ...playwrightPlugin.configs['playwright-test'].rules,
      // Conditional logic in E2E/integration tests is a common pattern (e.g., conditional setup/teardown)
      'playwright/no-conditional-in-test': 'off',
    },
  },

  // ── JS config files (relaxed rules) ──
  {
    files: ['*.js', '*.cjs', '*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
];
