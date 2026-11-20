import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['src/tests/integration/**/*.integration.spec.ts'],
    globalSetup: ['./src/tests/integration/global-setup.ts'],
    setupFiles: [
      './src/tests/setup.ts',
      './src/tests/integration/database.setup.ts',
      './src/tests/integration/cache.setup.ts',
    ],
    fileParallelism: false,
    hookTimeout: 120000,
  },
});
