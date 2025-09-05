/**
 * Runtime validation schemas for semantic-release configuration types.
 *
 * This module provides Zod schemas for validating configuration objects at runtime,
 * ensuring type safety and providing helpful error messages for invalid configurations.
 */

export {branchSpecSchema, globalConfigSchema, pluginSpecSchema} from './schemas/core.js'
export {
  changelogConfigSchema,
  commitAnalyzerConfigSchema,
  gitConfigSchema,
  githubConfigSchema,
  npmConfigSchema,
  releaseNotesGeneratorConfigSchema,
} from './schemas/plugins.js'
export {
  validateCompleteConfig,
  validateConfig,
  validatePluginConfig,
  ValidationError,
} from './validator.js'

// Re-export Zod types for convenience
export type {z} from 'zod'
