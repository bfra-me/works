import type {Plugin} from '@eslint/core'
import type {Config} from '../config'
import type {JsxOptions} from '../options'
import {GLOB_JSX, GLOB_TSX} from '../globs'
import {requireOf} from '../require-of'
import {interopDefault} from '../utils'
import {fallback} from './fallback'

/**
 * Create ESLint configuration(s) for JSX/TSX files.
 *
 * @param options - Configuration options for generating the JSX config.
 * @param options.a11y - Controls inclusion of accessibility rules:
 *   - `false` or `undefined` (default): do not include `jsx-a11y` rules,
 *     return only the base config.
 *   - `true`: attempt to load `eslint-plugin-jsx-a11y` and merge its recommended
 *     config into the base config.
 *   - object: treated like `{ overrides?: Record<string, any> }`. The
 *     `overrides` object (if provided) will be merged on top of the plugin's
 *     recommended rules.
 *
 * @returns A Promise that resolves to an array of Config objects. Either a
 * single base config or a base config augmented with `eslint-plugin-jsx-a11y`
 * and merged rules (when `a11y` is enabled and available).
 *
 * @example
 * // Basic usage (no accessibility rules)
 * await jsx()
 *
 * @example
 * // Enable accessibility rules (plugin must be installed)
 * await jsx({ a11y: true })
 *
 * @example
 * // Enable accessibility rules and apply custom rule overrides
 * await jsx({ a11y: { overrides: { 'jsx-a11y/no-static-element-interactions': 'off' } } })
 */
export async function jsx(options: JsxOptions = {}): Promise<Config[]> {
  const {a11y} = options
  const baseConfig: Config = {
    name: '@bfra.me/jsx',
    files: [GLOB_JSX, GLOB_TSX],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {},
    rules: {},
  }

  if (a11y === false || a11y === undefined) {
    return [baseConfig]
  }

  return requireOf(
    ['eslint-plugin-jsx-a11y'],
    async () => {
      const jsxA11yPlugin = await interopDefault(import('eslint-plugin-jsx-a11y'))
      const a11yConfig = jsxA11yPlugin.flatConfigs.recommended
      const a11yRules = {
        ...(a11yConfig.rules ?? {}),
        ...(typeof a11y === 'object' && a11y.overrides ? a11y.overrides : {}),
      } as Config['rules']

      return [
        {
          ...baseConfig,
          ...a11yConfig,
          name: baseConfig.name,
          files: baseConfig.files,
          languageOptions: {
            ...baseConfig.languageOptions,
            ...a11yConfig.languageOptions,
          },
          plugins: {
            ...baseConfig.plugins,
            'jsx-a11y': jsxA11yPlugin as Plugin,
          },
          rules: {
            ...baseConfig.rules,
            ...a11yRules,
          },
        },
      ]
    },
    async missingList =>
      fallback(missingList, {
        name: baseConfig.name,
        files: baseConfig.files,
        languageOptions: baseConfig.languageOptions,
      }),
  )
}
