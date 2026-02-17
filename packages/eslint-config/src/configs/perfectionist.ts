import type {Config} from '../config'
import type {Flatten, OptionsIsInEditor, OptionsOverrides, OptionsPerfectionist} from '../options'
import {interopDefault} from '../utils'

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
  const pluginPerfectionist = await interopDefault(import('eslint-plugin-perfectionist'))

  return [
    {
      name: '@bfra.me/perfectionist',
      plugins: {
        perfectionist: pluginPerfectionist,
      },
      rules: {
        ...(sortNamedExports && {
          'perfectionist/sort-named-exports': [
            isInEditor ? 'warn' : 'error',
            {
              groups: ['value-export', 'type-export'],
              type: 'natural',
            },
          ],
        }),

        ...(sortNamedImports && {
          'perfectionist/sort-named-imports': [
            isInEditor ? 'warn' : 'error',
            {
              groups: ['value-import', 'type-import'],
              type: 'natural',
            },
          ],
        }),

        ...(sortExports && {
          'perfectionist/sort-exports': [isInEditor ? 'warn' : 'error', {type: 'natural'}],
        }),

        ...(sortImports && {
          'perfectionist/sort-imports': [
            isInEditor ? 'warn' : 'error',
            {
              customGroups: [
                {
                  elementNamePattern: '^[~#]/.*',
                  groupName: 'internal',
                },
                {
                  elementNamePattern: '^[~#]/.*',
                  groupName: 'internal-type',
                  selector: 'type',
                },
              ],
              groups: [
                'type-import',
                'type-builtin',
                'type-external',
                ['type-parent', 'type-sibling', 'type-index'],
                'value-builtin',
                'value-external',
                ['internal', 'internal-type'],
                ['value-parent', 'value-sibling', 'value-index'],
                'side-effect',
                'style',
              ],
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
