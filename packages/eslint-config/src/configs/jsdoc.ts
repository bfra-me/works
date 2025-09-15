import type {Config} from '../config'
import type {OptionsStylistic} from '../options'
import {requireOf} from '../require-of'
import {interopDefault} from '../utils'
import {fallback} from './fallback'

/**
 * Configuration options for the JSDoc-related ESLint rules.
 *
 * This interface aggregates stylistic configuration for JSDoc handling and
 * currently extends the shared OptionsStylistic type, inheriting its fields.
 * Use this type wherever JSDoc stylistic options are expected.
 *
 * @public
 * @extends OptionsStylistic
 * @remarks
 * No additional properties are declared here — all configuration is provided by
 * the extended OptionsStylistic interface.
 *
 * @example
 * // Example usage (pseudo):
 * // const options: JSDocOptions = { /* fields from OptionsStylistic *\/ };
 *
 * @see OptionsStylistic
 */
export interface JSDocOptions extends OptionsStylistic {}

/**
 * Creates JSDoc ESLint configuration with customizable stylistic rules.
 *
 * @param options - Configuration options for JSDoc rules
 * @param options.stylistic - Whether to include stylistic JSDoc rules (default: true)
 * @returns Promise that resolves to an array of ESLint configurations
 *
 * @example
 * ```typescript
 * // Enable all JSDoc rules including stylistic ones
 * const config = await jsdoc();
 *
 * // Disable stylistic rules
 * const configNoStyle = await jsdoc({ stylistic: false });
 * ```
 */
export async function jsdoc(options: JSDocOptions = {}): Promise<Config[]> {
  const {stylistic = true} = options
  const includeStylistic = typeof stylistic === 'boolean' ? stylistic : true

  return requireOf(
    ['eslint-plugin-jsdoc'],
    async () => [
      {
        name: '@bfra.me/jsdoc',
        plugins: {jsdoc: await interopDefault(import('eslint-plugin-jsdoc'))},
        rules: {
          'jsdoc/check-param-names': 'warn',
          'jsdoc/check-property-names': 'warn',
          'jsdoc/require-param-name': 'warn',
          'jsdoc/require-property-name': 'warn',
          'jsdoc/check-access': 'warn',
          'jsdoc/check-types': 'warn',
          'jsdoc/empty-tags': 'warn',
          'jsdoc/implements-on-classes': 'warn',
          'jsdoc/no-defaults': 'warn',
          'jsdoc/no-multi-asterisks': 'warn',
          'jsdoc/require-property': 'warn',
          'jsdoc/require-property-description': 'warn',
          'jsdoc/require-returns-check': 'warn',
          'jsdoc/require-returns-description': 'warn',
          'jsdoc/require-yields-check': 'warn',

          ...(includeStylistic
            ? {
                'jsdoc/check-alignment': 'warn',
                'jsdoc/multiline-blocks': 'warn',
              }
            : {}),
        },
      },
    ],
    fallback,
  )
}
