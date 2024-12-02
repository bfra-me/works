import type {run} from '@sxzz/create'
import type {Prettify} from 'ts-essentials'

export type Config = Prettify<NonNullable<Parameters<typeof run>[1]>>

export interface CreatePackageOptions {
  template?: string
  version?: string
  description?: string
  author?: string
  outputDir?: string
}
