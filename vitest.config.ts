import {defineConfig} from 'vitest/config'

export default defineConfig({
  resolve: {
    // Prefer 'source' export condition to resolve workspace packages to TypeScript source
    // This allows tests to run without building dependencies first
    conditions: ['source'],
  },
  test: {
    projects: ['packages/*', 'scripts'],
  },
})
