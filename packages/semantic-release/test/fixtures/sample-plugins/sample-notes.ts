/**
 * Sample custom generate notes plugin for testing the plugin development toolkit.
 *
 * This plugin demonstrates how to implement a custom notes generator that:
 * - Uses the typed lifecycle interfaces
 * - Implements proper notes generation
 * - Follows plugin development patterns
 * - Can be tested with the provided testing utilities
 */

import type {
  GenerateNotesResult,
} from '../../../src/plugins/context.js'
import type {
  GenerateNotesHook,
  VerifyConditionsHook,
} from '../../../src/plugins/lifecycle.js'
import {createPrefixedLogger} from '../../../src/plugins/utilities/logger-helpers.js'

/**
 * Configuration options for the sample notes generator plugin.
 */
export interface SampleNotesConfig {
  /**
   * Template for release notes.
   */
  template?: string

  /**
   * Whether to include commit details.
   */
  includeCommitDetails?: boolean

  /**
   * Custom formatting function.
   */
  customFormatter?: (data: {version: string, commits: ReadonlyArray<{message: string, hash: string}>}) => string
}

/**
 * Default configuration for the sample notes generator.
 */
const defaultConfig: Required<Pick<SampleNotesConfig, 'template' | 'includeCommitDetails'>> = {
  template: '# Release Notes\n\n## What\'s Changed\n\n{commits}\n\n**Full Changelog**: {compareUrl}',
  includeCommitDetails: true,
}

/**
 * Verify conditions hook implementation.
 * Validates plugin configuration and environment setup.
 */
export const verifyConditions: VerifyConditionsHook<SampleNotesConfig> = async (
  pluginConfig,
  context,
) => {
  const {logger} = context
  const log = createPrefixedLogger(logger, 'sample-notes')

  log.info('Verifying conditions...')

  // Basic configuration validation
  if (pluginConfig.template && typeof pluginConfig.template !== 'string') {
    throw new Error('template must be a string')
  }
  if (pluginConfig.includeCommitDetails !== undefined && typeof pluginConfig.includeCommitDetails !== 'boolean') {
    throw new Error('includeCommitDetails must be a boolean')
  }
  if (pluginConfig.customFormatter && typeof pluginConfig.customFormatter !== 'function') {
    throw new Error('customFormatter must be a function')
  }

  log.info('Sample notes generator conditions verified successfully')
}

/**
 * Generate notes hook implementation.
 * Generates release notes based on commits and configuration.
 */
export const generateNotes: GenerateNotesHook<SampleNotesConfig> = async (
  pluginConfig,
  context,
): Promise<GenerateNotesResult> => {
  const {commits, nextRelease, lastRelease, logger, options} = context
  const config = {...defaultConfig, ...pluginConfig}
  const log = createPrefixedLogger(logger, 'sample-notes')

  log.info(`Generating notes for version ${nextRelease.version}...`)

  // Use custom formatter if provided
  if (config.customFormatter) {
    try {
      const result = config.customFormatter({
        version: nextRelease.version,
        commits,
      })

      log.info('Custom formatter completed')
      return result
    } catch (error) {
      log.error(`Custom formatter failed: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  // Generate commit list
  let commitList = ''
  if (config.includeCommitDetails && commits.length > 0) {
    commitList = commits
      .map(commit => {
        const shortHash = commit.hash.substring(0, 7)
        const firstLine = commit.message.split('\n')[0]
        return `- ${firstLine} (${shortHash})`
      })
      .join('\n')
  } else if (commits.length > 0) {
    commitList = `${commits.length} commits included in this release`
  } else {
    commitList = 'No commits in this release'
  }

  // Build compare URL
  const compareUrl = lastRelease?.gitTag && options.repositoryUrl
    ? `${options.repositoryUrl}/compare/${lastRelease.gitTag}...${nextRelease.gitTag}`
    : 'Compare URL not available'

  // Generate notes from template
  const notes = config.template
    .replace('{commits}', commitList)
    .replace('{compareUrl}', compareUrl)
    .replace('{version}', nextRelease.version)

  log.info(`Generated ${notes.split('\n').length} lines of release notes`)

  return notes
}

/**
 * Sample notes generator plugin that can be used for testing.
 * Exports the lifecycle hooks as a plugin object.
 */
export default {
  verifyConditions,
  generateNotes,
}
