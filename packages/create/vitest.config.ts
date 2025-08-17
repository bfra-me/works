import type {ViteUserConfig} from 'vitest/config'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['test/**/*.test.ts'],
    exclude: ['node_modules/', 'dist/', 'test-add-project/', 'test-dry-run/', '**/*.d.ts'],
    testTimeout: 30000, // Allow longer timeouts for integration tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'test/',
        'test-add-project/',
        'test-dry-run/',
        '**/*.d.ts',
        '**/*.config.ts',
        'templates/',
      ],
      thresholds: {
        global: {
          statements: 90,
          branches: 85,
          functions: 90,
          lines: 90,
        },
      },
    },
    pool: 'forks', // Better isolation for file system tests
    poolOptions: {
      forks: {
        singleFork: true, // Prevent race conditions in file tests
      },
    },
  },
} as ViteUserConfig)
