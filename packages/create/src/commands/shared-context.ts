/**
 * Shared cac command context with composition patterns
 * Part of Phase 4: Command Interface Consolidation (TASK-025)
 *
 * Provides reusable command infrastructure leveraging Phase 1 option definitions,
 * enabling consistent CLI behavior across create and add commands.
 */

import type {Result} from '@bfra.me/es/result'
import type {CAC, Command as CacCommand} from 'cac'
import type {BaseCommandOptions, CreateCommandOptions} from '../types.js'
import process from 'node:process'
import {err, ok} from '@bfra.me/es/result'
import {
  AddCommandOptionDefinitions,
  CommonOptions,
  CreateCommandOptionDefinitions,
  parseFeatures,
  validateCreateCommandOptions,
} from '../utils/command-options.js'
import {CLIErrorCode, createCLIError, isBaseError} from '../utils/errors.js'
import {logDebug, logError} from '../utils/logger.js'

/**
 * Command context containing shared state and utilities
 */
export interface CommandContext {
  /** Verbose output enabled */
  verbose: boolean
  /** Dry run mode */
  dryRun: boolean
  /** Working directory */
  cwd: string
  /** Start time for duration tracking */
  startTime: number
}

/**
 * Command executor function type
 */
export type CommandExecutor<TArgs extends unknown[], TOptions> = (
  context: CommandContext,
  args: TArgs,
  options: TOptions,
) => Promise<Result<void, Error>>

/**
 * Creates a base command context from parsed options
 */
export function createCommandContext(options: BaseCommandOptions): CommandContext {
  return {
    verbose: options.verbose ?? false,
    dryRun: options.dryRun ?? false,
    cwd: options.cwd ?? process.cwd(),
    startTime: Date.now(),
  }
}

/**
 * Registers global options on a cac CLI instance
 */
export function registerGlobalOptions(cli: CAC): CAC {
  return cli
    .option(CommonOptions.verbose.flags, CommonOptions.verbose.description)
    .option(CommonOptions.dryRun.flags, CommonOptions.dryRun.description)
    .option(CommonOptions.cwd.flags, CommonOptions.cwd.description)
}

/**
 * Registers create command options on a cac command
 */
export function registerCreateCommandOptions(command: CacCommand): CacCommand {
  const opts = CreateCommandOptionDefinitions
  return command
    .option(opts.template.flags, opts.template.description)
    .option(opts.description.flags, opts.description.description)
    .option(opts.author.flags, opts.author.description)
    .option(opts.version.flags, opts.version.description, {default: opts.version.default})
    .option(opts.outputDir.flags, opts.outputDir.description)
    .option(opts.packageManager.flags, opts.packageManager.description)
    .option(opts.skipPrompts.flags, opts.skipPrompts.description)
    .option(opts.force.flags, opts.force.description)
    .option(opts.interactive.flags, opts.interactive.description)
    .option(opts.templateRef.flags, opts.templateRef.description)
    .option(opts.templateSubdir.flags, opts.templateSubdir.description)
    .option(opts.features.flags, opts.features.description)
    .option(opts.git.flags, opts.git.description)
    .option(opts.install.flags, opts.install.description)
    .option(opts.preset.flags, opts.preset.description)
    .option(opts.ai.flags, opts.ai.description)
    .option(opts.describe.flags, opts.describe.description)
}

/**
 * Registers add command options on a cac command
 */
export function registerAddCommandOptions(command: CacCommand): CacCommand {
  const opts = AddCommandOptionDefinitions
  return command
    .option(opts.skipConfirm.flags, opts.skipConfirm.description)
    .option(opts.list.flags, opts.list.description)
}

/**
 * Normalizes raw CLI options into CreateCommandOptions
 */
export function normalizeCreateOptions(
  projectName: string | undefined,
  rawOptions: Record<string, unknown>,
): CreateCommandOptions {
  const features = parseFeatures(rawOptions.features as string | undefined)

  return {
    name: projectName,
    template: rawOptions.template as string | undefined,
    description: rawOptions.description as string | undefined,
    author: rawOptions.author as string | undefined,
    version: rawOptions.version as string | undefined,
    outputDir: rawOptions.outputDir as string | undefined,
    packageManager: rawOptions.packageManager as 'npm' | 'yarn' | 'pnpm' | 'bun' | undefined,
    skipPrompts: rawOptions.skipPrompts as boolean | undefined,
    force: rawOptions.force as boolean | undefined,
    interactive: rawOptions.interactive !== false,
    verbose: rawOptions.verbose as boolean | undefined,
    dryRun: rawOptions.dryRun as boolean | undefined,
    cwd: rawOptions.cwd as string | undefined,
    templateRef: rawOptions.templateRef as string | undefined,
    templateSubdir: rawOptions.templateSubdir as string | undefined,
    features: features.join(','),
    git: rawOptions.git !== false,
    install: rawOptions.install !== false,
    preset: rawOptions.preset as 'minimal' | 'standard' | 'full' | undefined,
    ai: rawOptions.ai as boolean | undefined,
    describe: rawOptions.describe as string | undefined,
  }
}

/**
 * Wraps a command executor with consistent error handling and context management
 */
export function withCommandContext<TArgs extends unknown[], TOptions extends BaseCommandOptions>(
  executor: CommandExecutor<TArgs, TOptions>,
): (args: TArgs, options: TOptions) => Promise<void> {
  return async (args: TArgs, options: TOptions): Promise<void> => {
    const context = createCommandContext(options)

    logDebug(`Command started at ${new Date(context.startTime).toISOString()}`, {
      verbose: context.verbose,
    })

    const result = await executor(context, args, options)

    if (!result.success) {
      handleCommandError(result.error, context)
    }

    const duration = Date.now() - context.startTime
    logDebug(`Command completed in ${duration}ms`, {verbose: context.verbose})
  }
}

/**
 * Handles command errors with consistent formatting and exit codes
 */
export function handleCommandError(error: Error, context: CommandContext): never {
  logError(error, {verbose: context.verbose})

  const exitCode = getExitCodeForError(error)
  process.exit(exitCode)
}

/**
 * Gets the appropriate exit code for an error
 */
function getExitCodeForError(error: Error): number {
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
    default:
      return 1
  }
}

/**
 * Validates and transforms command options with Result pattern
 */
export function validateAndTransformOptions(
  rawOptions: Record<string, unknown>,
  projectName?: string,
): Result<CreateCommandOptions, Error> {
  const normalized = normalizeCreateOptions(projectName, rawOptions)
  return validateCreateCommandOptions(normalized)
}

/**
 * Creates a standardized error result from an unknown error
 */
export function createErrorResult(error: unknown): Result<void, Error> {
  if (error instanceof Error) {
    return err(error)
  }
  return err(createCLIError(String(error), CLIErrorCode.COMMAND_FAILED))
}

/**
 * Creates a success result
 */
export function createSuccessResult(): Result<void, Error> {
  return ok(undefined)
}

/**
 * Composition helper to chain command middleware
 */
export function composeMiddleware<T>(
  ...middlewares: ((input: T) => Promise<T> | T)[]
): (input: T) => Promise<T> {
  return async (input: T): Promise<T> => {
    let result = input
    for (const middleware of middlewares) {
      result = await middleware(result)
    }
    return result
  }
}

/**
 * Command builder helper for consistent command registration
 */
export interface CommandBuilder {
  name: string
  description: string
  registerOptions: (command: CacCommand) => CacCommand
  action: (
    ...args: unknown[]
  ) => void | Promise<void> | Result<void, Error> | Promise<Result<void, Error>>
}

/**
 * Registers a command with consistent patterns
 */
export function registerCommand(cli: CAC, builder: CommandBuilder): CacCommand {
  let command = cli.command(builder.name, builder.description)
  command = builder.registerOptions(command)
  command.action(builder.action)
  return command
}
