import tsconfigPaths from 'vite-tsconfig-paths'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: ['**/node_modules/**', '**/lib/**', '**/test/**', '**/*.d.ts', '**/coverage/**'],
      thresholds: {
        global: {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    watch: false,
  },
})
