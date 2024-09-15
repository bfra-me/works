import eslint from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import {defineConfig} from './define-config'
import type {Config} from './types'

export default defineConfig(
  tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
      ignores: ['**/__tests__', '**/dist', '**/lib', '**/node_modules'],
    },

    {
      languageOptions: {
        ecmaVersion: 2022,
        globals: {
          ...globals.es2021,
          ...globals.node,
        },

        parserOptions: {
          ecmaVersion: 2022,
          projectService: true,
          sourceType: 'module',
        },
        sourceType: 'module',
      },

      rules: {
        'i18n-text/no-en': 'off',
        'eslint-comments/no-use': 'off',
        'import/no-namespace': 'off',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'error',

        '@typescript-eslint/explicit-member-accessibility': [
          'error',
          {
            accessibility: 'no-public',
          },
        ],

        '@typescript-eslint/no-require-imports': 'error',
        '@typescript-eslint/array-type': 'error',
        '@typescript-eslint/await-thenable': 'error',
        '@typescript-eslint/ban-ts-comment': 'error',
        camelcase: 'off',
        '@typescript-eslint/consistent-type-assertions': 'error',

        '@typescript-eslint/explicit-function-return-type': [
          'error',
          {
            allowExpressions: true,
          },
        ],

        // Moved to https://eslint.style - https://github.com/typescript-eslint/typescript-eslint/issues/8074
        // '@typescript-eslint/func-call-spacing': ['error', 'never'],
        '@typescript-eslint/no-array-constructor': 'error',
        '@typescript-eslint/no-empty-interface': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-extraneous-class': 'error',
        '@typescript-eslint/no-for-in-array': 'error',
        '@typescript-eslint/no-inferrable-types': 'error',
        '@typescript-eslint/no-misused-new': 'error',
        '@typescript-eslint/no-namespace': 'error',
        '@typescript-eslint/no-non-null-assertion': 'warn',
        '@typescript-eslint/no-unnecessary-qualifier': 'error',
        '@typescript-eslint/no-unnecessary-type-assertion': 'error',
        '@typescript-eslint/no-useless-constructor': 'error',
        '@typescript-eslint/no-var-requires': 'error',
        '@typescript-eslint/prefer-for-of': 'warn',
        '@typescript-eslint/prefer-function-type': 'warn',
        '@typescript-eslint/prefer-includes': 'error',
        '@typescript-eslint/prefer-string-starts-ends-with': 'error',
        '@typescript-eslint/promise-function-async': 'error',
        '@typescript-eslint/require-array-sort-compare': 'error',
        '@typescript-eslint/restrict-plus-operands': 'error',
        semi: 'off',
        // Moved to https://eslint.style - https://github.com/typescript-eslint/typescript-eslint/issues/8074
        // '@typescript-eslint/semi': ['error', 'never'],
        // '@typescript-eslint/type-annotation-spacing': 'error',
        '@typescript-eslint/unbound-method': 'error',
      },
    },
  ) as Config[],
)

export * from './define-config'
export * from './types'
