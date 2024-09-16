import {defineConfig} from './src'

export default defineConfig(
  {
    ignores: ['test/fixtures/**', 'test/_fixtures/**'],
  },
  {
    files: ['test/fixtures.test.ts'],
    rules: {'@typescript-eslint/explicit-function-return-type': 'off'},
  },
)
