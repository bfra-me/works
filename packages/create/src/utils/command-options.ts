/**
 * Shared command option definitions and validators
 * Part of Phase 1: Foundation & Type System Enhancement
 *
 * Provides reusable command option definitions and validation logic
 * for use across create and add commands to eliminate duplication.
 */

import type {Result} from '@bfra.me/es/result'
import type {CreateCommandOptions} from '../types.js'
import {err, ok} from '@bfra.me/es/result'
import {CLIErrorCode, createCLIError} from './errors.js'
import {
  validatePackageManager,
  validateProjectName,
  validateProjectPath,
  validateSemver,
} from './validation-factory.js'

/**
 * Base command options shared across all commands
 */
export interface BaseCommandOptionDefinitions {
  verbose?: boolean
  dryRun?: boolean
  cwd?: string
}

/**
 * Common option definitions for cac CLI framework
 */
export const CommonOptions = {
  verbose: {
    flags: '--verbose',
    description: 'Enable verbose output',
  },
  dryRun: {
    flags: '--dry-run',
    description: 'Show what would be done without making changes',
  },
  cwd: {
    flags: '--cwd <dir>',
    description: 'Working directory',
  },
} as const

/**
 * Create command option definitions
 */
export const CreateCommandOptionDefinitions = {
  template: {
    flags: '-t, --template <template>',
    description: 'Template to use (GitHub repo, URL, or built-in name)',
  },
  description: {
    flags: '-d, --description <desc>',
    description: 'Project description',
  },
  author: {
    flags: '-a, --author <author>',
    description: 'Project author',
  },
  version: {
    flags: '-v, --version <version>',
    description: 'Project version',
    default: '1.0.0',
  },
  outputDir: {
    flags: '-o, --output-dir <dir>',
    description: 'Output directory for the project',
  },
  packageManager: {
    flags: '--package-manager <pm>',
    description: 'Package manager to use (npm, yarn, pnpm, bun)',
  },
  skipPrompts: {
    flags: '--skip-prompts',
    description: 'Skip interactive prompts and use defaults',
  },
  force: {
    flags: '--force',
    description: 'Force overwrite existing files',
  },
  interactive: {
    flags: '--no-interactive',
    description: 'Disable interactive mode',
  },
  templateRef: {
    flags: '--template-ref <ref>',
    description: 'Git branch or tag for GitHub templates',
  },
  templateSubdir: {
    flags: '--template-subdir <subdir>',
    description: 'Subdirectory within template repository',
  },
  features: {
    flags: '--features <features>',
    description: 'Comma-separated list of features to include',
  },
  git: {
    flags: '--no-git',
    description: 'Skip git repository initialization',
  },
  install: {
    flags: '--no-install',
    description: 'Skip dependency installation',
  },
  preset: {
    flags: '--preset <preset>',
    description: 'Use a configuration preset (minimal, standard, full)',
  },
  ai: {
    flags: '--ai',
    description: 'Enable AI-powered features for intelligent project setup',
  },
  describe: {
    flags: '--describe <description>',
    description: 'Natural language description of the project for AI analysis',
  },
} as const

/**
 * Add command option definitions
 */
export const AddCommandOptionDefinitions = {
  skipConfirm: {
    flags: '--skip-confirm',
    description: 'Skip confirmation prompts',
  },
  list: {
    flags: '--list',
    description: 'List available features',
  },
} as const

/**
 * Validates create command options
 */
export function validateCreateCommandOptions(
  options: CreateCommandOptions,
): Result<CreateCommandOptions, Error> {
  const validated: CreateCommandOptions = {...options}

  // Validate project name if provided
  if (options.name !== undefined && options.name.trim().length > 0) {
    const nameResult = validateProjectName(options.name)
    if (!nameResult.success) {
      return err(nameResult.error)
    }
  }

  // Validate output directory if provided
  if (options.outputDir !== undefined && options.outputDir.trim().length > 0) {
    const dirResult = validateProjectPath(options.outputDir)
    if (!dirResult.success) {
      return err(dirResult.error)
    }
  }

  // Validate package manager if provided
  if (options.packageManager !== undefined) {
    const pmResult = validatePackageManager(options.packageManager)
    if (!pmResult.success) {
      return err(pmResult.error)
    }
    validated.packageManager = pmResult.data
  }

  // Validate version if provided
  if (options.version !== undefined) {
    const versionResult = validateSemver(options.version)
    if (!versionResult.success) {
      return err(versionResult.error)
    }
    validated.version = versionResult.data
  }

  // Validate preset if provided
  if (options.preset !== undefined) {
    const validPresets = ['minimal', 'standard', 'full'] as const
    if (!validPresets.includes(options.preset)) {
      return err(
        createCLIError(
          `Invalid preset: ${options.preset}. Must be one of: ${validPresets.join(', ')}`,
          CLIErrorCode.INVALID_INPUT,
        ),
      )
    }
  }

  // Validate AI options
  if (options.ai && options.describe == null) {
    return err(
      createCLIError(
        'AI features require a project description. Use --describe to provide one.',
        CLIErrorCode.INVALID_INPUT,
      ),
    )
  }

  return ok(validated)
}

/**
 * Parses comma-separated features string into array
 */
export function parseFeatures(featuresString: string | undefined): string[] {
  if (featuresString === undefined || featuresString.trim().length === 0) {
    return []
  }

  return featuresString
    .split(',')
    .map(f => f.trim())
    .filter(f => f.length > 0)
}

/**
 * Configuration preset definitions
 */
export interface ConfigPreset {
  template?: string
  git: boolean
  install: boolean
  interactive: boolean
  verbose: boolean
}

/**
 * Available configuration presets
 */
export const ConfigurationPresets: Record<string, ConfigPreset> = {
  minimal: {
    template: 'minimal',
    git: false,
    install: false,
    interactive: false,
    verbose: false,
  },
  standard: {
    template: 'library',
    git: true,
    install: true,
    interactive: true,
    verbose: false,
  },
  full: {
    template: 'library',
    git: true,
    install: true,
    interactive: true,
    verbose: true,
  },
}

/**
 * Applies a configuration preset to command options
 */
export function applyConfigurationPreset(
  presetName?: 'minimal' | 'standard' | 'full',
): Partial<CreateCommandOptions> {
  if (presetName === undefined) {
    return {}
  }

  const preset = ConfigurationPresets[presetName]
  if (preset === undefined) {
    return {}
  }

  return {
    template: preset.template,
    git: preset.git,
    install: preset.install,
    interactive: preset.interactive,
    verbose: preset.verbose,
  }
}

/**
 * Merges command options with defaults
 */
export function mergeCommandOptions<T extends Record<string, unknown>>(
  provided: Partial<T>,
  defaults: Partial<T>,
): T {
  return {
    ...defaults,
    ...provided,
  } as T
}

/**
 * Validates a feature name
 */
export function validateFeatureName(feature: string): Result<string, Error> {
  const trimmed = feature.trim()

  if (trimmed.length === 0) {
    return err(createCLIError('Feature name is required', CLIErrorCode.INVALID_INPUT))
  }

  // Feature names should be lowercase alphanumeric with hyphens
  if (!/^[a-z\d-]+$/.test(trimmed)) {
    return err(
      createCLIError(
        'Feature name must contain only lowercase letters, numbers, and hyphens',
        CLIErrorCode.INVALID_INPUT,
        {featureName: trimmed},
      ),
    )
  }

  return ok(trimmed)
}
