/**
 * TypeScript interface for @semantic-release/git plugin configuration.
 *
 * This plugin commits files to the Git repository during the prepare step.
 *
 * @see https://github.com/semantic-release/git
 */

/**
 * Configuration for @semantic-release/git plugin.
 */
export interface GitConfig {
  /**
   * Files to commit to the Git repository.
   * Can include glob patterns.
   *
   * @default ['CHANGELOG.md', 'package.json', 'package-lock.json', 'npm-shrinkwrap.json']
   */
  assets?: string | string[]

  /**
   * Commit message template.
   *
   * @default 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
   */
  message?: string

  /**
   * Additional options that might be used by future versions.
   */
  [key: string]: unknown
}

/**
 * Context passed to Git plugins during verify conditions.
 */
export interface GitVerifyConditionsContext {
  /**
   * The semantic-release configuration options.
   */
  options: Record<string, unknown>

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
 * Context passed to Git plugins during prepare step.
 */
export interface GitPrepareContext {
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
 * Result returned by the Git prepare step.
 * Usually undefined as the plugin modifies the Git repository directly.
 */
export type GitResult = void
