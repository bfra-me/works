import type {Config} from '../config'
import type {Flatten, OptionsFiles, OptionsOverrides, OptionsStylistic} from '../options'
import {GLOB_JSON_FILES} from '../globs'
import {anyParser} from '../parsers/any-parser'
import {requireOf} from '../require-of'
import {interopDefault} from '../utils'
import {fallback} from './fallback'
import {jsonSchema} from './json-schema'

/**
 * Represents the options for configuring JSONC files in the ESLint configuration.
 */
export type JsoncOptions = Flatten<OptionsFiles & OptionsOverrides & OptionsStylistic>

/**
 * Configures the ESLint rules for JSONC files.
 * @param options - The configuration options for JSONC files.
 * @see https://ota-meshi.github.io/eslint-plugin-jsonc/
 */
export async function jsonc(options: JsoncOptions = {}): Promise<Config[]> {
  const {files = GLOB_JSON_FILES, overrides = {}, stylistic = true} = options
  const {indent = 2} = typeof stylistic === 'boolean' ? {} : stylistic
  const includeStylistic = typeof stylistic === 'boolean' ? stylistic : true

  return requireOf(
    ['eslint-plugin-jsonc'],
    async () => {
      const pluginJsonc = await interopDefault(import('eslint-plugin-jsonc'))

      return [
        ...(pluginJsonc.configs['flat/base'] as unknown as Config[]).map(
          (config: Config, index) => ({
            ...config,
            name: config.plugins
              ? `@bfra.me/jsonc/plugins`
              : `@bfra.me/${(config.name ?? '') || `jsonc/unnamed${index}`}`,
          }),
        ),
        ...(await jsonSchema('jsonc', files as string[])),
        {
          name: '@bfra.me/jsonc',
          files,
          rules: {
            'jsonc/no-bigint-literals': 'error',
            'jsonc/no-binary-expression': 'error',
            'jsonc/no-binary-numeric-literals': 'error',
            'jsonc/no-dupe-keys': 'error',
            'jsonc/no-escape-sequence-in-identifier': 'error',
            'jsonc/no-floating-decimal': 'error',
            'jsonc/no-hexadecimal-numeric-literals': 'error',
            'jsonc/no-infinity': 'error',
            'jsonc/no-multi-str': 'error',
            'jsonc/no-nan': 'error',
            'jsonc/no-number-props': 'error',
            'jsonc/no-numeric-separators': 'error',
            'jsonc/no-octal': 'error',
            'jsonc/no-octal-escape': 'error',
            'jsonc/no-octal-numeric-literals': 'error',
            'jsonc/no-parenthesized': 'error',
            'jsonc/no-plus-sign': 'error',
            'jsonc/no-regexp-literals': 'error',
            'jsonc/no-sparse-arrays': 'error',
            'jsonc/no-template-literals': 'error',
            'jsonc/no-undefined-value': 'error',
            'jsonc/no-unicode-codepoint-escapes': 'error',
            'jsonc/no-useless-escape': 'error',
            'jsonc/space-unary-ops': 'error',
            'jsonc/valid-json-number': 'error',

            'jsonc/vue-custom-block/no-parsing-error': 'error',

            ...(includeStylistic
              ? {
                  'jsonc/array-bracket-spacing': ['error', 'never'],
                  'jsonc/comma-dangle': ['error', 'never'],
                  'jsonc/comma-style': ['error', 'last'],
                  'jsonc/indent': ['error', indent],
                  'jsonc/key-spacing': ['error', {afterColon: true, beforeColon: false}],
                  'jsonc/object-curly-newline': ['error', {consistent: true, multiline: true}],
                  'jsonc/object-curly-spacing': ['error', 'never'],
                  'jsonc/object-property-newline': ['error', {allowAllPropertiesOnSameLine: true}],
                  'jsonc/quote-props': 'error',
                  'jsonc/quotes': 'error',
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
