import type {BranchSpec} from 'semantic-release'
import type {Plugin} from './plugin'
import type {LiteralUnion} from '../utilities'

export interface CustomExtends {}

export type KnownExtends = LiteralUnion<
  '@bfra.me/semantic-release' | 'semantic-release-monorepo' | keyof CustomExtends
>

export type Extends = KnownExtends | KnownExtends[]

export interface SemanticReleaseConfig {
  extends?: Extends

  branches: ReadonlyArray<BranchSpec> | BranchSpec

  repositoryUrl?: string

  tagFormat?: string

  plugins?: Plugin[]

  dryRun?: boolean

  ci?: boolean | undefined

  [name: string]: unknown
}
