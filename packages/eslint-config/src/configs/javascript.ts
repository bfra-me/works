import {unusedImports as pluginUnusedImports} from '../plugins'
import type {Flatten, OptionsIsInEditor, OptionsOverrides} from '../options'
import type {Config} from '../config'
import globals from 'globals'

/**
 * Represents the options for configuring the JavaScript ESLint configuration.
 * This type is a combination of the {@link OptionsIsInEditor} and {@link OptionsOverrides} types.
 */
export type JavaScriptOptions = Flatten<OptionsIsInEditor & OptionsOverrides>

/**
 * Configures the JavaScript ESLint configuration with the specified options.
 *
 * @param options - The options for configuring the JavaScript ESLint configuration.
 * @param options.isInEditor - Indicates whether the code is being edited in an editor.
 * @param options.overrides - Additional overrides for the ESLint rules.
 * @returns An array of ESLint configurations.
 */
export async function javascript(options: JavaScriptOptions = {}): Promise<Config[]> {
  const {isInEditor = false, overrides = {}} = options
  return [
    {
      name: '@bfra.me/javascript/options',
      languageOptions: {
        ecmaVersion: 2022,
        globals: {
          ...globals.browser,
          ...globals.es2021,
          ...globals.node,
        },

        parserOptions: {
          ecmaFeatures: {
            jsx: true,
          },
          ecmaVersion: 2022,
          sourceType: 'module',
        },
        sourceType: 'module',
      },
      linterOptions: {
        reportUnusedDisableDirectives: true,
      },
    },

    {
      name: '@bfra.me/javascript/rules',

      plugins: {
        'unused-imports': pluginUnusedImports,
      },

      rules: {
        camelcase: 'off',
        'no-unused-vars': 'off',

        'unused-imports/no-unused-imports': isInEditor ? 'off' : 'error',
        'unused-imports/no-unused-vars': [
          'error',
          {
            args: 'after-used',
            argsIgnorePattern: '^_',
            ignoreRestSiblings: true,
            vars: 'all',
            varsIgnorePattern: '^_',
          },
        ],

        ...overrides,
      },
    },
  ]
}
