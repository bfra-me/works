/**
 * TypeScript interface for @semantic-release/changelog plugin configuration.
 *
 * This plugin creates or updates a changelog file.
 *
 * @see https://github.com/semantic-release/changelog
 */

/**
 * Configuration for @semantic-release/changelog plugin.
 */
export interface ChangelogConfig {
  /**
   * File path to create or update the changelog.
   *
   * @default 'CHANGELOG.md'
   */
  changelogFile?: string

  /**
   * Title for the changelog file.
   *
   * @default '# Changelog'
   */
  changelogTitle?: string

  /**
   * Additional options that might be used by future versions.
   */
  [key: string]: unknown
}

/**
 * Context passed to changelog plugins during the prepare step.
 */
export interface ChangelogContext {
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
   * Array of commit objects since the last release.
   */
  commits: {
    hash: string
    message: string
    author: {
      name: string
      email: string
    }
    committerDate: string
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
 * Result returned by the changelog prepare step.
 * Usually undefined as the plugin modifies files directly.
 */
export type ChangelogResult = void
