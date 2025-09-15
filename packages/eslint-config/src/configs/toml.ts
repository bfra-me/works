import type {Config} from '../config'
import type {Flatten, OptionsFiles, OptionsOverrides, OptionsStylistic} from '../options'
import {GLOB_TOML_FILES} from '../globs'
import {anyParser} from '../parsers/any-parser'
import {requireOf} from '../require-of'
import {interopDefault} from '../utils'
import {fallback} from './fallback'
import {jsonSchema} from './json-schema'

/**
 * Represents the options for configuring TOML files in the ESLint configuration.
 */
export type TomlOptions = Flatten<OptionsFiles & OptionsOverrides & OptionsStylistic>

/**
 * Configures the ESLint rules for TOML files.
 * @param options - The configuration options for TOML files.
 * @see https://ota-meshi.github.io/eslint-plugin-toml/
 */
export async function toml(options: TomlOptions = {}): Promise<Config[]> {
  const {files = GLOB_TOML_FILES, overrides = {}, stylistic = true} = options
  const {indent = 2} = typeof stylistic === 'boolean' ? {} : stylistic
  const includeStylistic = typeof stylistic === 'boolean' ? stylistic : true

  return requireOf(
    ['eslint-plugin-toml'],
    async () => {
      const pluginToml = await interopDefault(import('eslint-plugin-toml'))

      return [
        ...(pluginToml.configs['flat/standard'] as Config[]).map((config: Config, index) => ({
          ...config,
          name: config.plugins
            ? `@bfra.me/toml/plugins`
            : `@bfra.me/${(config.name ?? '') || `toml/unnamed${index}`}`,
        })),
        ...(await jsonSchema('toml', files as string[])),
        {
          name: '@bfra.me/toml',
          files,
          rules: {
            '@stylistic/spaced-comment': 'off',

            'toml/comma-style': 'error',
            'toml/keys-order': 'error',
            'toml/no-space-dots': 'error',
            'toml/no-unreadable-number-separator': 'error',
            'toml/precision-of-fractional-seconds': 'error',
            'toml/precision-of-integer': 'error',
            'toml/tables-order': 'error',

            'toml/vue-custom-block/no-parsing-error': 'error',

            ...(includeStylistic
              ? {
                  'toml/array-bracket-newline': 'error',
                  'toml/array-bracket-spacing': 'error',
                  'toml/array-element-newline': 'error',
                  'toml/indent': ['error', indent === 'tab' ? 2 : indent],
                  'toml/inline-table-curly-spacing': 'error',
                  'toml/key-spacing': 'error',
                  'toml/padding-line-between-pairs': 'error',
                  'toml/padding-line-between-tables': 'error',
                  'toml/quoted-keys': 'error',
                  'toml/spaced-comment': 'error',
                  'toml/table-bracket-spacing': 'error',
                }
              : {}),

            ...overrides,
          },
        },
      ]
    },
    async missingList =>
      fallback(missingList, {
        files,
        languageOptions: {parser: anyParser},
      }),
  )
}
