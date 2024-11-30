import type {Config} from '../config'
import {perfectionist as pluginPerfectionist} from '../plugins'

/**
 * Perfectionist plugin for sorting items and properties.
 *
 * @see https://github.com/azat-io/eslint-plugin-perfectionist
 */
export async function perfectionist(): Promise<Config[]> {
  return [
    {
      name: '@bfra.me/perfectionist',
      plugins: {
        perfectionist: pluginPerfectionist as any,
      },
      rules: {
        'perfectionist/sort-named-exports': [
          'error',
          {groupKind: 'values-first', order: 'asc', type: 'natural'},
        ],
        'perfectionist/sort-named-imports': [
          'error',
          {groupKind: 'values-first', order: 'asc', type: 'natural'},
        ],
        'perfectionist/sort-exports': ['error', {type: 'natural'}],
      },
    },
  ]
}
