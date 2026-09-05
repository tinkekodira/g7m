import { defineConfig } from 'vitest/config';

/**
 * Single root Vitest config rather than one per package: there is exactly one
 * test runner, one coverage report, and one place to change the gate.
 * See DECISIONS.md ADR-0006.
 */
export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['packages/*/src/**/*.test.ts', 'apps/*/src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
    reporters: process.env.CI ? ['default', 'github-actions'] : ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',

      /**
       * Brief §4.5: the coverage gate is on packages/core specifically. The
       * generator and the 1RM / unit-conversion math are pure functions with
       * no excuse for being untested; UI is covered by Playwright later.
       */
      include: ['packages/core/src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/index.ts', '**/*.d.ts'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
