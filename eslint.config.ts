import {defineConfig} from './packages/eslint-config/src'

export {composeConfig} from './packages/eslint-config/src'

export const config = defineConfig({
  name: '@bfra.me/works',
  ignores: ['.ai/', '.github/**/*instructions.md', '**/test/fixtures'],
  packageJson: true,
  typescript: {
    erasableSyntaxOnly: true,
    tsconfigPath: './tsconfig.json',
  },
  vitest: true,
})

export default config
