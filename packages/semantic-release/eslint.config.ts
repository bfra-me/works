// Simple ESLint config that doesn't cause TypeScript rootDir issues
// This avoids importing from @bfra.me/eslint-config to prevent cross-package compilation errors

import type {Linter} from 'eslint'

const config: Linter.Config[] = [
  {
    name: 'semantic-release/ignores',
    ignores: ['node_modules', 'lib', 'docs/getting-started.md'],
  },
  {
    name: 'semantic-release/docs',
    files: ['docs/**/*.md'],
    rules: {
      'prettier/prettier': 'off',
    },
  },
]

export default config
