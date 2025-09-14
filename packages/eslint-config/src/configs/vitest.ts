import type {Config} from '../config'
import type {
  Flatten,
  OptionsFiles,
  OptionsIsInEditor,
  OptionsOverrides,
  OptionsTypeScriptWithTypes,
} from '../options'
import {GLOB_TESTS} from '../globs'
import {anyParser} from '../parsers/any-parser'
import {requireOf} from '../require-of'
import {interopDefault} from '../utils'
import {fallback} from './fallback'

/**
 * Represents the options for the Vitest ESLint configuration.
 * This type is a flattened union of the {@link OptionsFiles}, {@link OptionsIsInEditor}, {@link OptionsOverrides}, and {@link OptionsTypeScriptWithTypes} types.
 */
export type VitestOptions = Flatten<
  OptionsFiles & OptionsIsInEditor & OptionsOverrides & OptionsTypeScriptWithTypes
>

/**
 * Generates an ESLint configuration for the Vitest testing framework.
 *
 * @param options - The options for configuring the Vitest ESLint configuration.
 * @param options.files - The glob pattern(s) to match test files.
 * @param options.isInEditor - Whether the code is being executed in an editor environment.
 * @param options.overrides - Additional rule overrides to apply.
 * @returns An array of ESLint configurations for the Vitest testing framework.
 */
export async function vitest(options: VitestOptions = {}): Promise<Config[]> {
  const {files = GLOB_TESTS, isInEditor = false, overrides = {}, tsconfigPath} = options
  const isTypeAware = typeof tsconfigPath === 'string' && tsconfigPath.trim().length > 0

  return requireOf(
    ['@vitest/eslint-plugin'],
    async (): Promise<Config[]> => {
      const vitest = await interopDefault(import('@vitest/eslint-plugin'))

      return [
        {
          name: '@bfra.me/vitest/plugins',
          plugins: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            vitest: vitest as any,
          },
          ...(isTypeAware
            ? {
                settings: {
                  vitest: {
                    typecheck: true,
                  },
                },
              }
            : {}),
        },
        {
          ...(vitest.configs?.env ?? {}),

          name: '@bfra.me/vitest',
          files,

          rules: {
            ...(vitest.configs?.recommended.rules ?? {}),

            'vitest/consistent-test-it': ['error', {fn: 'it', withinDescribe: 'it'}],
            'vitest/no-focused-tests': isInEditor ? 'off' : ['error', {fixable: true}],
            'vitest/no-import-node-test': 'error',
            'vitest/prefer-hooks-in-order': 'error',
            'vitest/prefer-lowercase-title': 'error',
            // @ts-expect-error - @vitest/eslint-plugin types are incorrect
            'vitest/valid-title': ['error', {allowArguments: true}],

            // Disabled rules
            ...{
              '@typescript-eslint/explicit-function-return-type': 'off',
              'no-unused-expressions': 'off',
              'node/prefer-global/process': 'off',
            },

            ...overrides,
          },
        },
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
