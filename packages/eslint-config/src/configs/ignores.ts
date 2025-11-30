import type {FlatGitignoreOptions} from 'eslint-config-flat-gitignore'
import type {Config} from '../config'
import {GLOB_EXCLUDE} from '../globs'
import {interopDefault} from '../utils'

/**
 * Generates an ESLint configuration section that merges built-in glob exclusions
 * with user-provided ignore patterns.
 *
 * Accepts either:
 * - An array of glob patterns to append to the default exclusions.
 * - A function that receives the original exclusions and returns a transformed array.
 *
 * The result is a single configuration entry named `@bfra.me/ignores` containing the
 * computed ignore list.
 *
 * @param userIgnores - An array of glob patterns to add to the defaults, or a
 * function that maps the original exclusions to a new set. Defaults to an empty array.
 * @returns A promise resolving to an array with one `Config` object that includes the merged ignores.
 *
 * @example
 * // Append additional patterns
 * await ignores(['dist/**', 'coverage/**'])
 *
 * @example
 * // Transform the defaults
 * await ignores((originals) => originals.filter((p) => !p.includes('node_modules')))
 */
export async function ignores(
  userIgnores: string[] | ((originals: string[]) => string[]) = [],
): Promise<Config[]> {
  let ignores = [...GLOB_EXCLUDE]

  if (typeof userIgnores === 'function') {
    ignores = userIgnores(ignores)
  } else {
    ignores.push(...userIgnores)
  }

  return [
    {
      name: '@bfra.me/ignores',
      ignores,
    },
  ]
}

export async function gitignore(
  gitignoreOptions: FlatGitignoreOptions = {strict: false},
): Promise<Config[]> {
  return interopDefault(import('eslint-config-flat-gitignore')).then(ignore => [
    ignore({
      name: '@bfra.me/gitignore',
      ...gitignoreOptions,
    }),
  ])
}
