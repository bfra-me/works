import type {Config} from '../config'
import type {Flatten, OptionsFiles, OptionsOverrides, OptionsPrettier} from '../options'
import {anyParser} from '../parsers/any-parser'
import {interopDefault} from '../plugins'
import {requireOf} from '../require-of'
import {fallback} from './fallback'

/**
 * Represents the options for configuring TOML files in the ESLint configuration.
 */
export type TomlOptions = Flatten<OptionsFiles & OptionsOverrides & OptionsPrettier>

export const tomlFiles = ['*.toml'].flatMap(p => [p, `**/${p}`])

/**
 * Configures the ESLint rules for TOML files.
 * @param options - The configuration options for TOML files.
 * @see https://ota-meshi.github.io/eslint-plugin-toml/
 */
export async function toml(options: TomlOptions = {}): Promise<Config[]> {
  const {files = tomlFiles, overrides = {}, prettier = true} = options
  return requireOf(
    ['eslint-plugin-toml'],
    async () => {
      const pluginToml = await interopDefault(import('eslint-plugin-toml'))

      return [
        ...(pluginToml.configs['flat/standard'] as Config[]),
        {
          name: '@bfra.me/toml',
          files,
          rules: {
            ...(prettier
              ? {
                  // TODO: Detect if the TOML plugin for Prettier is installed
                  // and if so, use the Prettier rules
                  'prettier/prettier': 'off',

                  'toml/array-bracket-newline': 'off',
                  'toml/array-bracket-spacing': 'off',
                  'toml/array-element-newline': 'off',
                  'toml/indent': 'off',
                  'toml/inline-table-curly-spacing': 'off',
                  'toml/key-spacing': 'off',
                  'toml/table-bracket-spacing': 'off',
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
