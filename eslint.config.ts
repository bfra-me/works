import {defineConfig} from './packages/eslint-config/src'

export {composeConfig} from './packages/eslint-config/src'

export const config = defineConfig({
  name: '@bfra.me/works',
  ignores: ['.ai/', '.github/**/*instructions.md', '**/test/fixtures'],
  markdown: {
    language: 'gfm',
    frontmatter: 'yaml',
    processor: {
      enabled: false,
      extractCodeBlocks: false,
    },
    codeBlocks: {
      typescript: true,
      javascript: true,
      jsx: true,
      json: true,
      yaml: true,
    },
  },
  packageJson: true,
  typescript: {
    erasableSyntaxOnly: true,
    tsconfigPath: './tsconfig.json',
  },
  vitest: true,
})

export default config
