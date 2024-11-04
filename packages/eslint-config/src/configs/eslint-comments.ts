import type {Config} from '../config'
import {eslintComments as _eslintComments} from '../plugins'

export async function eslintComments(): Promise<Config[]> {
  return [
    {
      name: '@bfra.me/eslint-comments/rules',
      plugins: {'eslint-comments': _eslintComments},
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
