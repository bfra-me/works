import {GLOB_TESTS} from '../globs'
import {interopDefault} from '../plugins'
import type {OptionsFiles, OptionsIsInEditor, OptionsOverrides} from '../options'
import type {Config} from '../types'

/**
 * Provides ESLint configurations for testing with Vitest.
 *
 * @param options - The configuration options.
 * @returns The ESLint configurations.
 */
export async function vitest(
  options: OptionsFiles & OptionsIsInEditor & OptionsOverrides = {},
): Promise<Config[]> {
  const {files = GLOB_TESTS, isInEditor = false, overrides = {}} = options

  const [vitestPlugin, noOnlyTests] = await Promise.all([
    interopDefault(import('@vitest/eslint-plugin')),
    // @ts-expect-error - No types
    interopDefault(import('eslint-plugin-no-only-tests')),
  ])

  return [
    {
      name: '@bfra.me/vitest/plugin',
      plugins: {
        vitest: {
          ...vitestPlugin,
          rules: {
            ...vitestPlugin.rules,
            ...noOnlyTests.rules,
          } as typeof vitestPlugin.rules,
        },
      },
    },
    {
      name: '@bfra.me/vitest/rules',
      files,

      rules: {
        // ...vitestPlugin.configs.recommended.rules,

        '@typescript-eslint/explicit-function-return-type': 'off',

        'no-unused-expressions': 'off',

        'vitest/no-only-tests': isInEditor ? 'warn' : 'error',

        ...overrides,
      },
    },
  ]
}
