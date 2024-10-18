import {defineConfig} from './packages/eslint-config'

export const config = defineConfig({
  name: '@bfra.me/works',
  ignores: ['**/test/fixtures', '**/test/_fixtures'],
  typescript: {
    parserOptions: {
      project: [
        './tsconfig.eslint.json',
        './packages/*/tsconfig.json',
        './packages/*/tsconfig.eslint.json',
        './packages/api-core/test-utils/tsconfig.json',
      ],
      projectService: false,
    },
    tsconfigPath: './tsconfig.json',
  },
  vitest: true,
})

export default config
