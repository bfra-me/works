import type {Config} from '../config'
import type {Flatten, OptionsFiles, OptionsOverrides, OptionsPrettier} from '../options'
import {GLOB_TOML} from '../globs'
import {interopDefault} from '../plugins'

/**
 * Represents the options for configuring TOML files in the ESLint configuration.
 */
export type TomlOptions = Flatten<OptionsFiles & OptionsOverrides & OptionsPrettier>

/**
 * Configures the ESLint rules for TOML files.
 * @param options - The configuration options for TOML files.
 * @see https://ota-meshi.github.io/eslint-plugin-toml/
 */
export async function toml(options: TomlOptions = {}): Promise<Config[]> {
  const {files = [GLOB_TOML], overrides = {}, prettier = true} = options
  const [pluginToml, parserToml] = await Promise.all([
    interopDefault(import('eslint-plugin-toml')),
    interopDefault(import('toml-eslint-parser')),
  ])

  return [
    {
      name: '@bfra.me/toml/plugins',
      plugins: {toml: pluginToml as any},
    },
    {
      name: '@bfra.me/toml',
      files,
      languageOptions: {
        parser: parserToml,
      },
      rules: {
        ...(pluginToml.configs.standard.rules as OptionsOverrides['overrides']),
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
}
