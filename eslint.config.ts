import {defineConfig} from './packages/eslint-config/src'

export const config = defineConfig({
  name: '@bfra.me/works',
  ignores: ['.github/**/*instructions.md', '**/test/fixtures'],
  packageJson: true,
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  vitest: true,
})

export default config
