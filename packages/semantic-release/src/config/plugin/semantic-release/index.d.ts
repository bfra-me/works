import type {PluginSpec} from '../plugin-spec'

export interface CommitAnalyzerPluginConfig {
  /**
   * Preset value.
   */
  preset?: string
  releaseRules?: {
    type: string
    scope: string
    release: string
  }[]
}

export type CommitAnalyzerPluginSpec = PluginSpec<
  ['@semantic-release/commit-analyzer', CommitAnalyzerPluginConfig]
>

export interface ReleaseNotesGeneratorPluginConfig {
  /**
   * Preset value.
   */
  preset?: string
}

export type ReleaseNotesGeneratorPluginSpec = PluginSpec<
  ['@semantic-release/release-notes-generator', ReleaseNotesGeneratorPluginConfig]
>

export interface NpmPluginConfig {
  npmPublish?: boolean
}

export type NpmPluginSpec = PluginSpec<['@semantic-release/npm', NpmPluginConfig]>

export interface GitHubPluginConfig {
  /**
   * Some assets
   */
  assets?: string
}

export type GitHubPluginSpec = PluginSpec<['@semantic-release/github', GitHubPluginConfig]>

export interface SemanticReleasePlugins {
  '@semantic-release/commit-analyzer': CommitAnalyzerPluginSpec

  '@semantic-release/release-notes-generator': ReleaseNotesGeneratorPluginSpec

  '@semantic-release/npm': NpmPluginSpec

  '@semantic-release/github': GitHubPluginSpec
}
