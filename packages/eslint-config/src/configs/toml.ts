import type {Config} from '../config'
import type {Flatten, OptionsFiles, OptionsOverrides} from '../options'
import {anyParser} from '../parsers/any-parser'
import {interopDefault} from '../plugins'
import {requireOf} from '../require-of'
import {fallback} from './fallback'
import {jsonSchema} from './json-schema'

/**
 * Represents the options for configuring TOML files in the ESLint configuration.
 */
export type TomlOptions = Flatten<OptionsFiles & OptionsOverrides>

export const tomlFiles = ['*.toml'].flatMap(p => [p, `**/${p}`])

/**
 * Configures the ESLint rules for TOML files.
 * @param options - The configuration options for TOML files.
 * @see https://ota-meshi.github.io/eslint-plugin-toml/
 */
export async function toml(options: TomlOptions = {}): Promise<Config[]> {
  const {files = tomlFiles, overrides = {}} = options
  return requireOf(
    ['eslint-plugin-toml'],
    async () => {
      const pluginToml = await interopDefault(import('eslint-plugin-toml'))

      return [
        ...(pluginToml.configs['flat/standard'] as Config[]).map((config: Config, index) => ({
          ...config,
          name: config.plugins
            ? `@bfra.me/toml/plugins`
            : `@bfra.me/${config.name || `toml/unnamed${index}`}`,
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
