import {defineConfig} from '@bfra.me/eslint-config'

export default defineConfig({
  name: '@bfra.me/api-core',
  ignores: ['test-utils'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        name: 'fs/promises',
        message: "Please use `fs` instead as some client frameworks don't polyfill `fs/promises`.",
      },
    ],

    '@typescript-eslint/explicit-function-return-type': 'off',
  },
  typescript: {
    parserOptions: {
      project: ['./tsconfig.json', './tsconfig.eslint.json'],
      projectService: false,
    },
    tsconfigPath: './tsconfig.json',
  },
  vitest: true,
})
