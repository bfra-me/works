import type {Plugin} from '@eslint/core'
import type {Config} from '../config'
import {pluginEslintComments} from '../plugins'

export function eslintComments(): Config[] {
  return [
    {
      name: '@bfra.me/eslint-comments/rules',
      plugins: {'eslint-comments': pluginEslintComments as Plugin},
      rules: {
        'eslint-comments/disable-enable-pair': ['error', {allowWholeFile: true}],
        'eslint-comments/no-aggregating-enable': 'error',
        'eslint-comments/no-duplicate-disable': 'error',
        'eslint-comments/no-unlimited-disable': 'error',
        'eslint-comments/no-unused-disable': 'error',
        'eslint-comments/no-unused-enable': 'error',
      },
    },
  ]
}
