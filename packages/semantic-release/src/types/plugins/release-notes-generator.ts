/**
 * TypeScript interface for @semantic-release/release-notes-generator plugin configuration.
 *
 * This plugin generates release notes based on commit messages.
 *
 * @see https://github.com/semantic-release/release-notes-generator
 */

import type {LiteralUnion} from 'type-fest'

/**
 * Writer options for customizing the release notes output.
 */
export interface WriterOptions {
  /**
   * Main template for the release notes.
   */
  mainTemplate?: string

  /**
   * Template for each commit group.
   */
  commitGroupsTemplate?: string

  /**
   * Template for each commit.
   */
  commitTemplate?: string

  /**
   * Template for the header.
   */
  headerTemplate?: string

  /**
   * Template for the footer.
   */
  footerTemplate?: string

  /**
   * How to group commits.
   */
  groupBy?: string

  /**
   * How to sort commit groups.
   */
  commitGroupsSort?: string | ((a: unknown, b: unknown) => number)

  /**
   * How to sort commits within groups.
   */
  commitsSort?: string | string[] | ((a: unknown, b: unknown) => number)

  /**
   * How to sort notes within commits.
   */
  noteGroupsSort?: string | ((a: unknown, b: unknown) => number)

  /**
   * How to sort notes.
   */
  notesSort?: string | ((a: unknown, b: unknown) => number)

  /**
   * Transform function for commits.
   */
  transform?: (commit: unknown, context: unknown) => unknown

  /**
   * Additional writer options.
   */
  [key: string]: unknown
}

/**
 * Configuration for @semantic-release/release-notes-generator plugin.
 */
export interface ReleaseNotesGeneratorConfig {
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
   */
  parserOpts?: {
    /**
     * Keywords to identify breaking changes.
     */
    noteKeywords?: string[]

    /**
     * Additional parser options.
     */
    [key: string]: unknown
  }

  /**
   * Additional conventional-changelog-writer options.
   */
  writerOpts?: WriterOptions

  /**
   * Additional configuration passed to the conventional-changelog preset.
   */
  presetConfig?: Record<string, unknown>

  /**
   * Path to a Handlebars template file for customizing the release notes.
   */
  linkCompare?: boolean

  /**
   * Whether to include references in the release notes.
   */
  linkReferences?: boolean

  /**
   * Additional options that might be used by future versions.
   */
  [key: string]: unknown
}

/**
 * Context passed to release notes generator plugins.
 */
export interface GenerateNotesContext {
  /**
   * The semantic-release configuration options.
   */
  options: {
    preset?: string
    repositoryUrl?: string
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
    notes?: string
  }

  /**
   * Information about the next release.
   */
  nextRelease: {
    version: string
    gitTag: string
    type: 'major' | 'minor' | 'patch'
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
 * Result returned by the generateNotes step.
 */
export type GenerateNotesResult = string
