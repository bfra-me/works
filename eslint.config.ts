import {defineConfig} from './packages/eslint-config/src'

export const config = defineConfig({
  name: '@bfra.me/works',
  ignores: ['.ai/', '.github/**/*instructions.md', '**/test/fixtures', 'readme.md/**/*.ts'],
  packageJson: true,
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  vitest: true,
})

export default config
