import type {Config} from '../config'
import type {Flatten, OptionsFiles, OptionsOverrides} from '../options'
import {GLOB_YAML_FILES} from '../globs'
import {anyParser} from '../parsers/any-parser'
import {requireOf} from '../require-of'
import {interopDefault} from '../utils'
import {fallback} from './fallback'
import {jsonSchema} from './json-schema'

/**
 * Represents the options for configuring YAML files in the ESLint configuration.
 */
export type YamlOptions = Flatten<OptionsFiles & OptionsOverrides>

/**
 * Configures the ESLint rules for YAML files.
 * @param options - The configuration options for YAML files.
 * @see https://ota-meshi.github.io/eslint-plugin-yml/
 */
export async function yaml(options: YamlOptions = {}): Promise<Config[]> {
  const {files = GLOB_YAML_FILES, overrides = {}} = options
  return requireOf(
    ['eslint-plugin-yml'],
    async () => {
      const pluginYaml = await interopDefault(import('eslint-plugin-yml'))

      return [
        ...(pluginYaml.configs['flat/standard'] as Config[]).map((config: Config, index) => ({
          ...config,
          name: config.plugins
            ? `@bfra.me/yaml/plugins`
            : `@bfra.me/${(config.name ?? '') || `yaml/unnamed${index}`}`,
        })),
        ...(await jsonSchema('yaml', files as string[])),
        {
          name: '@bfra.me/yaml',
          files,
          rules: {
            'yml/no-empty-mapping-value': 'off',

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
