/**
 * Sample custom publish plugin for testing the plugin development toolkit.
 *
 * This plugin demonstrates how to implement a custom publisher that:
 * - Uses the typed lifecycle interfaces
 * - Implements proper publish result handling
 * - Follows plugin development patterns
 * - Can be tested with the provided testing utilities
 */

import type {
  PublishResult,
} from '../../../src/plugins/context.js'
import type {
  PublishHook,
  VerifyConditionsHook,
} from '../../../src/plugins/lifecycle.js'
import {createPrefixedLogger} from '../../../src/plugins/utilities/logger-helpers.js'

/**
 * Configuration options for the sample publish plugin.
 */
export interface SamplePublishConfig {
  /**
   * Target registry URL.
   */
  registryUrl?: string

  /**
   * Authentication token.
   */
  token?: string

  /**
   * Whether to publish as a dry run.
   */
  dryRun?: boolean

  /**
   * Custom tags to add.
   */
  tags?: string[]

  /**
   * Custom publish function.
   */
  customPublisher?: (packageInfo: {name: string, version: string}) => Promise<{url: string}>
}

/**
 * Default configuration for the sample publisher.
 */
const defaultConfig: Required<Pick<SamplePublishConfig, 'registryUrl' | 'dryRun' | 'tags'>> = {
  registryUrl: 'https://registry.npmjs.org',
  dryRun: false,
  tags: ['latest'],
}

/**
 * Verify conditions hook implementation.
 * Validates plugin configuration and environment setup.
 */
export const verifyConditions: VerifyConditionsHook<SamplePublishConfig> = async (
  pluginConfig,
  context,
) => {
  const {logger} = context
  const log = createPrefixedLogger(logger, 'sample-publisher')

  log.info('Verifying conditions...')

  // Basic configuration validation
  if (pluginConfig.registryUrl && typeof pluginConfig.registryUrl !== 'string') {
    throw new Error('registryUrl must be a string')
  }
  if (pluginConfig.token && typeof pluginConfig.token !== 'string') {
    throw new Error('token must be a string')
  }
  if (pluginConfig.dryRun !== undefined && typeof pluginConfig.dryRun !== 'boolean') {
    throw new Error('dryRun must be a boolean')
  }
  if (pluginConfig.tags && !Array.isArray(pluginConfig.tags)) {
    throw new Error('tags must be an array')
  }
  if (pluginConfig.customPublisher && typeof pluginConfig.customPublisher !== 'function') {
    throw new Error('customPublisher must be a function')
  }

  // Check for required authentication in non-dry-run mode
  if (!pluginConfig.dryRun && !pluginConfig.token && !process.env.NPM_TOKEN) {
    throw new Error('Authentication token required for publishing (set token config or NPM_TOKEN env var)')
  }

  log.info('Sample publisher conditions verified successfully')
}

/**
 * Publish hook implementation.
 * Publishes the package and returns publication information.
 */
export const publish: PublishHook<SamplePublishConfig> = async (
  pluginConfig,
  context,
): Promise<PublishResult> => {
  const {nextRelease, logger} = context
  const config = {...defaultConfig, ...pluginConfig}
  const log = createPrefixedLogger(logger, 'sample-publisher')

  log.info(`Publishing version ${nextRelease.version} to ${config.registryUrl}...`)

  if (config.dryRun) {
    log.info('Dry run mode - skipping actual publish')
    return {
      name: 'Sample Package Publication',
      url: `${config.registryUrl}/package/${nextRelease.version}`,
    }
  }

  // Use custom publisher if provided
  if (config.customPublisher) {
    try {
      const result = await config.customPublisher({
        name: 'sample-package',
        version: nextRelease.version,
      })

      log.info(`Custom publisher completed: ${result.url}`)
      return {
        name: 'Custom Sample Package Publication',
        url: result.url,
      }
    } catch (error) {
      log.error(`Custom publisher failed: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  // Simulate publishing process
  log.step('validate', 'Validating package...')
  await new Promise(resolve => setTimeout(resolve, 100)) // Simulate validation time

  log.step('upload', 'Uploading package...')
  await new Promise(resolve => setTimeout(resolve, 200)) // Simulate upload time

  log.step('register', 'Registering with registry...')
  await new Promise(resolve => setTimeout(resolve, 150)) // Simulate registration time

  const publishUrl = `${config.registryUrl}/package/${nextRelease.version}`

  log.success(`Package published successfully: ${publishUrl}`)

  return {
    name: 'Sample Package Publication',
    url: publishUrl,
  }
}

/**
 * Sample publisher plugin that can be used for testing.
 * Exports the lifecycle hooks as a plugin object.
 */
export default {
  verifyConditions,
  publish,
}
