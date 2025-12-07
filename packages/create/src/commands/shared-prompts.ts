/**
 * Shared prompt patterns for consistent user interactions
 * Part of Phase 4: Command Interface Consolidation (TASK-029)
 *
 * Provides reusable prompt utilities and patterns across create and add commands
 * using @clack/prompts for consistent CLI interactions.
 */

import type {Result} from '@bfra.me/es/result'
import type {Option} from '@clack/prompts'
import type {ProjectInfo} from '../types.js'
import process from 'node:process'
import {err, ok} from '@bfra.me/es/result'
import {cancel, confirm, isCancel, note, select, spinner, text} from '@clack/prompts'
import {CLIErrorCode, createCLIError} from '../utils/errors.js'

/**
 * Base prompt result indicating user cancelled
 */
export interface CancelledResult {
  cancelled: true
}

/**
 * Prompt configuration for text input
 */
export interface TextPromptConfig {
  message: string
  placeholder?: string
  defaultValue?: string
  validate?: (value: string) => string | undefined
  required?: boolean
}

/**
 * Prompt configuration for select input
 */
export interface SelectPromptConfig<T extends string> {
  message: string
  options: Option<T>[]
  initialValue?: T
}

/**
 * Select option definition
 */
export interface SelectOption<T extends string> {
  value: T
  label?: string
  hint?: string
}

/**
 * Prompt configuration for confirmation
 */
export interface ConfirmPromptConfig {
  message: string
  initialValue?: boolean
}

/**
 * Prompt configuration for multi-select
 */
export interface MultiSelectPromptConfig<T extends string> {
  message: string
  options: Option<T>[]
  required?: boolean
}

/**
 * Displays a cancellation message and exits the process
 */
export function handleCancellation(message = 'Operation cancelled'): never {
  cancel(message)
  process.exit(0)
}

/**
 * Prompts for text input with consistent error handling
 */
export async function promptText(config: TextPromptConfig): Promise<Result<string, Error>> {
  const {message, placeholder, defaultValue, validate, required = false} = config

  const result = await text({
    message,
    placeholder,
    defaultValue,
    validate: value => {
      if (required && (value == null || value.trim().length === 0)) {
        return 'This field is required'
      }
      return validate?.(value)
    },
  })

  if (isCancel(result)) {
    return err(createCLIError('User cancelled input', CLIErrorCode.COMMAND_FAILED))
  }

  return ok(result.trim())
}

/**
 * Prompts for text input, exiting on cancel
 */
export async function promptTextOrExit(config: TextPromptConfig): Promise<string> {
  const result = await text({
    message: config.message,
    placeholder: config.placeholder,
    defaultValue: config.defaultValue,
    validate: value => {
      if (config.required && (value == null || value.trim().length === 0)) {
        return 'This field is required'
      }
      return config.validate?.(value)
    },
  })

  if (isCancel(result)) {
    handleCancellation()
  }

  return result.trim()
}

/**
 * Prompts for selection from options with consistent error handling
 */
export async function promptSelect<T extends string>(
  config: SelectPromptConfig<T>,
): Promise<Result<T, Error>> {
  const {message, options, initialValue} = config

  const result = await select<T>({
    message,
    options,
    initialValue,
  })

  if (isCancel(result)) {
    return err(createCLIError('User cancelled selection', CLIErrorCode.COMMAND_FAILED))
  }

  return ok(result)
}

/**
 * Prompts for selection, exiting on cancel
 */
export async function promptSelectOrExit<T extends string>(
  config: SelectPromptConfig<T>,
): Promise<T> {
  const result = await select<T>({
    message: config.message,
    options: config.options,
    initialValue: config.initialValue,
  })

  if (isCancel(result)) {
    handleCancellation()
  }

  return result
}

/**
 * Prompts for confirmation with consistent error handling
 */
export async function promptConfirm(config: ConfirmPromptConfig): Promise<Result<boolean, Error>> {
  const {message, initialValue = true} = config

  const result = await confirm({
    message,
    initialValue,
  })

  if (isCancel(result)) {
    return err(createCLIError('User cancelled confirmation', CLIErrorCode.COMMAND_FAILED))
  }

  return ok(result)
}

/**
 * Prompts for confirmation, exiting on cancel
 */
export async function promptConfirmOrExit(config: ConfirmPromptConfig): Promise<boolean> {
  const result = await confirm({
    message: config.message,
    initialValue: config.initialValue ?? true,
  })

  if (isCancel(result)) {
    handleCancellation()
  }

  return result
}

/**
 * Displays a note with consistent styling
 */
export function displayNote(message: string, title?: string): void {
  note(message, title)
}

/**
 * Creates a spinner for async operations
 */
export function createSpinner(): {
  start: (message: string) => void
  stop: (message?: string) => void
  message: (message: string) => void
} {
  const s = spinner()
  return {
    start: (message: string) => s.start(message),
    stop: (message?: string) => s.stop(message),
    message: (message: string) => s.message(message),
  }
}

/**
 * Runs an operation with a spinner
 */
export async function withSpinner<T>(
  message: string,
  operation: () => Promise<T>,
): Promise<Result<T, Error>> {
  const s = spinner()
  s.start(message)

  try {
    const result = await operation()
    s.stop(`${message} ✓`)
    return ok(result)
  } catch (error) {
    s.stop(`${message} ✗`)
    if (error instanceof Error) {
      return err(error)
    }
    return err(createCLIError(String(error), CLIErrorCode.COMMAND_FAILED))
  }
}

/**
 * Prompts for project name with validation
 */
export async function promptProjectName(existingName?: string): Promise<Result<string, Error>> {
  if (existingName != null && existingName.trim().length > 0) {
    return ok(existingName.trim())
  }

  return promptText({
    message: '📦 What is the name of your project?',
    placeholder: 'my-awesome-project',
    required: true,
    validate: value => {
      if (!/^[a-z\d][a-z\d-]*[a-z\d]$|^[a-z\d]$/.test(value.trim())) {
        return 'Project name must contain only lowercase letters, numbers, and hyphens'
      }
      return undefined
    },
  })
}

/**
 * Prompts for feature selection
 */
export async function promptFeatureSelection(
  availableFeatures: Record<string, {description: string}>,
): Promise<Result<string, Error>> {
  const featureNames = Object.keys(availableFeatures)

  if (featureNames.length === 0) {
    return err(createCLIError('No features available', CLIErrorCode.INVALID_INPUT))
  }

  return promptSelect({
    message: 'Select a feature to add:',
    options: featureNames.map(name => ({
      value: name,
      label: `${name} - ${availableFeatures[name]?.description ?? 'No description'}`,
    })),
  })
}

/**
 * Prompts for package manager selection
 */
export async function promptPackageManager(
  detected?: 'npm' | 'yarn' | 'pnpm' | 'bun',
): Promise<Result<'npm' | 'yarn' | 'pnpm' | 'bun', Error>> {
  const options: SelectOption<'npm' | 'yarn' | 'pnpm' | 'bun'>[] = [
    {value: 'pnpm', label: 'pnpm', hint: 'Fast, disk space efficient'},
    {value: 'npm', label: 'npm', hint: 'Node Package Manager'},
    {value: 'yarn', label: 'yarn', hint: 'Fast, reliable, secure'},
    {value: 'bun', label: 'bun', hint: 'Incredibly fast JavaScript runtime'},
  ]

  return promptSelect({
    message: '📦 Which package manager would you like to use?',
    options,
    initialValue: detected ?? 'pnpm',
  })
}

/**
 * Prompts for conflict resolution strategy
 */
export async function promptConflictResolution(): Promise<
  Result<'merge' | 'overwrite' | 'skip' | 'abort', Error>
> {
  return promptSelect({
    message: 'How would you like to handle these conflicts?',
    options: [
      {value: 'merge', label: 'Merge configurations (recommended)'},
      {value: 'overwrite', label: 'Overwrite existing configurations'},
      {value: 'skip', label: 'Skip conflicting files'},
      {value: 'abort', label: 'Cancel operation'},
    ] as SelectOption<'merge' | 'overwrite' | 'skip' | 'abort'>[],
  })
}

/**
 * Displays project analysis results
 */
export function displayProjectAnalysis(projectInfo: ProjectInfo): void {
  const details = [
    `Type: ${projectInfo.type}`,
    projectInfo.framework == null ? null : `Framework: ${projectInfo.framework}`,
    projectInfo.packageManager == null ? null : `Package Manager: ${projectInfo.packageManager}`,
    projectInfo.configurations == null || projectInfo.configurations.length === 0
      ? null
      : `Configurations: ${projectInfo.configurations.join(', ')}`,
  ]
    .filter(Boolean)
    .join('\n')

  displayNote(details, '📊 Project Analysis')
}

/**
 * Displays a summary of planned operations
 */
export function displayOperationSummary(
  title: string,
  operations: {type: string; description: string}[],
): void {
  const summary = operations.map(op => `• ${op.type}: ${op.description}`).join('\n')

  displayNote(summary, title)
}
