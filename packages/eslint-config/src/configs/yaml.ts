import type {Config} from '../config'
import type {Flatten, OptionsFiles, OptionsOverrides, OptionsPrettier} from '../options'
import {anyParser} from '../parsers/any-parser'
import {interopDefault} from '../plugins'
import {requireOf} from '../require-of'
import {fallback} from './fallback'

/**
 * Represents the options for configuring YAML files in the ESLint configuration.
 */
export type YamlOptions = Flatten<OptionsFiles & OptionsOverrides & OptionsPrettier>

export const yamlFiles = ['*.yaml', '*.yml'].flatMap(p => [p, `**/${p}`])

/**
 * Configures the ESLint rules for YAML files.
 * @param options - The configuration options for YAML files.
 * @see https://ota-meshi.github.io/eslint-plugin-yml/
 */
export async function yaml(options: YamlOptions = {}): Promise<Config[]> {
  const {files = yamlFiles, overrides = {}, prettier = true} = options
  return requireOf(
    ['eslint-plugin-yml'],
    async () => {
      const pluginYaml = await interopDefault(import('eslint-plugin-yml'))

      return [
        ...(pluginYaml.configs['flat/standard'] as Config[]),
        {
          name: '@bfra.me/yaml',
          files,
          rules: {
            ...(prettier
              ? (pluginYaml.configs.prettier.rules as OptionsOverrides['overrides'])
              : {}),

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
