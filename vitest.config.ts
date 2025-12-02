import {defineConfig} from 'vitest/config'

export default defineConfig({
  resolve: {
    conditions: ['source'],
  },
  test: {
    projects: ['packages/*', 'scripts'],
  },
})
