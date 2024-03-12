import type {BranchSpec} from 'semantic-release'
import type {LiteralUnion} from 'type-fest'
import type {Plugin} from './plugin'

export interface CustomExtends {}

export type KnownExtends = LiteralUnion<
  '@bfra.me/semantic-release' | 'semantic-release-monorepo' | keyof CustomExtends,
  string
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
