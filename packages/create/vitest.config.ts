import type {ViteUserConfig} from 'vitest/config'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['test/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'test/', '**/*.d.ts'],
    },
  },
} as ViteUserConfig)
