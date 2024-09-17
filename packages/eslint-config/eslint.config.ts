import {defineConfig} from './src'

export default defineConfig(
  {
    ignores: ['lib', 'test/fixtures/**'],
  },
  {
    files: ['test/fixtures.test.ts'],
    rules: {'@typescript-eslint/explicit-function-return-type': 'off'},
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      'perfectionist/sort-objects': [
        'error',
        {
          customGroups: {top: ['name']},
          groups: ['top', 'unknown'],
        },
      ],
    },
  },
)
