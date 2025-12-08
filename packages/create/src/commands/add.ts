import type {Result} from '@bfra.me/es/result'
import type {AddCommandOptions, CreateError} from '../types.js'
import process from 'node:process'
import {err, isOk, ok} from '@bfra.me/es/result'
import {intro, isCancel, outro, select, spinner} from '@clack/prompts'
import {consola} from 'consola'
import {addFeature, getAvailableFeatures, getFeatureInfo} from '../features/registry.js'
import {createBackup, restoreBackup} from '../utils/backup.js'
import {detectConflicts, resolveConflicts} from '../utils/conflict-resolution.js'
import {analyzeProject, isNodeProject} from '../utils/project-detection.js'

export interface AddFeatureOptions {
  /** Feature to add */
  feature: string
  /** Target directory */
  targetDir?: string
  /** Skip confirmation prompts */
  skipConfirm?: boolean
  /** Verbose output */
  verbose?: boolean
  /** Dry run mode */
  dryRun?: boolean
  /** Feature-specific options */
  options?: Record<string, unknown>
}

/**
 * Add a feature to an existing project with conflict detection and backup.
 *
 * Analyzes the target project, detects potential conflicts, and safely adds the requested
 * feature. Automatically creates backups before making changes and can restore them if the
 * operation fails. Supports dry-run mode for previewing changes without modification.
 *
 * @param options - Feature addition configuration
 * @param options.feature - Feature identifier to add (e.g., 'eslint', 'vitest', 'component')
 * @param options.targetDir - Target directory path (defaults to current working directory)
 * @param options.skipConfirm - Skip confirmation prompts for automated workflows
 * @param options.verbose - Enable detailed logging output
 * @param options.dryRun - Preview changes without modifying files
 * @param options.options - Feature-specific configuration options
 * @returns A Result indicating success or containing a CreateError with details
 *
 * @example
 * ```typescript
 * import { addFeatureToProject } from '@bfra.me/create'
 * import { isOk, isErr } from '@bfra.me/es/result'
 *
 * // Add ESLint with defaults
 * const result = await addFeatureToProject({ feature: 'eslint' })
 *
 * if (isErr(result)) {
 *   console.error('Failed:', result.error.message)
 *   process.exit(1)
 * }
 *
 * // Add component with options
 * const result = await addFeatureToProject({
 *   feature: 'component',
 *   targetDir: './src',
 *   options: { name: 'Button', type: 'functional' }
 * })
 * ```
 */
export async function addFeatureToProject(
  options: AddFeatureOptions,
): Promise<Result<void, CreateError>> {
  const {feature, targetDir = process.cwd(), skipConfirm, verbose, dryRun} = options

  if (verbose) {
    consola.info('Starting feature addition process...')
  }

  if (!isNodeProject(targetDir)) {
    return err({
      code: 'PROJECT_DETECTION_FAILED',
      message:
        'Target directory does not contain a valid Node.js project. Please run this command in a project directory with a package.json file.',
      path: targetDir,
    })
  }

  intro(`Adding ${feature} to your project`)

  const s = spinner()
  s.start('Analyzing project structure...')
  const projectInfo = await analyzeProject(targetDir)
  s.stop('Project analysis complete')

  if (verbose) {
    consola.info('Project analysis:', {
      type: projectInfo.type,
      framework: projectInfo.framework,
      packageManager: projectInfo.packageManager,
      configurations: projectInfo.configurations,
    })
  }

  const availableFeatures = getAvailableFeatures()
  const featureInfo = getFeatureInfo(feature)

  if (!featureInfo) {
    const suggestion = await select({
      message: `Feature "${feature}" not found. Would you like to see available features?`,
      options: [
        {value: 'list', label: 'Show available features'},
        {value: 'abort', label: 'Cancel operation'},
      ],
    })

    if (isCancel(suggestion) || suggestion === 'abort') {
      outro('Operation cancelled')
      return ok(undefined)
    }

    if (suggestion === 'list') {
      consola.info('Available features:')
      for (const [name, info] of Object.entries(availableFeatures)) {
        consola.info(`  ${name}: ${info.description}`)
      }
      return ok(undefined)
    }
  }

  const conflicts = await detectConflicts(targetDir, feature, projectInfo)

  if (conflicts.length > 0 && !skipConfirm) {
    consola.warn('Found potential conflicts:')
    for (const conflict of conflicts) {
      consola.warn(`  - ${conflict.description}`)
    }

    const resolution = await select({
      message: 'How would you like to handle these conflicts?',
      options: [
        {value: 'merge', label: 'Merge configurations (recommended)'},
        {value: 'overwrite', label: 'Overwrite existing configurations'},
        {value: 'skip', label: 'Skip conflicting files'},
        {value: 'abort', label: 'Cancel operation'},
      ],
    })

    if (isCancel(resolution) || resolution === 'abort') {
      outro('Operation cancelled')
      return ok(undefined)
    }

    await resolveConflicts(conflicts, resolution as string, targetDir)
  }

  // Backup enables safe rollback if feature addition fails partway through
  let backupId: string | undefined
  if (!dryRun) {
    const s = spinner()
    s.start('Creating backup...')
    backupId = await createBackup(targetDir, feature)
    s.stop('Backup created')

    if (verbose) {
      consola.info(`Backup created with ID: ${backupId}`)
    }
  }

  try {
    const s = spinner()
    s.start(`Adding ${feature}...`)

    await addFeature(feature, {
      targetDir,
      projectInfo,
      verbose,
      dryRun,
      options: options.options,
    })

    s.stop(`${feature} added successfully`)

    if (dryRun) {
      consola.info('Dry run completed - no files were modified')
    } else {
      outro(`✅ Successfully added ${feature} to your project!`)

      if (featureInfo?.nextSteps) {
        consola.info('\nNext steps:')
        for (const step of featureInfo.nextSteps) {
          consola.info(`  ${step}`)
        }
      }
    }

    return ok(undefined)
  } catch (error) {
    const errorObj = error as Error

    if (backupId != null && !dryRun) {
      consola.warn('Feature addition failed, restoring backup...')
      try {
        await restoreBackup(backupId, targetDir)
        consola.info('Backup restored successfully')
      } catch (restoreError) {
        consola.error('Failed to restore backup:', restoreError)
        consola.error('Manual cleanup may be required')
      }
    }

    return err({
      code: 'FILE_SYSTEM_ERROR',
      message: `Failed to add ${feature}: ${errorObj.message}`,
      operation: 'add-feature',
      cause: errorObj,
    })
  }
}

/**
 * List available features
 */
export async function listAvailableFeatures(): Promise<void> {
  const features = getAvailableFeatures()

  intro('Available features')

  for (const [name, info] of Object.entries(features)) {
    consola.info(`${name}:`)
    consola.info(`  Description: ${info.description}`)
    if (info.dependencies && info.dependencies.length > 0) {
      consola.info(`  Dependencies: ${info.dependencies.join(', ')}`)
    }
    if (info.supportedFrameworks && info.supportedFrameworks.length > 0) {
      consola.info(`  Supported frameworks: ${info.supportedFrameworks.join(', ')}`)
    }
    consola.log('')
  }

  outro('Use `add <feature>` to add a specific feature to your project')
}

/**
 * Enhanced add command handler with interactive prompts
 */
export async function handleAddCommand(options: AddCommandOptions): Promise<void> {
  const {feature, verbose, dryRun} = options

  if (feature === '--list' || feature === 'list') {
    await listAvailableFeatures()
    return
  }

  if (feature.length > 0) {
    const result = await addFeatureToProject({
      feature,
      verbose,
      dryRun,
      skipConfirm: options.skipConfirm,
      options: options.options,
    })

    if (!isOk(result)) {
      consola.error(`Failed to add feature: ${result.error.message}`)
      if (verbose) {
        consola.error('Error code:', result.error.code)
      }
      process.exit(1)
    }
  } else {
    const availableFeatures = getAvailableFeatures()
    const featureNames = Object.keys(availableFeatures)

    if (featureNames.length === 0) {
      consola.warn('No features available')
      return
    }

    const selectedFeature = await select({
      message: 'Select a feature to add:',
      options: featureNames.map(name => ({
        value: name,
        label: `${name} - ${availableFeatures[name]?.description ?? 'No description'}`,
      })),
    })

    if (isCancel(selectedFeature)) {
      outro('Operation cancelled')
      return
    }

    const result = await addFeatureToProject({
      feature: selectedFeature,
      verbose,
      dryRun,
      skipConfirm: options.skipConfirm,
      options: options.options,
    })

    if (!isOk(result)) {
      consola.error(`Failed to add feature: ${result.error.message}`)
      if (verbose) {
        consola.error('Error code:', result.error.code)
      }
      process.exit(1)
    }
  }
}
