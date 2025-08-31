/**
 * TypeScript interface for @semantic-release/npm plugin configuration.
 *
 * This plugin publishes npm packages and verifies npm registry authentication.
 *
 * @see https://github.com/semantic-release/npm
 */

import type {LiteralUnion} from 'type-fest'

/**
 * Configuration for @semantic-release/npm plugin.
 */
export interface NpmConfig {
  /**
   * Directory path to publish.
   *
   * @default '.'
   */
  pkgRoot?: string

  /**
   * Whether to publish the package to the npm registry.
   *
   * @default true
   */
  npmPublish?: boolean

  /**
   * The npm tag to publish to.
   *
   * @default 'latest' for regular releases, or the prerelease identifier for prerelease versions
   */
  tarballDir?: string

  /**
   * Additional options that might be used by future versions.
   */
  [key: string]: unknown
}

/**
 * Context passed to npm plugins during verify conditions.
 */
export interface NpmVerifyConditionsContext {
  /**
   * The semantic-release configuration options.
   */
  options: {
    npmPublish?: boolean
    pkgRoot?: string
    [key: string]: unknown
  }

  /**
   * Environment variables.
   */
  env: {
    NPM_TOKEN?: string
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
 * Context passed to npm plugins during prepare step.
 */
export interface NpmPrepareContext {
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
 * Context passed to npm plugins during publish step.
 */
export interface NpmPublishContext extends NpmPrepareContext {
  /**
   * Information about the next release.
   */
  nextRelease: {
    version: string
    gitTag: string
    type: 'major' | 'minor' | 'patch'
    channel?: string
    notes: string
  }
}

/**
 * Result returned by the npm publish step.
 */
export interface NpmPublishResult {
  /**
   * The name of the published package.
   */
  name: string

  /**
   * The URL of the published package.
   */
  url: string

  /**
   * The npm dist-tag the package was published to.
   */
  channel: LiteralUnion<'latest' | 'next' | 'beta' | 'alpha', string>
}
