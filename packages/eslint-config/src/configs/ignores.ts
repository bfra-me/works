import type {Config} from '../types'
import {GLOB_EXCLUDE} from '../globs'

export async function ignores(ignores: string[] = []): Promise<Config[]> {
  return [
    {
      name: '@bfra.me/ignores',
      ignores: [...GLOB_EXCLUDE, ...ignores],
    },
  ]
}
