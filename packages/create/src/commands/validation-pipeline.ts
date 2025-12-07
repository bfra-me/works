/**
 * Unified validation pipeline for command inputs
 * Part of Phase 4: Command Interface Consolidation (TASK-030)
 *
 * Establishes a unified validation pipeline for all command inputs
 * using Phase 1 validators with consistent error handling.
 */

import type {Result} from '@bfra.me/es/result'
import type {AddCommandOptions, CreateCommandOptions} from '../types.js'
import {err, ok} from '@bfra.me/es/result'
import {CLIErrorCode, createCLIError} from '../utils/errors.js'
import {
  validatePackageManager,
  validateProjectName,
  validateProjectPath,
  validateSemver,
  validateTemplateId,
} from '../utils/validation-factory.js'

/**
 * Validation result with accumulated errors
 */
export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors: ValidationError[]
  warnings: string[]
}

/**
 * Individual validation error
 */
export interface ValidationError {
  field: string
  message: string
  code: string
}

/**
 * Validation context for accumulating results
 */
interface ValidationContext<T> {
  data: T
  errors: ValidationError[]
  warnings: string[]
}

/**
 * Creates a new validation context
 */
function createContext<T>(data: T): ValidationContext<T> {
  return {
    data,
    errors: [],
    warnings: [],
  }
}

/**
 * Adds an error to the validation context
 */
function addError<T>(
  context: ValidationContext<T>,
  field: string,
  message: string,
  code: string,
): ValidationContext<T> {
  context.errors.push({field, message, code})
  return context
}

/**
 * Adds a warning to the validation context
 */
function addWarning<T>(context: ValidationContext<T>, message: string): ValidationContext<T> {
  context.warnings.push(message)
  return context
}

/**
 * Validates project name if provided
 */
function validateProjectNameField<T extends {name?: string}>(
  context: ValidationContext<T>,
): ValidationContext<T> {
  const {name} = context.data

  if (name == null || name.trim().length === 0) {
    return context
  }

  const result = validateProjectName(name)
  if (!result.success) {
    return addError(context, 'name', result.error.message, CLIErrorCode.INVALID_PROJECT_NAME)
  }

  return context
}

/**
 * Validates output directory if provided
 */
function validateOutputDirField<T extends {outputDir?: string}>(
  context: ValidationContext<T>,
): ValidationContext<T> {
  const {outputDir} = context.data

  if (outputDir == null || outputDir.trim().length === 0) {
    return context
  }

  const result = validateProjectPath(outputDir)
  if (!result.success) {
    return addError(context, 'outputDir', result.error.message, CLIErrorCode.INVALID_PATH)
  }

  return context
}

/**
 * Validates template if provided
 */
function validateTemplateField<T extends {template?: string}>(
  context: ValidationContext<T>,
): ValidationContext<T> {
  const {template} = context.data

  if (template == null || template.trim().length === 0) {
    return context
  }

  const result = validateTemplateId(template)
  if (!result.success) {
    return addError(context, 'template', result.error.message, CLIErrorCode.INVALID_INPUT)
  }

  return context
}

/**
 * Validates package manager if provided
 */
function validatePackageManagerField<T extends {packageManager?: string}>(
  context: ValidationContext<T>,
): ValidationContext<T> {
  const {packageManager} = context.data

  if (packageManager == null) {
    return context
  }

  const result = validatePackageManager(packageManager)
  if (!result.success) {
    return addError(context, 'packageManager', result.error.message, CLIErrorCode.INVALID_INPUT)
  }

  return context
}

/**
 * Validates version if provided
 */
function validateVersionField<T extends {version?: string}>(
  context: ValidationContext<T>,
): ValidationContext<T> {
  const {version} = context.data

  if (version == null || version.trim().length === 0) {
    return context
  }

  const result = validateSemver(version)
  if (!result.success) {
    return addError(context, 'version', result.error.message, CLIErrorCode.INVALID_INPUT)
  }

  return context
}

/**
 * Validates preset if provided
 */
function validatePresetField<T extends {preset?: string}>(
  context: ValidationContext<T>,
): ValidationContext<T> {
  const {preset} = context.data

  if (preset == null) {
    return context
  }

  const validPresets = ['minimal', 'standard', 'full']
  if (!validPresets.includes(preset)) {
    return addError(
      context,
      'preset',
      `Invalid preset: ${preset}. Must be one of: ${validPresets.join(', ')}`,
      CLIErrorCode.INVALID_INPUT,
    )
  }

  return context
}

/**
 * Validates AI options consistency
 */
function validateAIOptionsField<T extends {ai?: boolean; describe?: string}>(
  context: ValidationContext<T>,
): ValidationContext<T> {
  const {ai, describe} = context.data

  if (ai && (describe == null || describe.trim().length === 0)) {
    return addWarning(
      context,
      'AI features work best with a project description. Consider using --describe to provide one.',
    )
  }

  return context
}

/**
 * Validates feature name for add command
 */
function validateFeatureField<T extends {feature?: string}>(
  context: ValidationContext<T>,
): ValidationContext<T> {
  const {feature} = context.data

  if (feature == null || feature.trim().length === 0) {
    return context
  }

  if (!/^[a-z\d-]+$/.test(feature.trim())) {
    return addError(
      context,
      'feature',
      'Feature name must contain only lowercase letters, numbers, and hyphens',
      CLIErrorCode.INVALID_INPUT,
    )
  }

  return context
}

/**
 * Converts validation context to result
 */
function toResult<T>(context: ValidationContext<T>): ValidationResult<T> {
  return {
    success: context.errors.length === 0,
    data: context.errors.length === 0 ? context.data : undefined,
    errors: context.errors,
    warnings: context.warnings,
  }
}

/**
 * Chains multiple validators together
 */
function chainValidators<T>(
  context: ValidationContext<T>,
  validators: ((ctx: ValidationContext<T>) => ValidationContext<T>)[],
): ValidationContext<T> {
  return validators.reduce((ctx, validator) => validator(ctx), context)
}

/**
 * Validates create command options
 */
export function validateCreateOptions(
  options: CreateCommandOptions,
): ValidationResult<CreateCommandOptions> {
  const context = createContext(options)

  const validated = chainValidators(context, [
    validateProjectNameField,
    validateOutputDirField,
    validateTemplateField,
    validatePackageManagerField,
    validateVersionField,
    validatePresetField,
    validateAIOptionsField,
  ])

  return toResult(validated)
}

/**
 * Validates add command options
 */
export function validateAddOptions(
  options: AddCommandOptions,
): ValidationResult<AddCommandOptions> {
  const context = createContext(options)

  const validated = chainValidators(context, [validateFeatureField])

  return toResult(validated)
}

/**
 * Validates any command options and returns a Result
 */
export function validateOptions<T extends CreateCommandOptions | AddCommandOptions>(
  options: T,
): Result<T, Error> {
  const isAddCommand = Object.prototype.hasOwnProperty.call(options, 'feature')

  const validationResult = isAddCommand
    ? validateAddOptions(options as unknown as AddCommandOptions)
    : validateCreateOptions(options as unknown as CreateCommandOptions)

  if (!validationResult.success) {
    const errorMessages = validationResult.errors.map(e => `${e.field}: ${e.message}`).join('; ')
    return err(createCLIError(errorMessages, CLIErrorCode.VALIDATION_FAILED))
  }

  return ok(validationResult.data as T)
}

/**
 * Creates a validation pipeline for custom validation rules
 */
export function createValidationPipeline<T>(
  ...validators: ((context: ValidationContext<T>) => ValidationContext<T>)[]
): (data: T) => ValidationResult<T> {
  return (data: T): ValidationResult<T> => {
    let context = createContext(data)

    for (const validator of validators) {
      context = validator(context)
    }

    return toResult(context)
  }
}

/**
 * Creates a field validator for custom validation
 */
export function createFieldValidator<T, K extends keyof T>(
  field: K,
  validate: (value: T[K]) => Result<T[K], Error>,
): (context: ValidationContext<T>) => ValidationContext<T> {
  return (context: ValidationContext<T>): ValidationContext<T> => {
    const value = context.data[field]

    if (value == null) {
      return context
    }

    const result = validate(value)
    if (!result.success) {
      return addError(context, String(field), result.error.message, CLIErrorCode.VALIDATION_FAILED)
    }

    return context
  }
}
