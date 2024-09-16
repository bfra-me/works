import eslint from '@eslint/js'
import globals from 'globals'
import {defineConfig} from './define-config'

export default defineConfig(
  {
    ignores: ['**/__tests__', '**/dist', '**/lib', '**/node_modules'],
  },
  eslint.configs.recommended,

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

      camelcase: 'off',

      semi: 'off',
      // Moved to https://eslint.style - https://github.com/typescript-eslint/typescript-eslint/issues/8074
      // '@typescript-eslint/semi': ['error', 'never'],
      // '@typescript-eslint/type-annotation-spacing': 'error',
    },
  },
)

export * from './configs'
export * from './define-config'
export * from './globs'
export * from './types'
