import type {Config} from '../config'
import type {Flatten, OptionsIsInEditor, OptionsOverrides} from '../options'
import globals from 'globals'
import {GLOB_JSX, GLOB_TSX} from '../globs'
import {requireOf} from '../require-of'
import {interopDefault} from '../utils'
import {fallback} from './fallback'

/**
 * Represents the options for configuring the JavaScript ESLint configuration.
 */
export type JavaScriptOptions = Flatten<OptionsIsInEditor & OptionsOverrides & {jsx?: boolean}>

/**
 * Configures the JavaScript ESLint configuration with the specified options.
 *
 * @param options - The options for configuring the JavaScript ESLint configuration.
 * @param options.isInEditor - Indicates whether the code is being edited in an editor.
 * @param options.overrides - Additional overrides for the ESLint rules.
 * @returns An array of ESLint configurations.
 */
export async function javascript(options: JavaScriptOptions = {}): Promise<Config[]> {
  const {isInEditor = false, jsx = true, overrides = {}} = options
  return requireOf(
    ['eslint-plugin-unused-imports'],
    async () => {
      const pluginUnusedImports = await interopDefault(import('eslint-plugin-unused-imports'))
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
            'no-shadow-restricted-names': 'error',
            'no-useless-rename': 'error',
            'accessor-pairs': ['error', {enforceForClassMembers: true, setWithoutGet: true}],
            'array-callback-return': 'error',
            'block-scoped-var': 'error',
            'constructor-super': 'error',
            'default-case-last': 'error',
            'dot-notation': 'error',
            eqeqeq: ['error', 'smart'],
            'new-cap': ['error', {capIsNew: false, newIsCap: true, properties: true}],
            'no-alert': 'error',
            'no-array-constructor': 'error',
            'no-async-promise-executor': 'error',
            'no-caller': 'error',
            'no-case-declarations': 'error',
            'no-class-assign': 'error',
            'no-compare-neg-zero': 'error',
            'no-cond-assign': ['error', 'always'],
            'no-console': ['warn', {allow: ['warn', 'error']}],
            'no-const-assign': 'error',
            'no-control-regex': 'error',
            'no-debugger': 'error',
            'no-delete-var': 'error',
            'no-dupe-args': 'error',
            'no-dupe-class-members': 'error',
            'no-dupe-keys': 'error',
            'no-duplicate-case': 'error',
            'no-duplicate-imports': ['error', {allowSeparateTypeImports: true}],
            'no-empty': ['error', {allowEmptyCatch: true}],
            'no-empty-character-class': 'error',
            'no-empty-pattern': 'error',
            'no-eval': 'error',
            'no-ex-assign': 'error',
            'no-extend-native': 'error',
            'no-extra-bind': 'error',
            'no-extra-boolean-cast': 'error',
            'no-fallthrough': ['warn', {commentPattern: String.raw`break[\s\w]*omitted`}],
            'no-func-assign': 'error',
            'no-global-assign': 'error',
            'no-implied-eval': 'error',
            'no-import-assign': 'error',
            'no-inner-declarations': 'error',
            'no-invalid-regexp': 'error',
            'no-irregular-whitespace': 'error',
            'no-iterator': 'error',
            'no-labels': ['error', {allowLoop: false, allowSwitch: false}],
            'no-lone-blocks': 'error',
            'no-lonely-if': 'error',
            'no-loss-of-precision': 'error',
            'no-misleading-character-class': 'error',
            'no-multi-str': 'error',
            'no-new': 'error',
            'no-new-func': 'error',
            'no-new-native-nonconstructor': 'error',
            'no-new-wrappers': 'error',
            'no-obj-calls': 'error',
            'no-octal': 'error',
            'no-octal-escape': 'error',
            'no-proto': 'error',
            'no-prototype-builtins': 'error',
            'no-redeclare': ['error', {builtinGlobals: false}],
            'no-regex-spaces': 'error',
            'no-restricted-globals': [
              'error',
              {name: 'global', message: 'Use `globalThis` instead.'},
              {name: 'self', message: 'Use `globalThis` instead.'},
            ],
            'no-restricted-properties': [
              'error',
              {
                message: 'Use `Object.getPrototypeOf` or `Object.setPrototypeOf` instead.',
                property: '__proto__',
              },
              {message: 'Use `Object.defineProperty` instead.', property: '__defineGetter__'},
              {message: 'Use `Object.defineProperty` instead.', property: '__defineSetter__'},
              {
                message: 'Use `Object.getOwnPropertyDescriptor` instead.',
                property: '__lookupGetter__',
              },
              {
                message: 'Use `Object.getOwnPropertyDescriptor` instead.',
                property: '__lookupSetter__',
              },
            ],
            'no-restricted-syntax': [
              'error',
              'TSEnumDeclaration[const=true]',
              'TSExportAssignment',
              'ForInStatement',
              'LabeledStatement',
              'WithStatement',
            ],
            'no-self-assign': ['error', {props: true}],
            'no-self-compare': 'error',
            'no-sequences': 'error',
            'no-sparse-arrays': 'error',
            'no-template-curly-in-string': 'error',
            'no-this-before-super': 'error',
            'no-throw-literal': 'error',
            'no-undef': 'error',
            'no-undef-init': 'error',
            'no-unexpected-multiline': 'error',
            'no-unmodified-loop-condition': 'error',
            'no-unneeded-ternary': ['error', {defaultAssignment: false}],
            'no-unreachable': 'error',
            'no-unreachable-loop': 'error',
            'no-unsafe-finally': 'error',
            'no-unused-expressions': [
              'error',
              {
                allowShortCircuit: true,
                allowTaggedTemplates: true,
                allowTernary: true,
              },
            ],

            'no-unused-vars': [
              'error',
              {
                args: 'none',
                caughtErrors: 'none',
                ignoreRestSiblings: true,
                vars: 'all',
              },
            ],
            'no-use-before-define': ['error', {classes: false, functions: false, variables: true}],
            'no-useless-backreference': 'error',
            'no-useless-call': 'error',
            'no-useless-catch': 'error',
            'no-useless-computed-key': 'error',
            'no-useless-constructor': 'error',
            'no-useless-return': 'error',
            'no-var': 'error',
            'no-void': 'error',
            'no-with': 'error',
            'object-shorthand': ['error', 'always', {avoidQuotes: true, ignoreConstructors: false}],
            'one-var': ['error', {initialized: 'never'}],
            'prefer-arrow-callback': [
              'error',
              {
                allowNamedFunctions: false,
                allowUnboundThis: true,
              },
            ],
            'prefer-const': [
              'error',
              {
                destructuring: 'all',
                ignoreReadBeforeAssign: true,
              },
            ],
            'prefer-exponentiation-operator': 'error',
            'prefer-promise-reject-errors': 'error',
            'prefer-regex-literals': ['error', {disallowRedundantWrapping: true}],
            'prefer-rest-params': 'error',
            'prefer-spread': 'error',
            'prefer-template': 'error',
            'symbol-description': 'error',
            'unicode-bom': ['error', 'never'],
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
            'use-isnan': ['error', {enforceForIndexOf: true, enforceForSwitchCase: true}],
            'valid-typeof': ['error', {requireStringLiterals: true}],
            'vars-on-top': 'error',

            ...overrides,
          },
        },

        ...(jsx
          ? [
              {
                name: '@bfra.me/jsx',
                files: [GLOB_JSX, GLOB_TSX],
                languageOptions: {
                  parserOptions: {
                    ecmaFeatures: {
                      jsx: true,
                    },
                  },
                },
              },
            ]
          : []),
      ]
    },
    fallback,
  )
}
