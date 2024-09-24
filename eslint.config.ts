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
  },
  [
    {
      files: ['**/*.test.ts'],
      rules: {'@typescript-eslint/explicit-function-return-type': 'off'},
    },
  ],
)
