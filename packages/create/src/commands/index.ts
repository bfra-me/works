/**
 * Command infrastructure exports
 * Part of Phase 4: Command Interface Consolidation
 *
 * Unified exports for all command-related infrastructure including
 * shared context, prompts, validation, progress indicators, and error handling.
 */

export {
  extractProjectName,
  mergeWithDefaults,
  normalizeProjectPath,
  parsePositionalArguments,
  resolveArguments,
  resolveExistingProject,
  resolveProjectDirectory,
  resolveTemplateSource,
  validateProjectDirectory,
  type ResolvedArguments,
  type ResolvedProject,
  type ResolvedTemplateSource,
} from './argument-resolver.js'

export {
  createErrorBox,
  displayError,
  formatErrorMessage,
  getErrorSuggestions,
  getErrorTitle,
  getExitCode,
  withErrorDisplay,
  type ErrorDisplayOptions,
  type ErrorSuggestion,
} from './error-messages.js'

export {
  createProgressBar,
  createProgressIndicator,
  createSimpleSpinner,
  showCommand,
  showError,
  showFeatureSummary,
  showInfo,
  showNextSteps,
  showOperationSummary,
  showProjectSummary,
  showStep,
  showSuccess,
  showWarning,
  withProgressSpinner,
  type ProgressIndicatorOptions,
  type ProgressState,
  type ProgressStep,
} from './progress-indicators.js'

export {
  composeMiddleware,
  createCommandContext,
  createErrorResult,
  createSuccessResult,
  handleCommandError,
  normalizeCreateOptions,
  registerAddCommandOptions,
  registerCommand,
  registerCreateCommandOptions,
  registerGlobalOptions,
  validateAndTransformOptions,
  withCommandContext,
  type CommandBuilder,
  type CommandContext,
  type CommandExecutor,
} from './shared-context.js'

export {
  createSpinner,
  displayNote,
  displayOperationSummary as displayOperations,
  displayProjectAnalysis,
  handleCancellation,
  promptConfirm,
  promptConfirmOrExit,
  promptConflictResolution,
  promptFeatureSelection,
  promptPackageManager,
  promptProjectName,
  promptSelect,
  promptSelectOrExit,
  promptText,
  promptTextOrExit,
  withSpinner,
  type CancelledResult,
  type ConfirmPromptConfig,
  type MultiSelectPromptConfig,
  type SelectOption,
  type SelectPromptConfig,
  type TextPromptConfig,
} from './shared-prompts.js'

export {
  createFieldValidator,
  createValidationPipeline,
  validateAddOptions,
  validateCreateOptions,
  validateOptions,
  type ValidationError,
  type ValidationResult,
} from './validation-pipeline.js'
