import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/index.ts', // Entry point, just imports
        'build.mjs'
      ],
      thresholds: {
        lines: 20,
        functions: 40,
        branches: 20,
        statements: 20
      }
    },
    setupFiles: ['./test/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000
  }
});

