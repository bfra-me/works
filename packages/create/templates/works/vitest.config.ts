import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        'lib/**',
        'node_modules/**',
        'test/**',
        '*.config.*'
      ]
    }
  }
})
