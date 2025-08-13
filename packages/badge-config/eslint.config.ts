import {config as rootConfig} from '../../eslint.config'
import {composeConfig} from '../eslint-config/src'

export default composeConfig(rootConfig)
  .insertAfter('@bfra.me/ignores', {
    name: '@bfra.me/badge-config/ignores',
    ignores: ['README.md'],
  })
  .append({
    name: '@bfra.me/badge-config/overrides',
    files: ['test/**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  })
