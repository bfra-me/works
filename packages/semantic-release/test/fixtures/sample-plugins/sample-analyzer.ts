/**
 * Sample custom commit analyzer plugin for testing the plugin development toolkit.
 *
 * This plugin demonstrates how to implement a custom analyzer that:
 * - Uses the typed lifecycle interfaces
 * - Implements proper error handling
 * - Follows plugin development patterns
 * - Can be tested with the provided testing utilities
 */

import type {
  AnalyzeCommitsResult,
} from '../../../src/plugins/context.js'
import type {
  AnalyzeCommitsHook,
  VerifyConditionsHook,
} from '../../../src/plugins/lifecycle.js'
import {createPrefixedLogger} from '../../../src/plugins/utilities/logger-helpers.js'

/**
 * Configuration options for the sample analyzer plugin.
 */
export interface SampleAnalyzerConfig {
  /**
   * Keywords that trigger major releases.
   */
  majorKeywords?: string[]

  /**
   * Keywords that trigger minor releases.
   */
  minorKeywords?: string[]

  /**
   * Keywords that trigger patch releases.
   */
  patchKeywords?: string[]

  /**
   * Whether to enable verbose logging.
   */
  verbose?: boolean

  /**
   * Custom analysis function.
   */
  customAnalyzer?: (commits: ReadonlyArray<{message: string}>) => string | null
}

/**
 * Default configuration for the sample analyzer.
 */
const defaultConfig: Required<Pick<SampleAnalyzerConfig, 'majorKeywords' | 'minorKeywords' | 'patchKeywords' | 'verbose'>> = {
  majorKeywords: ['BREAKING CHANGE', 'BREAKING', 'breaking:'],
  minorKeywords: ['feat:', 'feature:'],
  patchKeywords: ['fix:', 'bugfix:', 'patch:'],
  verbose: false,
}

/**
 * Verify conditions hook implementation.
 * Validates plugin configuration and environment setup.
 */
export const verifyConditions: VerifyConditionsHook<SampleAnalyzerConfig> = async (
  pluginConfig,
  context,
) => {
  const {logger} = context
  const log = createPrefixedLogger(logger, 'sample-analyzer')

  log.info('Verifying conditions...')

  // Basic configuration validation
  if (pluginConfig.majorKeywords && !Array.isArray(pluginConfig.majorKeywords)) {
    throw new Error('majorKeywords must be an array')
  }
  if (pluginConfig.minorKeywords && !Array.isArray(pluginConfig.minorKeywords)) {
    throw new Error('minorKeywords must be an array')
  }
  if (pluginConfig.patchKeywords && !Array.isArray(pluginConfig.patchKeywords)) {
    throw new Error('patchKeywords must be an array')
  }
  if (pluginConfig.verbose !== undefined && typeof pluginConfig.verbose !== 'boolean') {
    throw new Error('verbose must be a boolean')
  }
  if (pluginConfig.customAnalyzer && typeof pluginConfig.customAnalyzer !== 'function') {
    throw new Error('customAnalyzer must be a function')
  }

  if (pluginConfig.verbose) {
    log.info('Sample analyzer plugin configured with verbose mode')
  }

  log.info('Sample analyzer conditions verified successfully')
}

/**
 * Analyze commits hook implementation.
 * Determines the release type based on commit messages.
 */
export const analyzeCommits: AnalyzeCommitsHook<SampleAnalyzerConfig> = async (
  pluginConfig,
  context,
): Promise<AnalyzeCommitsResult> => {
  const {commits, logger} = context
  const config = {...defaultConfig, ...pluginConfig}
  const log = createPrefixedLogger(logger, 'sample-analyzer')

  log.info(`Analyzing ${commits.length} commits...`)

  // Use custom analyzer if provided
  if (config.customAnalyzer) {
    const result = config.customAnalyzer(commits)
    if (result) {
      log.info(`Custom analyzer determined release type: ${result}`)
      return result as AnalyzeCommitsResult
    }
  }

  // Check for breaking changes (major release)
  for (const commit of commits) {
    if (config.majorKeywords.some((keyword: string) =>
      commit.message.includes(keyword)
    )) {
      if (config.verbose) {
        log.info(`Found major release trigger in commit: ${commit.hash}`)
      }
      return 'major'
    }
  }

  // Check for features (minor release)
  for (const commit of commits) {
    if (config.minorKeywords.some((keyword: string) =>
      commit.message.includes(keyword)
    )) {
      if (config.verbose) {
        log.info(`Found minor release trigger in commit: ${commit.hash}`)
      }
      return 'minor'
    }
  }

  // Check for fixes (patch release)
  for (const commit of commits) {
    if (config.patchKeywords.some((keyword: string) =>
      commit.message.includes(keyword)
    )) {
      if (config.verbose) {
        log.info(`Found patch release trigger in commit: ${commit.hash}`)
      }
      return 'patch'
    }
  }

  // No release needed
  log.info('No release type determined from commits')
  return null
}

/**
 * Sample analyzer plugin that can be used for testing.
 * Exports the lifecycle hooks as a plugin object.
 */
export default {
  verifyConditions,
  analyzeCommits,
}
