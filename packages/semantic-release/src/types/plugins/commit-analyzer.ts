/**
 * TypeScript interface for @semantic-release/commit-analyzer plugin configuration.
 *
 * This plugin determines the type of release based on commit messages.
 *
 * @see https://github.com/semantic-release/commit-analyzer
 */

import type {LiteralUnion} from 'type-fest'

/**
 * Rule for determining release type based on commit properties.
 */
export interface ReleaseRule {
  /**
   * The commit type (e.g., 'feat', 'fix', 'docs').
   */
  type?: string

  /**
   * The commit scope.
   */
  scope?: string

  /**
   * The subject of the commit.
   */
  subject?: string

  /**
   * The release type to trigger (major, minor, patch, or false for no release).
   */
  release: 'major' | 'minor' | 'patch' | false

  /**
   * Additional properties for matching commits.
   */
  [key: string]: unknown
}

/**
 * Parser options for conventional-commits-parser.
 */
export interface ParserOptions {
  /**
   * Keywords to identify breaking changes.
   *
   * @default ['BREAKING CHANGE', 'BREAKING CHANGES']
   */
  noteKeywords?: string[]

  /**
   * Pattern for parsing commit header.
   */
  headerPattern?: RegExp

  /**
   * Correspondence between commit header and parsed values.
   */
  headerCorrespondence?: string[]

  /**
   * Pattern for parsing references in commit message.
   */
  referenceActions?: string[]

  /**
   * Whether to include the merge commits.
   */
  mergePattern?: RegExp

  /**
   * Correspondence for merge commits.
   */
  mergeCorrespondence?: string[]

  /**
   * Pattern for parsing revert commits.
   */
  revertPattern?: RegExp

  /**
   * Correspondence for revert commits.
   */
  revertCorrespondence?: string[]

  /**
   * Field names to include in parsed commit.
   */
  fieldPattern?: RegExp

  /**
   * Whether to warn about malformed commits.
   */
  warn?: boolean

  /**
   * Additional parser options.
   */
  [key: string]: unknown
}

/**
 * Configuration for @semantic-release/commit-analyzer plugin.
 */
export interface CommitAnalyzerConfig {
  /**
   * Conventional-changelog preset name.
   *
   * @default 'angular'
   */
  preset?: LiteralUnion<
    | 'angular'
    | 'atom'
    | 'codemirror'
    | 'ember'
    | 'eslint'
    | 'express'
    | 'jquery'
    | 'jshint'
    | 'conventionalcommits',
    string
  >

  /**
   * npm package name of a custom conventional-changelog preset.
   * Cannot be used together with 'preset'.
   */
  config?: string

  /**
   * Additional conventional-commits-parser options.
   * Extends the ones loaded by preset or config.
   */
  parserOpts?: ParserOptions

  /**
   * External module, path to a module, or array of rules for determining release type.
   *
   * Rules are checked in order, and the first matching rule determines the release type.
   */
  releaseRules?: string | ReleaseRule[]

  /**
   * Additional configuration passed to the conventional-changelog preset.
   * Used for example with conventional-changelog-conventionalcommits.
   */
  presetConfig?: Record<string, unknown>

  /**
   * Additional options that might be used by future versions or custom presets.
   */
  [key: string]: unknown
}

/**
 * Context passed to commit analyzer plugins.
 */
export interface AnalyzeCommitsContext {
  /**
   * The semantic-release configuration options.
   */
  options: {
    preset?: string
    [key: string]: unknown
  }

  /**
   * Array of commit objects since the last release.
   */
  commits: {
    /**
     * The commit hash.
     */
    hash: string

    /**
     * The commit message.
     */
    message: string

    /**
     * The commit author.
     */
    author: {
      name: string
      email: string
    }

    /**
     * The commit date.
     */
    committerDate: string

    /**
     * Additional commit properties.
     */
    [key: string]: unknown
  }[]

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
 * Result returned by the analyzeCommits step.
 */
export type AnalyzeCommitsResult = 'major' | 'minor' | 'patch' | null
