import type {Config} from '../config'
import type {Flatten, OptionsOverrides, OptionsStylistic} from '../options'
import {requireOf} from '../require-of'
import {interopDefault} from '../utils'
import {fallback} from './fallback'

/**
 * Configuration options for import-related ESLint rules.
 *
 * Extends base configuration with override capabilities and stylistic options
 * for controlling how import statements are linted and formatted.
 */
export interface ImportsOptions extends Flatten<OptionsOverrides & OptionsStylistic> {}

/**
 * Creates ESLint configuration for import-related rules using eslint-plugin-import-x.
 *
 * @param options - Configuration options for the imports config
 * @param options.overrides - Custom rule overrides to apply on top of the default rules
 * @param options.stylistic - Whether to include stylistic import rules (default: true)
 * @returns Promise that resolves to an array of ESLint configuration objects
 *
 * @example
 * ```typescript
 * // Basic usage with default options
 * const config = await imports();
 *
 * // With custom overrides and stylistic disabled
 * const config = await imports({
 *   stylistic: false,
 *   overrides: {
 *     'import-x/no-duplicates': 'warn'
 *   }
 * });
 * ```
 */
export async function imports(options: ImportsOptions = {}): Promise<Config[]> {
  const {overrides = {}, stylistic = true} = options
  const includeStylistic = typeof stylistic === 'boolean' ? stylistic : true

  return requireOf(
    ['eslint-plugin-import-x'],
    async () => {
      const pluginImportX = await interopDefault(import('eslint-plugin-import-x'))
      return [
        {
          name: '@bfra.me/imports',
          plugins: {
            'import-x': pluginImportX,
          },
          rules: {
            'import-x/no-named-default': 'error',
            'import-x/first': 'error',
            'import-x/no-duplicates': 'error',
            'import-x/no-mutable-exports': 'error',
            'import-x/no-self-import': 'error',
            'import-x/no-useless-path-segments': 'error',
            'import-x/no-webpack-loader-syntax': 'error',

            ...(includeStylistic
              ? {
                  'import-x/newline-after-import': ['warn', {count: 1}],
                }
              : {}),

            ...overrides,
          },
        },
      ]
    },
    fallback,
  )
}
