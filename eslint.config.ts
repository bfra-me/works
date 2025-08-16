import {defineConfig} from './packages/eslint-config/src'

export const config = defineConfig({
  name: '@bfra.me/works',
  ignores: [
    '.ai/',
    '.github/**/*instructions.md',
    '**/test/fixtures',
    '**/src/templates/**/src/**',
    '**/src/templates/**/package.json',
    '**/src/templates/**/tsconfig.json',
    '**/src/templates/**/README.md',
    '**/src/templates/**/vite.config.ts',
  ],
  packageJson: true,
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  vitest: true,
})

export default config
