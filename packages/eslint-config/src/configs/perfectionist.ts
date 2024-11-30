import type {Config} from '../config'
import type {Flatten, OptionsIsInEditor, OptionsOverrides, OptionsPerfectionist} from '../options'
import {perfectionist as pluginPerfectionist} from '../plugins'

/**
 * Represents the combined options for the Perfectionist ESLint plugin, including options for editor integration, overrides, and the Perfectionist plugin itself.
 */
export type PerfectionistOptions = Flatten<
  OptionsIsInEditor & OptionsOverrides & OptionsPerfectionist
>

/**
 * Perfectionist plugin for sorting items and properties.
 *
 * @see https://github.com/azat-io/eslint-plugin-perfectionist
 */
export async function perfectionist(options: PerfectionistOptions = {}): Promise<Config[]> {
  const {
    isInEditor = false,
    overrides = {},
    sortExports = true,
    sortImports = true,
    sortNamedExports = true,
    sortNamedImports = true,
  } = options
  return [
    {
      name: '@bfra.me/perfectionist',
      plugins: {
        perfectionist: pluginPerfectionist as any,
      },
      rules: {
        ...(sortNamedExports && {
          'perfectionist/sort-named-exports': [
            isInEditor ? 'warn' : 'error',
            {groupKind: 'values-first', type: 'natural'},
          ],
        }),

        ...(sortNamedImports && {
          'perfectionist/sort-named-imports': [
            isInEditor ? 'warn' : 'error',
            {groupKind: 'values-first', type: 'natural'},
          ],
        }),

        ...(sortExports && {
          'perfectionist/sort-exports': [isInEditor ? 'warn' : 'error', {type: 'natural'}],
        }),

        ...(sortImports && {
          'perfectionist/sort-imports': [
            isInEditor ? 'warn' : 'error',
            {
              groups: [
                'type',
                ['parent-type', 'sibling-type', 'index-type'],
                'builtin',
                'external',
                ['internal', 'internal-type'],
                ['parent', 'sibling', 'index'],
                'object',
                'side-effect',
                'side-effect-style',
              ],
              internalPattern: ['^[~#]/.*'],
              newlinesBetween: 'ignore',
              type: 'natural',
            },
          ],
        }),

        ...overrides,
      },
    },
  ]
}
