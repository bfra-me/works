/**
 * TypeScript interface for @semantic-release/github plugin configuration.
 *
 * This plugin publishes GitHub releases and verifies GitHub authentication.
 *
 * @see https://github.com/semantic-release/github
 */

/**
 * Asset configuration for GitHub releases.
 */
export interface GithubAsset {
  /**
   * Path to the asset file(s). Can include glob patterns.
   */
  path: string

  /**
   * Name of the asset in the GitHub release.
   */
  name?: string

  /**
   * Label for the asset in the GitHub release.
   */
  label?: string
}

/**
 * Configuration for @semantic-release/github plugin.
 */
export interface GithubConfig {
  /**
   * GitHub API URL.
   *
   * @default 'https://api.github.com'
   */
  githubUrl?: string

  /**
   * GitHub API endpoint path prefix.
   *
   * @default '/api/v3'
   */
  githubApiPathPrefix?: string

  /**
   * Proxy URL for GitHub API requests.
   */
  proxy?: string

  /**
   * Assets to upload to the GitHub release.
   * Can be a string (glob pattern), array of strings, or array of asset objects.
   */
  assets?: string | string[] | GithubAsset[]

  /**
   * Labels to add to pull requests and issues.
   */
  labels?: string[]

  /**
   * Template for the GitHub release name.
   *
   * @default '${nextRelease.gitTag}'
   */
  releasedLabels?: string[]

  /**
   * Comment on resolved issues and merged pull requests.
   *
   * @default true
   */
  addReleases?: 'bottom' | 'top' | false

  /**
   * Draft release instead of publishing immediately.
   *
   * @default false
   */
  draft?: boolean

  /**
   * Template for issue and pull request comments.
   */
  successComment?: string | false

  /**
   * Template for issue comments when a release fails.
   */
  failComment?: string | false

  /**
   * Template for the release title.
   */
  failTitle?: string

  /**
   * Template for issue labels when a release fails.
   */
  failLabels?: string[]

  /**
   * Template for discussion category when a release is published.
   */
  discussionCategoryName?: string

  /**
   * Additional options that might be used by future versions.
   */
  [key: string]: unknown
}

/**
 * Context passed to GitHub plugins during verify conditions.
 */
export interface GithubVerifyConditionsContext {
  /**
   * The semantic-release configuration options.
   */
  options: {
    repositoryUrl?: string
    [key: string]: unknown
  }

  /**
   * Environment variables.
   */
  env: {
    GITHUB_TOKEN?: string
    GH_TOKEN?: string
    [key: string]: string | undefined
  }

  /**
   * Current working directory.
   */
  cwd: string

  /**
   * Logger instance.
   */
  logger: {
    log: (message: string, ...args: unknown[]) => void
    error: (message: string, ...args: unknown[]) => void
    success: (message: string, ...args: unknown[]) => void
  }
}

/**
 * Context passed to GitHub plugins during publish step.
 */
export interface GithubPublishContext {
  /**
   * The semantic-release configuration options.
   */
  options: Record<string, unknown>

  /**
   * Information about the next release.
   */
  nextRelease: {
    version: string
    gitTag: string
    type: 'major' | 'minor' | 'patch'
    notes: string
    channel?: string
  }

  /**
   * Information about the last release.
   */
  lastRelease: {
    version: string
    gitTag: string
    gitHead: string
  }

  /**
   * Array of releases published in previous steps.
   */
  releases: {
    name: string
    url: string
    [key: string]: unknown
  }[]

  /**
   * Environment variables.
   */
  env: Record<string, string | undefined>

  /**
   * Current working directory.
   */
  cwd: string

  /**
   * Logger instance.
   */
  logger: {
    log: (message: string, ...args: unknown[]) => void
    error: (message: string, ...args: unknown[]) => void
    success: (message: string, ...args: unknown[]) => void
  }
}

/**
 * Context passed to GitHub plugins during success step.
 */
export interface GithubSuccessContext extends GithubPublishContext {
  /**
   * Array of releases published by the publish step.
   */
  releases: {
    name: string
    url: string
    [key: string]: unknown
  }[]
}

/**
 * Context passed to GitHub plugins during fail step.
 */
export interface GithubFailContext {
  /**
   * The semantic-release configuration options.
   */
  options: Record<string, unknown>

  /**
   * The error that caused the failure.
   */
  errors: Error[]

  /**
   * Environment variables.
   */
  env: Record<string, string | undefined>

  /**
   * Current working directory.
   */
  cwd: string

  /**
   * Logger instance.
   */
  logger: {
    log: (message: string, ...args: unknown[]) => void
    error: (message: string, ...args: unknown[]) => void
    success: (message: string, ...args: unknown[]) => void
  }
}

/**
 * Result returned by the GitHub publish step.
 */
export interface GithubPublishResult {
  /**
   * The name of the GitHub release.
   */
  name: string

  /**
   * The URL of the GitHub release.
   */
  url: string

  /**
   * The ID of the GitHub release.
   */
  id?: number
}
