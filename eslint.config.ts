import {defineConfig} from './packages/eslint-config/src'

export const config = defineConfig({
  name: '@bfra.me/works',
  ignores: ['**/test/fixtures', '**/test/_fixtures', 'docs/memory/**'],
  packageJson: true,
  typescript: {
    parserOptions: {
      project: [
        './tsconfig.eslint.json',
        './packages/*/tsconfig.json',
        './packages/*/tsconfig.eslint.json',
        './scripts/tsconfig.json',
        './scripts/tsconfig.eslint.json',
      ],
      projectService: false,
    },
    tsconfigPath: './tsconfig.json',
  },
  vitest: true,
})

export default config
