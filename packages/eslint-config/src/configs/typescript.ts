import process from 'node:process'
import {GLOB_TS, GLOB_TSX} from '../globs'
import {interopDefault} from '../plugins'
import type {
  Flatten,
  OptionsFiles,
  OptionsOverrides,
  OptionsTypeScriptParserOptions,
  OptionsTypeScriptWithTypes,
} from '../options'
import type {Config} from '../config'

const TypeAwareRules: Config['rules'] = {
  '@typescript-eslint/await-thenable': 'error',
  '@typescript-eslint/dot-notation': ['error', {allowKeywords: true}],
  '@typescript-eslint/no-for-in-array': 'error',
  '@typescript-eslint/no-unnecessary-qualifier': 'error',
  '@typescript-eslint/no-unnecessary-type-assertion': 'error',
  '@typescript-eslint/prefer-includes': 'error',
  '@typescript-eslint/prefer-string-starts-ends-with': 'error',
  '@typescript-eslint/promise-function-async': 'error',
  '@typescript-eslint/require-array-sort-compare': 'error',
  '@typescript-eslint/restrict-plus-operands': 'error',
  '@typescript-eslint/unbound-method': 'error',
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
  const typeAwareIgnores = typeAware.ignores ?? ['**/*.md/**', '**/*.astro/*.ts']
  const tsconfigPath = options.tsconfigPath ?? undefined
  const isTypeAware = Boolean(tsconfigPath)

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
      plugins: {'@typescript-eslint': tselint.plugin as any},
    },

    ...(isTypeAware
      ? [
          generateTsConfig('default', files),
          generateTsConfig('type-aware', typeAwareFiles, typeAwareIgnores),
        ]
      : [generateTsConfig('default', files)]),

    {
      name: '@bfra.me/typescript/rules',
      files,
      rules: {
        ...tselint.configs.eslintRecommended.rules,

        '@typescript-eslint/array-type': 'error',
        '@typescript-eslint/ban-ts-comment': [
          'error',
          {'ts-expect-error': 'allow-with-description'},
        ],
        '@typescript-eslint/consistent-type-assertions': 'error',
        '@typescript-eslint/consistent-type-imports': [
          'error',
          {disallowTypeAnnotations: false, fixStyle: 'inline-type-imports'},
        ],
        '@typescript-eslint/explicit-function-return-type': [
          'error',
          {
            allowExpressions: true,
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
        '@typescript-eslint/no-array-constructor': 'error',
        '@typescript-eslint/no-empty-object-type': ['error', {allowInterfaces: 'always'}],
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-extraneous-class': 'error',
        '@typescript-eslint/no-inferrable-types': 'error',
        '@typescript-eslint/no-misused-new': 'error',
        '@typescript-eslint/no-namespace': 'error',
        '@typescript-eslint/no-non-null-assertion': 'warn',
        '@typescript-eslint/no-require-imports': 'error',
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/no-useless-constructor': 'error',
        '@typescript-eslint/prefer-for-of': 'warn',
        '@typescript-eslint/prefer-function-type': 'warn',

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
}
