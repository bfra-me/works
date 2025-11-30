import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: ['**/node_modules/**', '**/lib/**', '**/test/**', '**/*.d.ts', '**/coverage/**'],
      thresholds: {
        global: {
          statements: 90,
          branches: 85,
          functions: 90,
          lines: 90,
        },
      },
    },
    watch: false,
  },
})
