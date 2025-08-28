import type {Config} from '../config'
import type {
  Flatten,
  OptionsFiles,
  OptionsOverrides,
  OptionsTypeScriptParserOptions,
  OptionsTypeScriptWithTypes,
} from '../options'
import process from 'node:process'
import {GLOB_ASTRO_TS, GLOB_MARKDOWN, GLOB_TS, GLOB_TSX} from '../globs'
import {anyParser} from '../parsers/any-parser'
import {requireOf} from '../require-of'
import {interopDefault} from '../utils'
import {fallback} from './fallback'

const TypeAwareRules: Config['rules'] = {
  '@typescript-eslint/await-thenable': 'error',
  '@typescript-eslint/dot-notation': ['error', {allowKeywords: true}],
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/no-for-in-array': 'error',
  '@typescript-eslint/no-implied-eval': 'error',
  '@typescript-eslint/no-misused-promises': 'error',
  '@typescript-eslint/no-unnecessary-qualifier': 'error',
  '@typescript-eslint/no-unnecessary-type-assertion': 'error',
  '@typescript-eslint/no-unsafe-argument': 'error',
  '@typescript-eslint/no-unsafe-assignment': 'error',
  '@typescript-eslint/no-unsafe-call': 'error',
  '@typescript-eslint/no-unsafe-member-access': 'error',
  '@typescript-eslint/no-unsafe-return': 'error',
  '@typescript-eslint/prefer-includes': 'error',
  '@typescript-eslint/prefer-readonly': 'error',
  '@typescript-eslint/prefer-readonly-parameter-types': 'off',
  '@typescript-eslint/prefer-string-starts-ends-with': 'error',
  '@typescript-eslint/promise-function-async': 'error',
  '@typescript-eslint/require-array-sort-compare': 'error',
  '@typescript-eslint/restrict-plus-operands': 'error',
  '@typescript-eslint/restrict-template-expressions': 'error',
  '@typescript-eslint/return-await': ['error', 'in-try-catch'],
  '@typescript-eslint/strict-boolean-expressions': [
    'error',
    {allowNullableBoolean: true, allowNullableObject: true},
  ],
  '@typescript-eslint/switch-exhaustiveness-check': 'error',
  '@typescript-eslint/unbound-method': 'error',
  'dot-notation': 'off',
  'no-implied-eval': 'off',
}

/**
 * Represents the options for configuring the TypeScript ESLint configuration.
 * This type is a union of several other option types, including:
 * - {@link OptionsFiles}: Options related to the files to be linted
 * - {@link OptionsOverrides}: Options for overriding the default configuration
 * - {@link OptionsTypeScriptParserOptions}: Options for the TypeScript parser
 * - {@link OptionsTypeScriptWithTypes}: Options related to type-aware linting
 */
export type TypeScriptOptions = Flatten<
  OptionsFiles & OptionsOverrides & OptionsTypeScriptParserOptions & OptionsTypeScriptWithTypes
>

/**
 * Generates a TypeScript ESLint configuration based on the provided options.
 *
 * The configuration includes:
 * - TypeScript-specific plugins and rules
 * - Options for type-aware linting (if a tsconfig.json file is provided)
 * - Overrides for the default configuration
 *
 * @param options - The options for configuring the TypeScript ESLint configuration.
 * @returns An array of ESLint configurations.
 */
export async function typescript(options: TypeScriptOptions = {}): Promise<Config[]> {
  const {overrides = {}, parserOptions = {}, typeAware = {overrides: {}}} = options
  const files = options.files ?? [GLOB_TS, GLOB_TSX]
  const typeAwareFiles = typeAware.files ?? [GLOB_TS, GLOB_TSX]
  const typeAwareIgnores = typeAware.ignores ?? [`${GLOB_MARKDOWN}/**`, GLOB_ASTRO_TS]
  const tsconfigPath = options.tsconfigPath ?? undefined
  const isTypeAware = Boolean(tsconfigPath)

  return requireOf(
    ['typescript-eslint'],
    async () => {
      const tselint = await interopDefault(import('typescript-eslint'))

      const generateTsConfig = (
        kind: 'type-aware' | 'default',
        files: NonNullable<Config['files']>,
        ignores?: Config['ignores'],
      ): Config => ({
        name: `@bfra.me/typescript/${kind === 'type-aware' ? 'type-aware-' : ''}parser`,
        files,
        ...(ignores ? {ignores} : {}),
        languageOptions: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          parser: tselint.parser as any,
          parserOptions: {
            sourceType: 'module',
            ...(kind === 'type-aware'
              ? {
                  projectService: {
                    allowDefaultProject: ['./*.js'],
                    defaultProject: tsconfigPath,
                  },
                  tsconfigRootDir: process.cwd(),
                }
              : {}),
            ...parserOptions,
          },
        },
      })

      return [
        {
          name: '@bfra.me/typescript/plugins',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          plugins: {'@typescript-eslint': tselint.plugin as any},
        },

        ...(isTypeAware
          ? [
              generateTsConfig('default', files, typeAwareFiles),
              generateTsConfig('type-aware', typeAwareFiles, typeAwareIgnores),
            ]
          : [generateTsConfig('default', files)]),

        {
          name: '@bfra.me/typescript/rules',
          files,
          rules: {
            ...tselint.configs.eslintRecommended.rules,
            ...tselint.configs.strict
              .map(config => config.rules)
              .reduce((acc, rules) => ({...acc, ...rules}), {}),

            '@typescript-eslint/no-namespace': 'error',
            '@typescript-eslint/array-type': 'error',
            '@typescript-eslint/ban-ts-comment': [
              'error',
              {'ts-expect-error': 'allow-with-description'},
            ],
            '@typescript-eslint/consistent-type-assertions': 'error',
            '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
            '@typescript-eslint/consistent-type-imports': [
              'error',
              {disallowTypeAnnotations: false, fixStyle: 'inline-type-imports'},
            ],
            '@typescript-eslint/explicit-function-return-type': [
              'error',
              {
                allowExpressions: true,
                allowFunctionsWithoutTypeParameters: true,
                allowHigherOrderFunctions: true,
                allowIIFEs: true,
              },
            ],
            '@typescript-eslint/explicit-member-accessibility': [
              'error',
              {
                accessibility: 'no-public',
              },
            ],
            '@typescript-eslint/method-signature-style': ['error', 'property'],
            '@typescript-eslint/naming-convention': [
              'error',
              {
                format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
                selector: 'variableLike',
              },
              {
                format: ['PascalCase'],
                selector: 'typeLike',
              },
              {
                format: ['camelCase'],
                leadingUnderscore: 'allow',
                selector: 'parameter',
              },
              {
                format: ['PascalCase'],
                selector: 'class',
              },
              {
                custom: {
                  match: false,
                  regex: '^I[A-Z]',
                },
                format: ['PascalCase'],
                selector: 'interface',
              },
            ],
            '@typescript-eslint/no-array-constructor': 'error',
            '@typescript-eslint/no-dupe-class-members': 'error',
            '@typescript-eslint/no-dynamic-delete': 'off',
            '@typescript-eslint/no-empty-object-type': ['error', {allowInterfaces: 'always'}],
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-extraneous-class': 'error',
            '@typescript-eslint/no-import-type-side-effects': 'error',
            '@typescript-eslint/no-inferrable-types': 'error',
            '@typescript-eslint/no-invalid-this': 'error',
            '@typescript-eslint/no-invalid-void-type': 'off',
            '@typescript-eslint/no-misused-new': 'error',
            '@typescript-eslint/no-non-null-assertion': 'warn',
            '@typescript-eslint/no-redeclare': ['error', {builtinGlobals: false}],
            '@typescript-eslint/no-require-imports': 'error',
            '@typescript-eslint/no-unused-expressions': [
              'error',
              {
                allowShortCircuit: true,
                allowTaggedTemplates: true,
                allowTernary: true,
              },
            ],
            // This is reported by `unused-imports/no-unused-vars`
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-use-before-define': [
              'error',
              {classes: false, functions: false, variables: true},
            ],
            '@typescript-eslint/no-useless-constructor': 'off',
            '@typescript-eslint/no-wrapper-object-types': 'error',
            '@typescript-eslint/prefer-for-of': 'warn',
            '@typescript-eslint/prefer-function-type': 'warn',
            '@typescript-eslint/triple-slash-reference': 'off',
            '@typescript-eslint/unified-signatures': 'off',

            'no-dupe-class-members': 'off',
            'no-invalid-this': 'off',
            'no-redeclare': 'off',
            'no-use-before-define': 'off',
            'no-useless-constructor': 'off',

            ...overrides,
          },
        },

        ...(isTypeAware
          ? [
              {
                name: '@bfra.me/typescript/type-aware-rules',
                files: typeAwareFiles,
                ignores: typeAwareIgnores,
                rules: {...TypeAwareRules, ...typeAware?.overrides},
              },
            ]
          : []),
      ]
    },
    async missingList =>
      fallback(missingList, {
        files,
        languageOptions: {
          parser: anyParser,
        },
      }),
  )
}
