/**
 * TypeScript interfaces for semantic-release plugin context objects.
 *
 * This module provides comprehensive type definitions for the context objects
 * passed to each plugin lifecycle stage, based on the semantic-release
 * plugin development documentation.
 */

/**
 * Plugin configuration type.
 * Can be any object with string keys and unknown values.
 */
export type PluginConfig = Record<string, unknown>

/**
 * Git commit information.
 */
export interface Commit {
  /**
   * Commit object with hash information.
   */
  commit: {
    /**
     * Full commit hash.
     */
    long: string

    /**
     * Short commit hash.
     */
    short: string
  }

  /**
   * Tree object with hash information.
   */
  tree: {
    /**
     * Full tree hash.
     */
    long: string

    /**
     * Short tree hash.
     */
    short: string
  }

  /**
   * Commit author information.
   */
  author: {
    /**
     * Author name.
     */
    name: string

    /**
     * Author email.
     */
    email: string

    /**
     * Author date (ISO 8601 timestamp).
     */
    date: string
  }

  /**
   * Commit committer information.
   */
  committer: {
    /**
     * Committer name.
     */
    name: string

    /**
     * Committer email.
     */
    email: string

    /**
     * Committer date (ISO 8601 timestamp).
     */
    date: string
  }

  /**
   * Commit message subject.
   */
  subject: string

  /**
   * Commit message body.
   */
  body: string

  /**
   * Commit hash (same as commit.long).
   */
  hash: string

  /**
   * Committer date (ISO 8601 timestamp).
   */
  committerDate: string

  /**
   * Full commit message.
   */
  message: string

  /**
   * Git tags associated with the commit.
   */
  gitTags: string
}

/**
 * Release information.
 */
export interface Release {
  /**
   * Release version (without 'v' prefix).
   */
  version: string

  /**
   * Git tag for the release (with 'v' prefix).
   */
  gitTag: string

  /**
   * Release channels.
   */
  channels: readonly string[]

  /**
   * Git commit hash for the release.
   */
  gitHead: string

  /**
   * Release name.
   */
  name?: string

  /**
   * Release notes.
   */
  notes?: string
}

/**
 * Next release information with additional fields.
 */
export interface NextRelease extends Release {
  /**
   * Release type ('major', 'minor', 'patch', etc.).
   */
  type: string

  /**
   * Release channel.
   */
  channel: string
}

/**
 * Branch information.
 */
export interface Branch {
  /**
   * Branch channel.
   */
  channel: string

  /**
   * Branch tags configuration.
   */
  tags: Record<string, unknown>

  /**
   * Branch type.
   */
  type: string

  /**
   * Branch name.
   */
  name: string

  /**
   * Branch range.
   */
  range: string

  /**
   * Branch accept pattern.
   */
  accept: readonly string[]

  /**
   * Whether this is the main branch.
   */
  main: boolean
}

/**
 * CI environment information.
 */
export interface CiEnvironment {
  /**
   * Whether running in a CI environment.
   */
  isCi: boolean

  /**
   * Current commit hash.
   */
  commit: string

  /**
   * Current branch name.
   */
  branch: string

  /**
   * Additional CI-specific properties.
   */
  [key: string]: unknown
}

/**
 * Logger interface for plugin logging.
 */
export interface Logger {
  /**
   * Log an informational message.
   */
  log: (message: string, ...args: unknown[]) => void

  /**
   * Log a warning message.
   */
  warn: (message: string, ...args: unknown[]) => void

  /**
   * Log a success message.
   */
  success: (message: string, ...args: unknown[]) => void

  /**
   * Log an error message.
   */
  error: (message: string, ...args: unknown[]) => void

  /**
   * Log a debug message.
   */
  debug?: (message: string, ...args: unknown[]) => void
}

/**
 * Base context object shared by all lifecycle hooks.
 */
export interface BaseContext {
  /**
   * Current working directory.
   */
  cwd: string

  /**
   * Environment variables.
   */
  env: Record<string, string | undefined>

  /**
   * CI environment information.
   */
  envCi: CiEnvironment

  /**
   * Options passed to semantic-release.
   */
  options: Record<string, unknown>

  /**
   * Current branch information.
   */
  branch: Branch

  /**
   * All branches configuration.
   */
  branches: readonly Branch[]

  /**
   * Logger instance for plugin output.
   */
  logger: Logger

  /**
   * Standard output stream.
   */
  stdout: NodeJS.WriteStream

  /**
   * Standard error stream.
   */
  stderr: NodeJS.WriteStream
}

/**
 * Context for verifyConditions lifecycle hook.
 */
export interface VerifyConditionsContext extends BaseContext {}

/**
 * Context for analyzeCommits lifecycle hook.
 */
export interface AnalyzeCommitsContext extends BaseContext {
  /**
   * List of commits to analyze.
   */
  commits: readonly Commit[]

  /**
   * Existing releases.
   */
  releases: readonly Release[]

  /**
   * Last release information.
   */
  lastRelease: Release
}

/**
 * Result type for analyzeCommits lifecycle hook.
 */
export type AnalyzeCommitsResult =
  | 'major'
  | 'premajor'
  | 'minor'
  | 'preminor'
  | 'patch'
  | 'prepatch'
  | 'prerelease'
  | string
  | null
  | undefined

/**
 * Context for verifyRelease lifecycle hook.
 */
export interface VerifyReleaseContext extends BaseContext {
  /**
   * Commits for the release.
   */
  commits: readonly Commit[]

  /**
   * Next release information.
   */
  nextRelease: NextRelease

  /**
   * Existing releases.
   */
  releases: readonly Release[]

  /**
   * Last release information.
   */
  lastRelease: Release
}

/**
 * Context for generateNotes lifecycle hook.
 */
export interface GenerateNotesContext extends BaseContext {
  /**
   * Commits for the release.
   */
  commits: readonly Commit[]

  /**
   * Next release information.
   */
  nextRelease: NextRelease

  /**
   * Existing releases.
   */
  releases: readonly Release[]

  /**
   * Last release information.
   */
  lastRelease: Release
}

/**
 * Result type for generateNotes lifecycle hook.
 */
export type GenerateNotesResult = string

/**
 * Context for prepare lifecycle hook.
 */
export interface PrepareContext extends BaseContext {
  /**
   * Commits for the release.
   */
  commits: readonly Commit[]

  /**
   * Next release information (with populated notes).
   */
  nextRelease: NextRelease & {notes: string}

  /**
   * Existing releases.
   */
  releases: readonly Release[]

  /**
   * Last release information.
   */
  lastRelease: Release
}

/**
 * Context for publish lifecycle hook.
 */
export interface PublishContext extends BaseContext {
  /**
   * Commits for the release.
   */
  commits: readonly Commit[]

  /**
   * Next release information (with populated notes).
   */
  nextRelease: NextRelease & {notes: string}

  /**
   * Existing releases.
   */
  releases: readonly Release[]

  /**
   * Last release information.
   */
  lastRelease: Release
}

/**
 * Result type for publish lifecycle hook.
 */
export interface PublishResult {
  /**
   * Name of the published release.
   */
  name: string

  /**
   * URL of the published release.
   */
  url: string
}

/**
 * Context for success lifecycle hook.
 */
export interface SuccessContext extends BaseContext {
  /**
   * Commits for the release.
   */
  commits: readonly Commit[]

  /**
   * Next release information.
   */
  nextRelease: NextRelease

  /**
   * All releases (populated by publish lifecycle).
   */
  releases: readonly (Release & {name: string; url: string})[]

  /**
   * Last release information.
   */
  lastRelease: Release
}

/**
 * Context for fail lifecycle hook.
 */
export interface FailContext extends BaseContext {
  /**
   * Commits that were being processed.
   */
  commits?: readonly Commit[]

  /**
   * Next release information (if available).
   */
  nextRelease?: NextRelease

  /**
   * Existing releases.
   */
  releases?: readonly Release[]

  /**
   * Last release information (if available).
   */
  lastRelease?: Release

  /**
   * Errors that caused the failure.
   */
  errors: readonly Error[]
}
