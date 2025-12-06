/**
 * Unified argument parsing and project resolution utilities
 * Part of Phase 4: Command Interface Consolidation (TASK-028)
 *
 * Provides shared utilities for argument parsing, project resolution,
 * and template selection across create and add commands.
 */

import type {Result} from '@bfra.me/es/result'
import type {CreateCommandOptions, ProjectInfo, TemplateSource} from '../types.js'
import path from 'node:path'
import process from 'node:process'
import {err, ok} from '@bfra.me/es/result'
import {
  CLIErrorCode,
  createCLIError,
  createProjectError,
  ProjectErrorCode,
} from '../utils/errors.js'
import {analyzeProject, isNodeProject} from '../utils/project-detection.js'
import {
  validateProjectName,
  validateProjectPath,
  validateTemplateId,
} from '../utils/validation-factory.js'

/**
 * Resolved project location with metadata
 */
export interface ResolvedProject {
  /** Absolute path to the project directory */
  path: string
  /** Project name extracted from path or options */
  name: string
  /** Whether the directory exists */
  exists: boolean
  /** Whether the directory is empty (if exists) */
  isEmpty?: boolean
}

/**
 * Resolved template information
 */
export interface ResolvedTemplateSource {
  /** Template source type */
  type: TemplateSource['type']
  /** Template location */
  location: string
  /** Git reference (branch/tag) */
  ref?: string
  /** Subdirectory within template */
  subdir?: string
}

/**
 * Arguments resolution result
 */
export interface ResolvedArguments {
  /** Resolved project information */
  project: ResolvedProject
  /** Resolved template source */
  template?: ResolvedTemplateSource
  /** Validated command options */
  options: CreateCommandOptions
}

/**
 * Resolves the project directory from options or defaults
 */
export async function resolveProjectDirectory(
  options: CreateCommandOptions,
): Promise<Result<ResolvedProject, Error>> {
  const projectName = options.name?.trim()
  const outputDir = options.outputDir?.trim()
  const cwd = options.cwd ?? process.cwd()

  let projectPath: string
  let name: string

  if (outputDir != null && outputDir.length > 0) {
    projectPath = path.isAbsolute(outputDir) ? outputDir : path.resolve(cwd, outputDir)
    name = projectName ?? path.basename(projectPath)
  } else if (projectName != null && projectName.length > 0) {
    const nameValidation = validateProjectName(projectName)
    if (!nameValidation.success) {
      return err(nameValidation.error)
    }
    projectPath = path.resolve(cwd, projectName)
    name = projectName
  } else {
    projectPath = cwd
    name = path.basename(cwd)
  }

  const pathValidation = validateProjectPath(projectPath)
  if (!pathValidation.success) {
    return err(pathValidation.error)
  }

  const exists = await checkDirectoryExists(projectPath)
  let isEmpty: boolean | undefined

  if (exists) {
    isEmpty = await isDirectoryEmpty(projectPath)
  }

  return ok({
    path: projectPath,
    name,
    exists,
    isEmpty,
  })
}

/**
 * Resolves the template source from options
 */
export function resolveTemplateSource(
  options: CreateCommandOptions,
): Result<ResolvedTemplateSource | undefined, Error> {
  const template = options.template?.trim()

  if (template == null || template.length === 0) {
    return ok(undefined)
  }

  // Validate template identifier
  const validation = validateTemplateId(template)
  if (!validation.success) {
    return err(validation.error)
  }

  // Determine template type
  const type = determineTemplateType(template)

  return ok({
    type,
    location: template,
    ref: options.templateRef,
    subdir: options.templateSubdir,
  })
}

/**
 * Determines the template source type from the identifier
 */
function determineTemplateType(template: string): TemplateSource['type'] {
  // Check for URL
  if (template.startsWith('http://') || template.startsWith('https://')) {
    return 'url'
  }

  // Check for local path
  if (template.startsWith('./') || template.startsWith('/') || template.startsWith('..')) {
    return 'local'
  }

  // Check for GitHub shorthand (user/repo or github:user/repo)
  if (template.startsWith('github:') || /^[\w-]+\/[\w-]+/.test(template)) {
    return 'github'
  }

  // Default to builtin
  return 'builtin'
}

/**
 * Resolves all command arguments into a unified structure
 */
export async function resolveArguments(
  options: CreateCommandOptions,
): Promise<Result<ResolvedArguments, Error>> {
  // Resolve project directory
  const projectResult = await resolveProjectDirectory(options)
  if (!projectResult.success) {
    return err(projectResult.error)
  }

  // Resolve template source
  const templateResult = resolveTemplateSource(options)
  if (!templateResult.success) {
    return err(templateResult.error)
  }

  return ok({
    project: projectResult.data,
    template: templateResult.data,
    options,
  })
}

/**
 * Validates that a project directory can be used for creation
 */
export async function validateProjectDirectory(
  project: ResolvedProject,
  options: {force?: boolean},
): Promise<Result<void, Error>> {
  if (!project.exists) {
    return ok(undefined)
  }

  if (project.isEmpty) {
    return ok(undefined)
  }

  if (options.force) {
    return ok(undefined)
  }

  return err(
    createCLIError(
      `Directory "${project.path}" already exists and is not empty. Use --force to overwrite.`,
      CLIErrorCode.DIRECTORY_NOT_EMPTY,
      {path: project.path},
    ),
  )
}

/**
 * Detects and validates an existing project for feature addition
 */
export async function resolveExistingProject(
  targetDir?: string,
): Promise<Result<ProjectInfo, Error>> {
  const dir = targetDir ?? process.cwd()

  // Check if this is a Node.js project
  if (!isNodeProject(dir)) {
    return err(
      createProjectError(
        'Target directory does not contain a valid Node.js project. Please run this command in a project directory with a package.json file.',
        ProjectErrorCode.PACKAGE_JSON_NOT_FOUND,
        {path: dir},
      ),
    )
  }

  try {
    const projectInfo = await analyzeProject(dir)
    return ok(projectInfo)
  } catch (error) {
    return err(
      createProjectError(
        `Failed to analyze project: ${error instanceof Error ? error.message : String(error)}`,
        ProjectErrorCode.PROJECT_DETECTION_FAILED,
        {path: dir},
      ),
    )
  }
}

/**
 * Parses positional arguments from CLI
 */
export function parsePositionalArguments(args: string[]): {
  projectName?: string
  feature?: string
  remaining: string[]
} {
  const [first, ...remaining] = args

  return {
    projectName: first,
    feature: first,
    remaining,
  }
}

/**
 * Merges default options with user-provided options
 */
export function mergeWithDefaults<T extends Record<string, unknown>>(
  userOptions: Partial<T>,
  defaults: Partial<T>,
): T {
  const merged: Record<string, unknown> = {...defaults}

  for (const [key, value] of Object.entries(userOptions)) {
    if (value !== undefined) {
      merged[key] = value
    }
  }

  return merged as T
}

/**
 * Extracts the project name from a path
 */
export function extractProjectName(projectPath: string): string {
  return path.basename(projectPath)
}

/**
 * Normalizes a project path to be absolute
 */
export function normalizeProjectPath(projectPath: string, cwd?: string): string {
  if (path.isAbsolute(projectPath)) {
    return projectPath
  }
  return path.resolve(cwd ?? process.cwd(), projectPath)
}

async function checkDirectoryExists(dirPath: string): Promise<boolean> {
  const fs = await import('node:fs/promises')
  try {
    const stats = await fs.stat(dirPath)
    return stats.isDirectory()
  } catch {
    return false
  }
}

async function isDirectoryEmpty(dirPath: string): Promise<boolean> {
  const fs = await import('node:fs/promises')
  try {
    const files = await fs.readdir(dirPath)
    return files.length === 0
  } catch {
    return true
  }
}
