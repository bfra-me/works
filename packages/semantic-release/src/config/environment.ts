/**
 * Environment-specific configuration utilities for semantic-release.
 *
 * This module provides comprehensive environment detection and configuration
 * transformation utilities to support different deployment environments
 * (development, staging, production, test) with appropriate defaults and
 * optimizations for each context.
 */

import type {GlobalConfig} from '../types/core.js'
import process from 'node:process'

/**
 * Supported environment types for semantic-release configurations.
 */
export type Environment = 'development' | 'staging' | 'production' | 'test'

/**
 * Environment detection result with metadata.
 */
export interface EnvironmentContext {
  /**
   * The detected or explicitly set environment.
   */
  environment: Environment
  /**
   * Whether the environment was auto-detected or explicitly set.
   */
  autoDetected: boolean
  /**
   * Source of the environment detection (e.g., 'NODE_ENV', 'CI', 'explicit').
   */
  source: string
  /**
   * Whether we're running in a CI environment.
   */
  isCI: boolean
  /**
   * Additional metadata about the detected environment.
   */
  metadata: {
    nodeEnv?: string
    ciVendor?: string
    branchName?: string
  }
}

/**
 * Environment-specific configuration transformations.
 */
export interface EnvironmentTransformations {
  /**
   * Branch configuration modifications.
   */
  branches?: string[] | undefined
  /**
   * CI mode configuration.
   */
  ci?: boolean
  /**
   * Dry-run mode configuration.
   */
  dryRun?: boolean
  /**
   * Debug mode configuration.
   */
  debug?: boolean
  /**
   * Repository URL modifications.
   */
  repositoryUrl?: string
  /**
   * Tag format modifications.
   */
  tagFormat?: string
  /**
   * Plugin configuration transformations.
   */
  plugins?: (string | [string, any])[]
}

/**
 * Detect the current environment based on various indicators.
 *
 * @param explicitEnv - Explicitly specified environment (overrides detection)
 * @returns Environment context with detection metadata
 */
export function detectEnvironment(explicitEnv?: Environment): EnvironmentContext {
  if (explicitEnv) {
    return {
      environment: explicitEnv,
      autoDetected: false,
      source: 'explicit',
      isCI: detectCI(),
      metadata: {
        nodeEnv: process.env.NODE_ENV,
        ciVendor: detectCIVendor(),
        branchName: detectBranchName(),
      },
    }
  }

  // Check NODE_ENV first (for explicit environment settings)
  const nodeEnv = process.env.NODE_ENV?.toLowerCase()
  if (nodeEnv != null && ['development', 'staging', 'production'].includes(nodeEnv)) {
    return {
      environment: nodeEnv as Environment,
      autoDetected: true,
      source: 'NODE_ENV',
      isCI: detectCI(),
      metadata: {
        nodeEnv: process.env.NODE_ENV,
        ciVendor: detectCIVendor(),
        branchName: detectBranchName(),
      },
    }
  }

  // Check for CI branch-based detection (for staging detection in CI)
  const ciVendor = detectCIVendor()
  if (process.env.CI === 'true' && ciVendor != null) {
    const branchName = detectBranchName()
    if (branchName?.includes('staging') || branchName?.includes('stage')) {
      return {
        environment: 'staging',
        autoDetected: true,
        source: 'CI_BRANCH',
        isCI: true,
        metadata: {
          nodeEnv: process.env.NODE_ENV,
          ciVendor: detectCIVendor(),
          branchName,
        },
      }
    }
  }

  // Check for test indicators
  const hasExplicitTestIndicators =
    process.argv.includes('--test') ||
    process.env.npm_lifecycle_event === 'test' ||
    (process.env.JEST_WORKER_ID !== undefined && process.env.JEST_WORKER_ID !== '')

  const hasVitestIndicator = process.env.VITEST === 'true'

  if (nodeEnv === 'test' || hasExplicitTestIndicators || hasVitestIndicator) {
    return {
      environment: 'test',
      autoDetected: true,
      source: hasExplicitTestIndicators || hasVitestIndicator ? 'TEST_INDICATORS' : 'NODE_ENV',
      isCI: detectCI(),
      metadata: {
        nodeEnv: process.env.NODE_ENV,
        ciVendor: detectCIVendor(),
        branchName: detectBranchName(),
      },
    }
  }

  // Default to production
  return {
    environment: 'production',
    autoDetected: true,
    source: 'DEFAULT',
    isCI: detectCI(),
    metadata: {
      nodeEnv: process.env.NODE_ENV,
      ciVendor: detectCIVendor(),
      branchName: detectBranchName(),
    },
  }
}

/**
 * Get environment-specific configuration transformations.
 *
 * @param environment - Target environment
 * @param context - Environment context with detection metadata
 * @returns Configuration transformations for the environment
 */
export function getEnvironmentTransformations(
  environment: Environment,
  context: EnvironmentContext,
): EnvironmentTransformations {
  switch (environment) {
    case 'development': {
      return {
        // Enable dry-run mode for safety in development
        dryRun: true,
        // Enable debug mode for better development experience
        debug: true,
        // Use local branches for development
        branches: ['main', 'master', 'develop', 'development'],
        // Disable CI mode if not explicitly in CI
        ci: context.isCI,
        // Use development tag format for clarity
        // eslint-disable-next-line no-template-curly-in-string
        tagFormat: 'v${version}-dev',
      }
    }

    case 'test': {
      return {
        // Always enable dry-run in test environments
        dryRun: true,
        // Enable CI mode for consistent test behavior
        ci: true,
        // Enable debug for test troubleshooting
        debug: true,
        // Use test-specific branches
        branches: ['main', 'master'],
        // Use test tag format
        // eslint-disable-next-line no-template-curly-in-string
        tagFormat: 'v${version}-test',
      }
    }

    case 'staging': {
      return {
        // Allow actual releases in staging but with staging tag
        dryRun: false,
        // Enable CI mode for staging
        ci: true,
        // Enable debug for staging troubleshooting
        debug: true,
        // Use staging-specific branches
        branches: ['staging', 'stage', 'main'],
        // Use staging tag format
        // eslint-disable-next-line no-template-curly-in-string
        tagFormat: 'v${version}-staging',
      }
    }

    case 'production': {
      return {
        // Production releases are real
        dryRun: false,
        // Disable debug in production for clean output
        debug: false,
        // Enable CI mode in production
        ci: context.isCI,
        // Use production branches
        branches: ['main', 'master'],
        // Use standard production tag format
        // eslint-disable-next-line no-template-curly-in-string
        tagFormat: 'v${version}',
      }
    }

    default: {
      // Fallback to production-like settings
      return {
        dryRun: false,
        debug: false,
        ci: context.isCI,
        branches: ['main', 'master'],
        // eslint-disable-next-line no-template-curly-in-string
        tagFormat: 'v${version}',
      }
    }
  }
}

/**
 * Apply environment-specific transformations to a configuration.
 *
 * @param config - Base configuration to transform
 * @param environment - Target environment
 * @param context - Environment context with detection metadata
 * @returns Transformed configuration
 */
export function applyEnvironmentTransformations(
  config: GlobalConfig,
  environment: Environment,
  context: EnvironmentContext,
): GlobalConfig {
  const transformations = getEnvironmentTransformations(environment, context)
  const processedConfig: GlobalConfig = {...config}

  // Apply transformations with priority to existing explicit config
  if (transformations.branches != null && processedConfig.branches === undefined) {
    processedConfig.branches = transformations.branches
  }

  if (transformations.ci !== undefined && processedConfig.ci === undefined) {
    processedConfig.ci = transformations.ci
  }

  if (transformations.dryRun !== undefined && processedConfig.dryRun === undefined) {
    processedConfig.dryRun = transformations.dryRun
  }

  if (transformations.debug !== undefined && processedConfig.debug === undefined) {
    processedConfig.debug = transformations.debug
  }

  if (transformations.tagFormat != null && processedConfig.tagFormat === undefined) {
    processedConfig.tagFormat = transformations.tagFormat
  }

  if (transformations.repositoryUrl != null && processedConfig.repositoryUrl === undefined) {
    processedConfig.repositoryUrl = transformations.repositoryUrl
  }

  return processedConfig
}

/**
 * Utility function to detect if running in CI environment.
 */
function detectCI(): boolean {
  return (
    process.env.CI === 'true' ||
    process.env.CONTINUOUS_INTEGRATION === 'true' ||
    (process.env.GITHUB_ACTIONS != null && process.env.GITHUB_ACTIONS !== '') ||
    (process.env.GITLAB_CI != null && process.env.GITLAB_CI !== '') ||
    (process.env.CIRCLECI != null && process.env.CIRCLECI !== '') ||
    (process.env.TRAVIS != null && process.env.TRAVIS !== '') ||
    (process.env.BUILDKITE != null && process.env.BUILDKITE !== '') ||
    (process.env.JENKINS_URL != null && process.env.JENKINS_URL !== '')
  )
}

/**
 * Utility function to detect CI vendor.
 */
function detectCIVendor(): string | undefined {
  if (process.env.GITHUB_ACTIONS != null && process.env.GITHUB_ACTIONS !== '')
    return 'github-actions'
  if (process.env.GITLAB_CI != null && process.env.GITLAB_CI !== '') return 'gitlab-ci'
  if (process.env.CIRCLECI != null && process.env.CIRCLECI !== '') return 'circleci'
  if (process.env.TRAVIS != null && process.env.TRAVIS !== '') return 'travis'
  if (process.env.BUILDKITE != null && process.env.BUILDKITE !== '') return 'buildkite'
  if (process.env.JENKINS_URL != null && process.env.JENKINS_URL !== '') return 'jenkins'
  return undefined
}

/**
 * Utility function to detect current branch name.
 */
function detectBranchName(): string | undefined {
  const envVars = [
    process.env.GITHUB_REF_NAME,
    process.env.CI_COMMIT_REF_NAME,
    process.env.CIRCLE_BRANCH,
    process.env.TRAVIS_BRANCH,
    process.env.BUILDKITE_BRANCH,
    process.env.GIT_BRANCH,
  ]

  for (const envVar of envVars) {
    if (envVar != null && envVar !== '') {
      return envVar
    }
  }

  return undefined
}

/**
 * Create environment-specific configuration presets.
 */
export const environmentPresets = {
  /**
   * Development environment preset with safe defaults.
   */
  development: {
    branches: ['main', 'master', 'develop', 'development'],
    dryRun: true,
    debug: true,
    ci: false,
    // eslint-disable-next-line no-template-curly-in-string
    tagFormat: 'v${version}-dev',
  },

  /**
   * Test environment preset optimized for testing.
   */
  test: {
    branches: ['main', 'master'],
    dryRun: true,
    debug: true,
    ci: true,
    // eslint-disable-next-line no-template-curly-in-string
    tagFormat: 'v${version}-test',
  },

  /**
   * Staging environment preset for pre-production testing.
   */
  staging: {
    branches: ['staging', 'stage', 'main'],
    dryRun: false,
    debug: true,
    ci: true,
    // eslint-disable-next-line no-template-curly-in-string
    tagFormat: 'v${version}-staging',
  },

  /**
   * Production environment preset for production releases.
   */
  production: {
    branches: ['main', 'master'],
    dryRun: false,
    debug: false,
    ci: true,
    // eslint-disable-next-line no-template-curly-in-string
    tagFormat: 'v${version}',
  },
} as const
