import type {Config} from '../config'
import type {Flatten, OptionsFiles, OptionsOverrides} from '../options'
import {anyParser} from '../parsers/any-parser'
import {interopDefault} from '../plugins'
import {requireOf} from '../require-of'
import {fallback} from './fallback'
import {jsonSchema} from './json-schema'

/**
 * Represents the options for configuring YAML files in the ESLint configuration.
 */
export type YamlOptions = Flatten<OptionsFiles & OptionsOverrides>

export const yamlFiles = ['*.yaml', '*.yml'].flatMap(p => [p, `**/${p}`])

/**
 * Configures the ESLint rules for YAML files.
 * @param options - The configuration options for YAML files.
 * @see https://ota-meshi.github.io/eslint-plugin-yml/
 */
export async function yaml(options: YamlOptions = {}): Promise<Config[]> {
  const {files = yamlFiles, overrides = {}} = options
  return requireOf(
    ['eslint-plugin-yml'],
    async () => {
      const pluginYaml = await interopDefault(import('eslint-plugin-yml'))

      return [
        ...(pluginYaml.configs['flat/standard'] as Config[]).map((config: Config, index) => ({
          ...config,
          name: config.plugins
            ? `@bfra.me/yaml/plugins`
            : `@bfra.me/${config.name || `yaml/unnamed${index}`}`,
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
