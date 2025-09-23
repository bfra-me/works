import type {Config} from '../config'
import type {Flatten, OptionsOverrides, StylisticConfig} from '../options'
import {interopDefault} from '../utils'

const StylisticConfigDefaults: StylisticConfig = {
  indent: 2,
  jsx: true,
  quotes: 'single',
  semi: false,
}

/**
 * Configuration options for stylistic ESLint rules.
 *
 * Extends the base stylistic configuration with additional override options,
 * providing a flattened interface for configuring code style and formatting rules.
 */
export interface StylisticOptions extends Flatten<StylisticConfig & OptionsOverrides> {}

/**
 * Creates a stylistic ESLint configuration with customizable formatting rules.
 *
 * @param options - Configuration options for stylistic rules
 * @param options.indent - Indentation style (spaces or tabs)
 * @param options.jsx - Whether to enable JSX-specific rules
 * @param options.overrides - Additional rule overrides to apply
 * @param options.quotes - Quote style preference (single, double, or backtick)
 * @param options.semi - Semicolon usage preference
 * @returns Promise that resolves to an array of ESLint configuration objects
 *
 * @example
 * ```typescript
 * const config = await stylistic({
 *   indent: 2,
 *   quotes: 'single',
 *   semi: false
 * });
 * ```
 */
export async function stylistic(options: StylisticOptions = {}): Promise<Config[]> {
  const {indent, jsx, overrides = {}, quotes, semi} = {...StylisticConfigDefaults, ...options}
  const pluginStylistic = await interopDefault(import('@stylistic/eslint-plugin'))
  const config = pluginStylistic.configs.customize({indent, jsx, quotes, semi})

  return [
    {
      name: '@bfra.me/stylistic',
      plugins: {'@stylistic': pluginStylistic},
      rules: {
        ...config.rules,

        '@stylistic/arrow-parens': ['error', 'as-needed'],
        '@stylistic/brace-style': ['error', '1tbs', {allowSingleLine: true}],
        '@stylistic/generator-star-spacing': ['error', {after: true, before: false}],
        '@stylistic/member-delimiter-style': [
          'error',
          {
            multiline: {delimiter: 'none', requireLast: false},
            singleline: {delimiter: 'semi', requireLast: false},
          },
        ],
        '@stylistic/object-curly-spacing': ['error', 'never'],
        '@stylistic/operator-linebreak': [
          'error',
          'after',
          {overrides: {':': 'before', '?': 'before', '|': 'before'}},
        ],
        '@stylistic/quote-props': ['error', 'as-needed'],
        '@stylistic/quotes': [
          'error',
          quotes,
          {allowTemplateLiterals: 'always', avoidEscape: true},
        ],
        '@stylistic/yield-star-spacing': ['error', {after: true, before: false}],

        ...overrides,
      },
    },
  ]
}
