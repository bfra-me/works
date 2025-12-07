/**
 * Validation factory functions for @bfra.me/create
 * Part of Phase 1: Foundation & Type System Enhancement
 *
 * Merges template schema, CLI option, and input sanitization logic into reusable
 * validation utilities using Result<T, E> pattern and unified error handling.
 */

import type {Result} from '@bfra.me/es/result'
import type {PackageName, ProjectPath, TemplateVariable} from '../types.js'
import path from 'node:path'
import {err, ok} from '@bfra.me/es/result'
import {isEmail, isSemver, isUrl, sanitizeInput, validatePath} from '@bfra.me/es/validation'
import {CLIErrorCode, createCLIError, createTemplateError, TemplateErrorCode} from './errors.js'
import {
  createPackageName,
  createProjectPath,
  isPackageManager,
  isPackageName,
  isProjectPath,
} from './type-guards.js'

/**
 * Validation options for project names
 */
export interface ProjectNameValidationOptions {
  /** Allow scoped packages (@org/name) */
  allowScoped?: boolean
  /** Maximum length */
  maxLength?: number
}

/**
 * Validates a project name and returns a branded PackageName
 */
export function validateProjectName(
  name: string,
  options: ProjectNameValidationOptions = {},
): Result<PackageName, Error> {
  const {allowScoped = true, maxLength = 214} = options

  const trimmed = name.trim()

  if (trimmed.length === 0) {
    return err(createCLIError('Project name is required', CLIErrorCode.INVALID_PROJECT_NAME))
  }

  if (trimmed.length > maxLength) {
    return err(
      createCLIError(
        `Project name must be ${maxLength} characters or less`,
        CLIErrorCode.INVALID_PROJECT_NAME,
      ),
    )
  }

  // Check for scoped packages if not allowed
  if (!allowScoped && trimmed.startsWith('@')) {
    return err(
      createCLIError('Scoped package names are not allowed', CLIErrorCode.INVALID_PROJECT_NAME),
    )
  }

  // Use type guard to validate
  if (!isPackageName(trimmed)) {
    return err(
      createCLIError(
        'Project name must follow npm naming rules (lowercase, no special characters)',
        CLIErrorCode.INVALID_PROJECT_NAME,
        {projectName: trimmed},
      ),
    )
  }

  try {
    const branded = createPackageName(trimmed)
    return ok(branded)
  } catch (error) {
    return err(
      createCLIError(
        error instanceof Error ? error.message : 'Invalid project name',
        CLIErrorCode.INVALID_PROJECT_NAME,
        {projectName: trimmed},
      ),
    )
  }
}

/**
 * Validates a project path and returns a branded ProjectPath
 */
export function validateProjectPath(
  dirPath: string,
  options?: {allowRelative?: boolean},
): Result<ProjectPath, Error> {
  const {allowRelative = true} = options ?? {}

  const trimmed = dirPath.trim()

  if (trimmed.length === 0) {
    return err(createCLIError('Project path is required', CLIErrorCode.INVALID_PATH))
  }

  // Use @bfra.me/es/validation for basic path validation
  const pathValidation = validatePath(trimmed, {
    allowRelative: allowRelative ?? true,
  })

  if (!pathValidation.success) {
    return err(
      createCLIError(pathValidation.error.message, CLIErrorCode.PATH_TRAVERSAL_ATTEMPT, {
        path: trimmed,
      }),
    )
  }

  // Check if absolute path is required
  if (!allowRelative && !path.isAbsolute(trimmed)) {
    return err(
      createCLIError('Absolute path is required', CLIErrorCode.INVALID_PATH, {path: trimmed}),
    )
  }

  // Use type guard to validate
  if (!isProjectPath(trimmed)) {
    return err(createCLIError('Invalid project path', CLIErrorCode.INVALID_PATH, {path: trimmed}))
  }

  try {
    const branded = createProjectPath(trimmed)
    return ok(branded)
  } catch (error) {
    return err(
      createCLIError(
        error instanceof Error ? error.message : 'Invalid project path',
        CLIErrorCode.INVALID_PATH,
        {path: trimmed},
      ),
    )
  }
}

/**
 * Validates a template identifier (GitHub repo, URL, local path, or builtin name)
 */
export function validateTemplateId(template: string): Result<string, Error> {
  const trimmed = template.trim()

  if (trimmed.length === 0) {
    return err(
      createTemplateError('Template identifier is required', TemplateErrorCode.TEMPLATE_INVALID),
    )
  }

  // Sanitize input to remove dangerous characters
  const sanitized = sanitizeInput(trimmed, {
    escapeHtml: false,
    removeNullBytes: true,
    trim: true,
  })

  // Check for path traversal in local paths
  if (sanitized.includes('..')) {
    return err(
      createTemplateError(
        'Template path contains path traversal attempt',
        TemplateErrorCode.TEMPLATE_INVALID,
        {template: sanitized},
      ),
    )
  }

  // Validate GitHub repository format if it looks like one
  if (sanitized.includes('/') && !sanitized.includes('://')) {
    const parts = sanitized.split('/')
    if (parts.length >= 2) {
      const owner = parts[0]
      const repo = parts[1]
      if (owner == null || owner.length === 0 || repo == null || repo.length === 0) {
        return err(
          createTemplateError(
            'Invalid GitHub repository format',
            TemplateErrorCode.TEMPLATE_INVALID,
            {template: sanitized},
          ),
        )
      }
      if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) {
        return err(
          createTemplateError(
            'GitHub repository name contains invalid characters',
            TemplateErrorCode.TEMPLATE_INVALID,
            {template: sanitized},
          ),
        )
      }
    }
  }

  // Validate URL format if it looks like one
  if (sanitized.includes('://')) {
    if (!isUrl(sanitized)) {
      return err(
        createTemplateError('Invalid URL format', TemplateErrorCode.TEMPLATE_INVALID, {
          template: sanitized,
        }),
      )
    }

    try {
      const url = new URL(sanitized)
      if (!['http:', 'https:', 'git:', 'ssh:'].includes(url.protocol)) {
        return err(
          createTemplateError('Unsupported URL protocol', TemplateErrorCode.TEMPLATE_INVALID, {
            template: sanitized,
            protocol: url.protocol,
          }),
        )
      }
    } catch {
      return err(
        createTemplateError('Invalid URL format', TemplateErrorCode.TEMPLATE_INVALID, {
          template: sanitized,
        }),
      )
    }
  }

  return ok(sanitized)
}

/**
 * Validates an email address
 */
export function validateEmailAddress(email: string): Result<string, Error> {
  const trimmed = email.trim()

  if (trimmed.length === 0) {
    return ok('') // Email is optional
  }

  if (!isEmail(trimmed)) {
    return err(createCLIError('Invalid email address format', CLIErrorCode.INVALID_INPUT))
  }

  return ok(trimmed)
}

/**
 * Validates a semantic version string
 */
export function validateSemver(version: string): Result<string, Error> {
  const trimmed = version.trim()

  if (trimmed.length === 0) {
    return ok('1.0.0') // Default version
  }

  if (!isSemver(trimmed)) {
    return err(
      createCLIError(
        'Version must follow semantic versioning format (e.g., 1.0.0)',
        CLIErrorCode.INVALID_INPUT,
      ),
    )
  }

  return ok(trimmed)
}

/**
 * Validates a package manager choice
 */
export function validatePackageManager(
  manager: string,
): Result<'npm' | 'yarn' | 'pnpm' | 'bun', Error> {
  const trimmed = manager.trim().toLowerCase()

  if (!isPackageManager(trimmed)) {
    return err(
      createCLIError(
        'Invalid package manager. Must be one of: npm, yarn, pnpm, bun',
        CLIErrorCode.INVALID_INPUT,
        {packageManager: trimmed},
      ),
    )
  }

  return ok(trimmed)
}

/**
 * Validates a template variable value against its type definition
 */
export function validateTemplateVariableValue(
  variable: TemplateVariable,
  value: unknown,
): Result<unknown, Error> {
  // Check required constraint
  if (variable.required && (value === undefined || value === null || value === '')) {
    return err(
      createTemplateError(
        `Template variable "${variable.name}" is required`,
        TemplateErrorCode.TEMPLATE_VARIABLE_MISSING,
        {variableName: variable.name},
      ),
    )
  }

  // If not required and no value, return undefined
  if (!variable.required && (value === undefined || value === null || value === '')) {
    return ok(variable.default)
  }

  // Type-specific validation
  switch (variable.type) {
    case 'string': {
      if (typeof value !== 'string') {
        return err(
          createTemplateError(
            `Template variable "${variable.name}" must be a string`,
            TemplateErrorCode.TEMPLATE_INVALID,
            {variableName: variable.name, receivedType: typeof value},
          ),
        )
      }

      // Check pattern if specified
      if (variable.pattern !== undefined) {
        const regex = new RegExp(variable.pattern)
        if (!regex.test(value)) {
          return err(
            createTemplateError(
              `Template variable "${variable.name}" does not match required pattern`,
              TemplateErrorCode.TEMPLATE_INVALID,
              {variableName: variable.name, pattern: variable.pattern, value},
            ),
          )
        }
      }

      return ok(value)
    }

    case 'boolean': {
      if (typeof value !== 'boolean') {
        return err(
          createTemplateError(
            `Template variable "${variable.name}" must be a boolean`,
            TemplateErrorCode.TEMPLATE_INVALID,
            {variableName: variable.name, receivedType: typeof value},
          ),
        )
      }
      return ok(value)
    }

    case 'number': {
      const num = typeof value === 'string' ? Number.parseFloat(value) : value
      if (typeof num !== 'number' || Number.isNaN(num)) {
        return err(
          createTemplateError(
            `Template variable "${variable.name}" must be a number`,
            TemplateErrorCode.TEMPLATE_INVALID,
            {variableName: variable.name, receivedType: typeof value},
          ),
        )
      }
      return ok(num)
    }

    case 'select': {
      if (typeof value !== 'string') {
        return err(
          createTemplateError(
            `Template variable "${variable.name}" must be a string`,
            TemplateErrorCode.TEMPLATE_INVALID,
            {variableName: variable.name, receivedType: typeof value},
          ),
        )
      }

      if (variable.options !== undefined && !variable.options.includes(value)) {
        return err(
          createTemplateError(
            `Template variable "${variable.name}" must be one of: ${variable.options.join(', ')}`,
            TemplateErrorCode.TEMPLATE_INVALID,
            {variableName: variable.name, value, allowedOptions: variable.options},
          ),
        )
      }

      return ok(value)
    }

    default: {
      return err(
        createTemplateError(
          `Unknown template variable type: ${String(variable.type)}`,
          TemplateErrorCode.TEMPLATE_INVALID,
          {variableName: variable.name, variableType: variable.type},
        ),
      )
    }
  }
}

/**
 * Factory function to create a validator for a specific template schema
 */
export function createTemplateValidator(variables: TemplateVariable[]) {
  return function validateTemplateContext(
    context: Record<string, unknown>,
  ): Result<Record<string, unknown>, Error> {
    const validated: Record<string, unknown> = {}
    const errors: string[] = []

    for (const variable of variables) {
      const value = context[variable.name]
      const result = validateTemplateVariableValue(variable, value)

      if (result.success) {
        validated[variable.name] = result.data
      } else {
        errors.push(result.error.message)
      }
    }

    if (errors.length > 0) {
      return err(
        createTemplateError(
          `Template validation failed: ${errors.join(', ')}`,
          TemplateErrorCode.TEMPLATE_INVALID,
          {errors},
        ),
      )
    }

    return ok(validated)
  }
}
