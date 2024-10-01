import {unusedImports as pluginUnusedImports} from '../plugins'
import type {Config, OptionsIsInEditor, OptionsOverrides} from '../types'
import globals from 'globals'

export async function javascript(
  options: OptionsIsInEditor & OptionsOverrides = {},
): Promise<Config[]> {
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
