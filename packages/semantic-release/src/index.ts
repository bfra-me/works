export * from './composition/index.js'
export * from './config.js'
export * from './config/discovery.js'
export * from './config/environment.js'
export * from './config/helpers.js'
export * from './config/presets.js'
export {
  checkPresetCompatibility,
  createVersionManager,
  defaultVersionManager,
  getCurrentPresetVersion,
  getPresetVersions,
  migratePresetConfig,
  PresetVersionManager,
  type MigrationResult,
  type CompatibilityIssue as PresetCompatibilityIssue,
  type CompatibilityResult as PresetCompatibilityResult,
  type PresetMigration,
  type PresetRegistry,
  type PresetVersion,
} from './config/versioning.js'
export * from './plugins/index.js'
export type * from './types.js'
// Export validation functions with explicit names to avoid conflicts
export {
  branchSpecSchema,
  changelogConfigSchema,
  commitAnalyzerConfigSchema,
  gitConfigSchema,
  githubConfigSchema,
  globalConfigSchema,
  npmConfigSchema,
  pluginSpecSchema,
  releaseNotesGeneratorConfigSchema,
  validateCompleteConfig,
  validateConfig,
  validatePluginConfig as validatePluginConfigRuntime,
  ValidationError,
  type z,
} from './validation/index.js'
