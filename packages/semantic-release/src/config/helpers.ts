/**
 * Type-safe plugin configuration helpers for popular semantic-release plugins.
 *
 * This module provides helper functions that create properly typed and validated
 * configurations for popular semantic-release plugins, enhancing the developer
 * experience with IntelliSense support and runtime validation.
 */

import type {PluginSpec} from '../types/core.js'
import type {
  ChangelogConfig,
  CommitAnalyzerConfig,
  GitConfig,
  GithubConfig,
  NpmConfig,
  ReleaseNotesGeneratorConfig,
} from '../types/index.js'

/**
 * Create a type-safe configuration for @semantic-release/commit-analyzer plugin.
 *
 * @param config - Plugin configuration options
 * @returns Plugin specification tuple
 */
export function commitAnalyzer(config?: CommitAnalyzerConfig): PluginSpec {
  if (config === undefined) {
    return '@semantic-release/commit-analyzer'
  }
  return ['@semantic-release/commit-analyzer', config]
}

/**
 * Create a type-safe configuration for @semantic-release/release-notes-generator plugin.
 *
 * @param config - Plugin configuration options
 * @returns Plugin specification tuple
 */
export function releaseNotesGenerator(config?: ReleaseNotesGeneratorConfig): PluginSpec {
  if (config === undefined) {
    return '@semantic-release/release-notes-generator'
  }
  return ['@semantic-release/release-notes-generator', config]
}

/**
 * Create a type-safe configuration for @semantic-release/changelog plugin.
 *
 * @param config - Plugin configuration options
 * @returns Plugin specification tuple
 */
export function changelog(config?: ChangelogConfig): PluginSpec {
  if (config === undefined) {
    return '@semantic-release/changelog'
  }
  return ['@semantic-release/changelog', config]
}

/**
 * Create a type-safe configuration for @semantic-release/npm plugin.
 *
 * @param config - Plugin configuration options
 * @returns Plugin specification tuple
 */
export function npm(config?: NpmConfig): PluginSpec {
  if (config === undefined) {
    return '@semantic-release/npm'
  }
  return ['@semantic-release/npm', config]
}

/**
 * Create a type-safe configuration for @semantic-release/github plugin.
 *
 * @param config - Plugin configuration options
 * @returns Plugin specification tuple
 */
export function github(config?: GithubConfig): PluginSpec {
  if (config === undefined) {
    return '@semantic-release/github'
  }
  return ['@semantic-release/github', config]
}

/**
 * Create a type-safe configuration for @semantic-release/git plugin.
 *
 * @param config - Plugin configuration options
 * @returns Plugin specification tuple
 */
export function git(config?: GitConfig): PluginSpec {
  if (config === undefined) {
    return '@semantic-release/git'
  }
  return ['@semantic-release/git', config]
}

/**
 * Collection of commonly used plugin configurations as presets.
 */
export const pluginPresets = {
  /**
   * Standard commit analyzer with conventional commits preset.
   */
  standardCommitAnalyzer: commitAnalyzer({
    preset: 'conventionalcommits',
    releaseRules: [
      {type: 'docs', scope: 'README', release: 'patch'},
      {type: 'refactor', release: 'patch'},
      {scope: 'no-release', release: false},
    ],
  }),

  /**
   * Standard release notes generator with conventional commits preset.
   */
  standardReleaseNotes: releaseNotesGenerator({
    preset: 'conventionalcommits',
    presetConfig: {
      types: [
        {type: 'feat', section: 'Features'},
        {type: 'fix', section: 'Bug Fixes'},
        {type: 'perf', section: 'Performance Improvements'},
        {type: 'revert', section: 'Reverts'},
        {type: 'docs', section: 'Documentation', hidden: true},
        {type: 'style', section: 'Styles', hidden: true},
        {type: 'chore', section: 'Miscellaneous Chores', hidden: true},
        {type: 'refactor', section: 'Code Refactoring', hidden: true},
        {type: 'test', section: 'Tests', hidden: true},
        {type: 'build', section: 'Build System', hidden: true},
        {type: 'ci', section: 'Continuous Integration', hidden: true},
      ],
    },
  }),

  /**
   * Standard changelog configuration.
   */
  standardChangelog: changelog({
    changelogFile: 'CHANGELOG.md',
    changelogTitle: '# Changelog',
  }),

  /**
   * NPM plugin configured for public package publishing.
   */
  npmPublicPackage: npm({
    npmPublish: true,
    access: 'public',
  }),

  /**
   * NPM plugin configured for private package publishing.
   */
  npmPrivatePackage: npm({
    npmPublish: true,
    access: 'restricted',
  }),

  /**
   * GitHub plugin with standard configuration.
   */
  githubStandard: github({
    successComment:
      // eslint-disable-next-line no-template-curly-in-string
      'This ${issue.pull_request ? "PR is included" : "issue has been resolved"} in version ${nextRelease.version} :tada:',

    failComment:
      // eslint-disable-next-line no-template-curly-in-string
      'This release from branch ${branch.name} had failed due to the following errors:\n- ${errors.map(err => err.message).join("\\n- ")}',
    // eslint-disable-next-line no-template-curly-in-string
    releasedLabels: ['released<%= nextRelease.channel ? `-\${nextRelease.channel}` : "" %>'],
  }),

  /**
   * Git plugin with standard commit configuration.
   */
  gitStandard: git({
    assets: ['CHANGELOG.md', 'package.json', 'package-lock.json'],
    // eslint-disable-next-line no-template-curly-in-string
    message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
  }),
} as const
