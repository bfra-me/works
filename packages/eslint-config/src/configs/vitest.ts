import type {Config} from '../config'
import type {Flatten, OptionsFiles, OptionsIsInEditor, OptionsOverrides} from '../options'
import {GLOB_TESTS} from '../globs'
import {anyParser} from '../parsers/any-parser'
import {interopDefault} from '../plugins'
import {requireOf} from '../require-of'
import {fallback} from './fallback'

/**
 * Represents the options for the Vitest ESLint configuration.
 * This type is a flattened union of the {@link OptionsFiles}, {@link OptionsIsInEditor}, and {@link OptionsOverrides} types.
 */
export type VitestOptions = Flatten<OptionsFiles & OptionsIsInEditor & OptionsOverrides>

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
  const {files = GLOB_TESTS, isInEditor = false, overrides = {}} = options

  return requireOf(
    ['@vitest/eslint-plugin', 'eslint-plugin-no-only-tests'],
    async (): Promise<Config[]> => {
      const [vitest, noOnlyTests] = await Promise.all([
        interopDefault(import('@vitest/eslint-plugin')),
        // @ts-expect-error - No types
        interopDefault(import('eslint-plugin-no-only-tests')),
      ])

      return [
        {
          name: '@bfra.me/vitest/plugins',
          plugins: {
            vitest: {
              ...vitest,
              rules: {
                ...vitest.rules,
                ...noOnlyTests.rules,
              } as typeof vitest.rules,
            },
          },
          settings: {
            vitest: {
              typecheck: true,
            },
          },
        },
        {
          ...(vitest.configs?.env ?? {}),

          name: '@bfra.me/vitest',
          files,

          rules: {
            ...(vitest.configs?.recommended.rules ?? {}),

            '@typescript-eslint/explicit-function-return-type': 'off',

            'no-unused-expressions': 'off',

            'vitest/no-only-tests': isInEditor ? 'warn' : 'error',
            'vitest/valid-title': ['error', {allowArguments: true}],

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
