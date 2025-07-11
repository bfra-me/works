import {defineConfig} from './packages/eslint-config/src'

export const config = defineConfig({
  name: '@bfra.me/works',
  ignores: ['.github/**/*instructions.md', '**/test/fixtures', '**/test/_fixtures'],
  packageJson: true,
  typescript: {
    parserOptions: {
      project: [
        './tsconfig.eslint.json',
        './docs/tsconfig.json',
        './packages/*/tsconfig.json',
        './packages/*/tsconfig.eslint.json',
      ],
      projectService: false,
    },
    tsconfigPath: './tsconfig.json',
  },
  vitest: true,
})

export default config
