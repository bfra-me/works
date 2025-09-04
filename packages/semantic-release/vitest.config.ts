import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/lib/**', '**/*.d.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        '**/node_modules/**',
        '**/lib/**',
        '**/test/**',
        '**/*.d.ts',
        '**/coverage/**',
        '**/fixtures/**',
      ],
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
    },
    watch: false,
    typecheck: {
      enabled: true,
      checker: 'tsc',
    },
  },
})
