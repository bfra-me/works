/**
 * Standardized error messages with actionable suggestions
 * Part of Phase 4: Command Interface Consolidation (TASK-032)
 *
 * Provides consistent, user-friendly error messages using the Phase 1
 * error factory with actionable suggestions for resolution.
 */

import {consola} from 'consola'
import {
  AIErrorCode,
  CLIErrorCode,
  isBaseError,
  ProjectErrorCode,
  TemplateErrorCode,
} from '../utils/errors.js'

/**
 * Error suggestion definition
 */
export interface ErrorSuggestion {
  message: string
  command?: string
  action?: string
}

/**
 * Error display options
 */
export interface ErrorDisplayOptions {
  verbose?: boolean
  showSuggestions?: boolean
  showCode?: boolean
}

/**
 * Gets actionable suggestions for an error
 */
export function getErrorSuggestions(error: unknown): ErrorSuggestion[] {
  if (!isBaseError(error)) {
    return []
  }

  const suggestions: ErrorSuggestion[] = []

  switch (error.code) {
    // Template errors
    case TemplateErrorCode.TEMPLATE_NOT_FOUND:
      suggestions.push(
        {message: 'Check that the template name or path is correct'},
        {message: 'For GitHub templates, use format: user/repo or github:user/repo'},
        {message: 'List available built-in templates with --list'},
      )
      break

    case TemplateErrorCode.TEMPLATE_FETCH_FAILED:
      suggestions.push(
        {message: 'Check your internet connection'},
        {message: 'Verify the template URL or repository is accessible'},
        {message: 'Try again later if this is a network issue'},
      )
      break

    case TemplateErrorCode.TEMPLATE_INVALID:
    case TemplateErrorCode.TEMPLATE_METADATA_INVALID:
      suggestions.push(
        {message: 'The template structure may be corrupted or incompatible'},
        {message: 'Check if the template has a valid package.json or template.json'},
        {message: 'Try using a different template'},
      )
      break

    case TemplateErrorCode.TEMPLATE_VARIABLE_MISSING:
      suggestions.push(
        {message: 'Provide the missing variable using command options'},
        {message: 'Run with --interactive to be prompted for all variables'},
      )
      break

    // AI errors
    case AIErrorCode.AI_API_KEY_MISSING:
      suggestions.push(
        {
          message: 'Set the OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable',
          command: 'export OPENAI_API_KEY=your_api_key',
        },
        {message: 'Disable AI features by removing --ai flag'},
      )
      break

    case AIErrorCode.AI_API_KEY_INVALID:
      suggestions.push(
        {message: 'Verify your API key is correct and not expired'},
        {message: 'Check that you have sufficient API credits'},
        {message: 'Generate a new API key from your provider dashboard'},
      )
      break

    case AIErrorCode.AI_RATE_LIMIT:
      suggestions.push(
        {message: 'Wait a few minutes and try again'},
        {message: 'Consider upgrading your API plan for higher limits'},
        {message: 'Run without --ai flag to skip AI features'},
      )
      break

    case AIErrorCode.AI_PROVIDER_UNAVAILABLE:
      suggestions.push(
        {message: 'The AI service may be temporarily unavailable'},
        {message: 'Try again later or run without AI features'},
      )
      break

    case AIErrorCode.AI_TIMEOUT:
      suggestions.push(
        {message: 'The AI request timed out - try again'},
        {message: 'Consider simplifying your project description'},
        {message: 'Run without --ai flag if the issue persists'},
      )
      break

    // CLI errors
    case CLIErrorCode.INVALID_PROJECT_NAME:
      suggestions.push(
        {message: 'Use only lowercase letters, numbers, and hyphens'},
        {message: 'Start with a letter or number, not a hyphen'},
        {message: 'Avoid using reserved names like "node_modules" or "package"'},
      )
      break

    case CLIErrorCode.INVALID_PATH:
      suggestions.push(
        {message: 'Check that the path is valid and accessible'},
        {message: 'Use an absolute path if relative paths cause issues'},
      )
      break

    case CLIErrorCode.PATH_TRAVERSAL_ATTEMPT:
      suggestions.push(
        {message: 'The path contains potentially dangerous characters'},
        {message: 'Use a simple path without .. or special sequences'},
      )
      break

    case CLIErrorCode.DIRECTORY_EXISTS:
      suggestions.push(
        {message: 'Choose a different project name or output directory'},
        {message: 'Use --force to overwrite the existing directory', command: '--force'},
      )
      break

    case CLIErrorCode.DIRECTORY_NOT_EMPTY:
      suggestions.push(
        {message: 'Empty the directory first or choose a different location'},
        {message: 'Use --force to overwrite existing files', command: '--force'},
      )
      break

    case CLIErrorCode.PERMISSION_DENIED:
      suggestions.push(
        {message: 'Check that you have write permissions to the directory'},
        {message: 'Try running with elevated permissions if needed'},
        {message: 'Choose a different output directory'},
      )
      break

    case CLIErrorCode.FILE_SYSTEM_ERROR:
      suggestions.push(
        {message: 'Check disk space and file system permissions'},
        {message: 'Ensure the disk is not full or read-only'},
        {message: 'Try a different output location'},
      )
      break

    // Project errors
    case ProjectErrorCode.PACKAGE_JSON_NOT_FOUND:
      suggestions.push(
        {message: 'Run this command from a project directory with a package.json'},
        {message: 'Use "create" command to start a new project first'},
        {message: 'Check that you are in the correct directory'},
      )
      break

    case ProjectErrorCode.PACKAGE_JSON_INVALID:
      suggestions.push(
        {message: 'The package.json file may be corrupted or malformed'},
        {message: 'Validate the JSON syntax in package.json'},
        {message: 'Try restoring from version control'},
      )
      break

    case ProjectErrorCode.PROJECT_DETECTION_FAILED:
      suggestions.push(
        {message: 'The project structure could not be determined'},
        {message: 'Ensure the project has a valid configuration'},
      )
      break
  }

  return suggestions
}

/**
 * Formats an error message with context
 */
export function formatErrorMessage(error: unknown): string {
  if (isBaseError(error)) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

/**
 * Gets a user-friendly error title
 */
export function getErrorTitle(error: unknown): string {
  if (!isBaseError(error)) {
    return 'Error'
  }

  switch (error.code) {
    case TemplateErrorCode.TEMPLATE_NOT_FOUND:
      return 'Template Not Found'
    case TemplateErrorCode.TEMPLATE_FETCH_FAILED:
      return 'Template Download Failed'
    case TemplateErrorCode.TEMPLATE_INVALID:
    case TemplateErrorCode.TEMPLATE_METADATA_INVALID:
      return 'Invalid Template'
    case TemplateErrorCode.TEMPLATE_VARIABLE_MISSING:
      return 'Missing Template Variable'

    case AIErrorCode.AI_API_KEY_MISSING:
    case AIErrorCode.AI_API_KEY_INVALID:
      return 'AI Configuration Error'
    case AIErrorCode.AI_RATE_LIMIT:
      return 'AI Rate Limit Exceeded'
    case AIErrorCode.AI_PROVIDER_UNAVAILABLE:
    case AIErrorCode.AI_TIMEOUT:
      return 'AI Service Unavailable'

    case CLIErrorCode.INVALID_PROJECT_NAME:
      return 'Invalid Project Name'
    case CLIErrorCode.INVALID_PATH:
    case CLIErrorCode.PATH_TRAVERSAL_ATTEMPT:
      return 'Invalid Path'
    case CLIErrorCode.DIRECTORY_EXISTS:
    case CLIErrorCode.DIRECTORY_NOT_EMPTY:
      return 'Directory Conflict'
    case CLIErrorCode.PERMISSION_DENIED:
      return 'Permission Denied'
    case CLIErrorCode.FILE_SYSTEM_ERROR:
      return 'File System Error'

    case ProjectErrorCode.PACKAGE_JSON_NOT_FOUND:
    case ProjectErrorCode.PACKAGE_JSON_INVALID:
      return 'Project Configuration Error'
    case ProjectErrorCode.PROJECT_DETECTION_FAILED:
      return 'Project Analysis Failed'

    default:
      return 'Error'
  }
}

/**
 * Displays an error with suggestions
 */
export function displayError(error: unknown, options: ErrorDisplayOptions = {}): void {
  const {verbose = false, showSuggestions = true, showCode = false} = options

  const title = getErrorTitle(error)
  const message = formatErrorMessage(error)
  const suggestions = showSuggestions ? getErrorSuggestions(error) : []

  // Display error title and message
  consola.error(`${title}: ${message}`)

  // Show error code in verbose mode
  if (showCode && isBaseError(error)) {
    consola.log(`  Code: ${error.code}`)
  }

  // Display suggestions
  if (suggestions.length > 0) {
    consola.log('')
    consola.log('💡 Suggestions:')
    for (const suggestion of suggestions) {
      consola.log(`  → ${suggestion.message}`)
      if (suggestion.command != null && verbose) {
        consola.log(`    Run: ${suggestion.command}`)
      }
    }
  }

  // Show stack trace in verbose mode
  if (verbose && error instanceof Error && error.stack != null) {
    consola.log('')
    consola.log('Stack trace:')
    consola.log(error.stack)
  }
}

/**
 * Creates a formatted error box for display
 */
export function createErrorBox(error: unknown, options: ErrorDisplayOptions = {}): void {
  const {verbose = false, showSuggestions = true} = options

  const title = getErrorTitle(error)
  const message = formatErrorMessage(error)
  const suggestions = showSuggestions ? getErrorSuggestions(error) : []

  let boxContent = message

  if (suggestions.length > 0) {
    const suggestionText = suggestions.map(s => `• ${s.message}`).join('\n')
    boxContent += `\n\n💡 Try:\n${suggestionText}`
  }

  if (verbose && isBaseError(error)) {
    boxContent += `\n\nError Code: ${error.code}`
  }

  consola.box({
    title: `❌ ${title}`,
    message: boxContent,
    style: {
      borderColor: 'red',
      borderStyle: 'rounded',
    },
  })
}

/**
 * Wraps an operation and displays errors with suggestions
 */
export async function withErrorDisplay<T>(
  operation: () => Promise<T>,
  options: ErrorDisplayOptions = {},
): Promise<T | undefined> {
  try {
    return await operation()
  } catch (error) {
    displayError(error, options)
    return undefined
  }
}

/**
 * Gets the appropriate exit code for an error
 */
export function getExitCode(error: unknown): number {
  if (!isBaseError(error)) {
    return 1
  }

  switch (error.code) {
    case CLIErrorCode.INVALID_INPUT:
    case CLIErrorCode.INVALID_PROJECT_NAME:
    case CLIErrorCode.VALIDATION_FAILED:
      return 2
    case CLIErrorCode.PERMISSION_DENIED:
      return 3
    case CLIErrorCode.FILE_SYSTEM_ERROR:
    case CLIErrorCode.DIRECTORY_EXISTS:
    case CLIErrorCode.DIRECTORY_NOT_EMPTY:
      return 4
    case CLIErrorCode.PATH_TRAVERSAL_ATTEMPT:
      return 5
    case CLIErrorCode.COMMAND_FAILED:
      return 6
    case AIErrorCode.AI_API_KEY_MISSING:
    case AIErrorCode.AI_API_KEY_INVALID:
      return 10
    case AIErrorCode.AI_RATE_LIMIT:
      return 11
    case TemplateErrorCode.TEMPLATE_NOT_FOUND:
      return 20
    case TemplateErrorCode.TEMPLATE_FETCH_FAILED:
      return 21
    default:
      return 1
  }
}
