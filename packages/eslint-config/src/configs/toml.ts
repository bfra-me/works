import type {Config} from '../config'
import type {Flatten, OptionsFiles, OptionsOverrides} from '../options'
import {GLOB_TOML_FILES} from '../globs'
import {anyParser} from '../parsers/any-parser'
import {requireOf} from '../require-of'
import {interopDefault} from '../utils'
import {fallback} from './fallback'
import {jsonSchema} from './json-schema'

/**
 * Represents the options for configuring TOML files in the ESLint configuration.
 */
export type TomlOptions = Flatten<OptionsFiles & OptionsOverrides>

/**
 * Configures the ESLint rules for TOML files.
 * @param options - The configuration options for TOML files.
 * @see https://ota-meshi.github.io/eslint-plugin-toml/
 */
export async function toml(options: TomlOptions = {}): Promise<Config[]> {
  const {files = GLOB_TOML_FILES, overrides = {}} = options
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
