/**
 * Utility modules for @bfra.me/create.
 *
 * This barrel file provides explicit named exports for better tree-shaking
 * and clearer dependencies. Import from specific files when possible for
 * optimal build performance.
 */

// Command options (command-options.ts)
export {
  AddCommandOptionDefinitions,
  applyConfigurationPreset,
  CommonOptions,
  ConfigurationPresets,
  CreateCommandOptionDefinitions,
  mergeCommandOptions,
  parseFeatures,
  validateCreateCommandOptions,
  validateFeatureName,
  type BaseCommandOptionDefinitions,
  type ConfigPreset,
} from './command-options.js'

// Constants (constants.ts)
export {
  BUILTIN_NODE_MODULES,
  isBuiltinModule,
  isReservedName,
  RESERVED_PACKAGE_NAMES,
  type ReservedPackageName,
} from './constants.js'

// Error handling (errors.ts)
export {
  aiAnalysisFailedError,
  aiApiKeyInvalidError,
  aiApiKeyMissingError,
  AIErrorCode,
  aiProviderUnavailableError,
  aiRateLimitError,
  aiRequestFailedError,
  aiResponseInvalidError,
  aiTimeoutError,
  CLIErrorCode,
  commandFailedError,
  createAIError,
  createCLIError,
  createProjectError,
  createTemplateError,
  directoryExistsError,
  directoryNotEmptyError,
  fileSystemError,
  formatError,
  getUserFriendlyMessage,
  hasErrorCode,
  invalidInputError,
  invalidPathError,
  invalidProjectNameError,
  isBaseError,
  packageJsonInvalidError,
  packageJsonNotFoundError,
  packageManagerNotDetectedError,
  pathTraversalAttemptError,
  permissionDeniedError,
  projectDetectionFailedError,
  ProjectErrorCode,
  templateCacheError,
  TemplateErrorCode,
  templateFetchFailedError,
  templateInvalidError,
  templateMetadataInvalidError,
  templateNotFoundError,
  templateParseError,
  templateRenderError,
  templateVariableMissingError,
  validationFailedError,
} from './errors.js'
export type {ErrorCode, ErrorContext} from './errors.js'

// File system utilities (file-system.ts)
export {
  exists,
  getBasename,
  getDirname,
  getExtension,
  getRelativePath,
  isAbsolute,
  isDirectory,
  isFile,
  joinPaths,
  normalizePath,
  resolvePath,
  toUnixPath,
} from './file-system.js'

// Help system (help.ts)
export {helpSystem, HelpSystem, showErrorHelp, type CommandHelp, type HelpTopic} from './help.js'

// Logging (logger.ts)
export {
  createLogger,
  createProgressReporter,
  createSpinner,
  displayInfoBox,
  displaySuccessBox,
  displayWarningBox,
  logDebug,
  logError,
  logInfo,
  logSuccess,
  logValidationErrors,
  logValidationWarnings,
  logWarning,
  type LoggerOptions,
  type ProgressContext,
} from './logger.js'

// Progress tracking (progress.ts)
export {
  estimateOperationTime,
  FeatureProgress,
  ProgressTracker,
  showProgress,
  TemplateProgress,
  type ProgressOptions,
  type ProgressStep,
} from './progress.js'

// Project detection (project-detection.ts)
export {
  analyzeProject,
  getMissingConfigurations,
  isNodeProject,
  isReactProject,
  isTypeScriptProject,
} from './project-detection.js'

// Type guards (type-guards.ts)
export {
  createPackageName,
  createProjectPath,
  createTemplateSource,
  isPackageManager,
  isPackageName,
  isProjectPath,
  isProjectType,
  isTemplateMetadata,
  isTemplateSource,
  isTemplateSourceObject,
  isTemplateVariable,
} from './type-guards.js'

// Validation factory (validation-factory.ts)
export {
  createTemplateValidator,
  validateEmailAddress,
  validatePackageManager,
  validateProjectName,
  validateProjectPath,
  validateSemver,
  validateTemplateId,
  validateTemplateVariableValue,
  type ProjectNameValidationOptions,
} from './validation-factory.js'

// Legacy validation (validation.ts)
export {ValidationUtils} from './validation.js'
