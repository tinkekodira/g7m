import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/node_modules/**',
      'apps/mobile/ios/**',
      'apps/mobile/android/**',
      'apps/desktop/src-tauri/target/**',
      'supabase/functions/**', // Deno runtime, different lint pass (Phase 6)
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      /* Brief §0.4 — no `any`. `unknown` + narrowing is the escape hatch. */
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',

      /* Type-only imports must be marked — `verbatimModuleSyntax` needs it. */
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],

      /* Floating promises in a logger that must never lose a set. */
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',

      /* Probing globals a shell injects is legitimately dynamic access. */
      '@typescript-eslint/dot-notation': ['error', { allowIndexSignaturePropertyAccess: true }],

      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },

  /* -------------------------------------------------------------------------
   * Brief §4.1: "packages/core importing anything from React, Capacitor, or
   * Tauri is a bug." Encoded as a lint rule so it fails CI instead of rotting.
   * ---------------------------------------------------------------------- */
  {
    files: ['packages/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-*',
                '@react-three/*',
                'react-dom*',
                'zustand*',
                '@capacitor/*',
                '@capacitor-community/*',
                '@tauri-apps/*',
                'three',
                '@g7m/ui',
                '@g7m/db',
                '@g7m/anatomy',
                '@supabase/*',
                '@powersync/*',
                'drizzle-orm*',
              ],
              message:
                'packages/core is pure domain logic: no UI, no platform, no persistence. ' +
                'It must stay runnable in bare Node and testable without a DOM. (Brief §4.1)',
            },
          ],
        },
      ],
    },
  },

  /* React-specific rules, only where React actually lives. */
  {
    files: [
      'apps/web/**/*.{ts,tsx}',
      'packages/ui/**/*.{ts,tsx}',
      'packages/anatomy/**/*.{ts,tsx}',
    ],
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    languageOptions: { globals: globals.browser },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  /* Config files and tests: relax the type-aware strictness a notch. */
  {
    files: ['**/*.config.{ts,js}', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },

  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },

  prettierConfig,
);
