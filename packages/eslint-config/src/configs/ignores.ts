import type {FlatGitignoreOptions} from 'eslint-config-flat-gitignore'
import type {Config} from '../config'
import {GLOB_EXCLUDE} from '../globs'
import {interopDefault} from '../utils'

export async function ignores(ignores: string[] = []): Promise<Config[]> {
  return [
    {
      name: '@bfra.me/ignores',
      ignores: [...GLOB_EXCLUDE, ...ignores],
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
