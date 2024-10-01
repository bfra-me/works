import {defineConfig} from './packages/eslint-config'

export default defineConfig(
  {
    ignores: ['**/test/fixtures', '**/test/_fixtures'],
    typescript: {
      parserOptions: {
        project: [
          './tsconfig.eslint.json',
          './packages/*/tsconfig.json',
          './packages/*/tsconfig.eslint.json',
        ],
        projectService: false,
      },
      tsconfigPath: './tsconfig.json',
    },
    vitest: true,
  },
  {
    name: '@bfra.me/works/eslint-config',
    files: ['packages/eslint-config/src/**/*.ts'],
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
