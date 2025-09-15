import type {Config} from '../config'
import type {Flatten, OptionsFiles, OptionsOverrides, OptionsStylistic} from '../options'
import {GLOB_YAML_FILES} from '../globs'
import {anyParser} from '../parsers/any-parser'
import {requireOf} from '../require-of'
import {interopDefault} from '../utils'
import {fallback} from './fallback'
import {jsonSchema} from './json-schema'

/**
 * Represents the options for configuring YAML files in the ESLint configuration.
 */
export type YamlOptions = Flatten<OptionsFiles & OptionsOverrides & OptionsStylistic>

/**
 * Configures the ESLint rules for YAML files.
 * @param options - The configuration options for YAML files.
 * @see https://ota-meshi.github.io/eslint-plugin-yml/
 */
export async function yaml(options: YamlOptions = {}): Promise<Config[]> {
  const {files = GLOB_YAML_FILES, overrides = {}, stylistic = true} = options
  const {indent = 2, quotes = 'single'} = typeof stylistic === 'boolean' ? {} : stylistic
  const includeStylistic = typeof stylistic === 'boolean' ? stylistic : true

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
            '@stylistic/spaced-comment': 'off',

            'yml/block-mapping': 'error',
            'yml/block-sequence': 'error',
            'yml/no-empty-key': 'error',
            'yml/no-empty-mapping-value': 'off',
            'yml/no-empty-sequence-entry': 'error',
            'yml/no-irregular-whitespace': 'error',
            'yml/plain-scalar': 'error',

            'yml/vue-custom-block/no-parsing-error': 'error',

            ...(includeStylistic
              ? {
                  'yml/block-mapping-question-indicator-newline': 'error',
                  'yml/block-sequence-hyphen-indicator-newline': 'error',
                  'yml/flow-mapping-curly-newline': 'error',
                  'yml/flow-mapping-curly-spacing': 'error',
                  'yml/flow-sequence-bracket-newline': 'error',
                  'yml/flow-sequence-bracket-spacing': 'error',
                  'yml/indent': ['error', indent === 'tab' ? 2 : indent],
                  'yml/key-spacing': 'error',
                  'yml/no-tab-indent': 'error',
                  'yml/quotes': [
                    'error',
                    {avoidEscape: true, prefer: quotes === 'backtick' ? 'single' : quotes},
                  ],
                  'yml/spaced-comment': 'error',
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
