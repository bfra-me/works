import type {Config} from '../config'
import type {Flatten, OptionsFiles, OptionsOverrides, OptionsPrettier} from '../options'
import {GLOB_YAML} from '../globs'
import {interopDefault} from '../plugins'

/**
 * Represents the options for configuring YAML files in the ESLint configuration.
 */
export type YamlOptions = Flatten<OptionsFiles & OptionsOverrides & OptionsPrettier>

/**
 * Configures the ESLint rules for YAML files.
 * @param options - The configuration options for YAML files.
 * @see https://ota-meshi.github.io/eslint-plugin-yml/
 */
export async function yaml(options: YamlOptions = {}): Promise<Config[]> {
  const {files = [GLOB_YAML], overrides = {}, prettier = true} = options
  const [pluginYaml, parserYaml] = await Promise.all([
    interopDefault(import('eslint-plugin-yml')),
    interopDefault(import('yaml-eslint-parser')),
  ])

  return [
    {
      name: '@bfra.me/yaml/plugins',
      plugins: {yml: pluginYaml as any},
    },
    {
      name: '@bfra.me/yaml',
      files,
      languageOptions: {
        parser: parserYaml,
      },
      rules: {
        ...(pluginYaml.configs.standard.rules as OptionsOverrides['overrides']),
        ...(prettier ? (pluginYaml.configs.prettier.rules as OptionsOverrides['overrides']) : {}),

        'yml/no-empty-mapping-value': 'off',

        ...overrides,
      },
    },
  ]
}
