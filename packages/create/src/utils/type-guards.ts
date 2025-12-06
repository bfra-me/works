/**
 * Type guards for runtime validation of input types
 * Part of Phase 1: Foundation & Type System Enhancement
 */

import type {
  BrandedTemplateSource,
  PackageName,
  ProjectPath,
  TemplateMetadata,
  TemplateSource,
  TemplateVariable,
} from '../types.js'
import path from 'node:path'
import {brand, isObject, isString} from '@bfra.me/es/types'

/**
 * Validates and brands a string as a template source
 */
export function isTemplateSource(value: unknown): value is BrandedTemplateSource {
  return isString(value) && value.trim().length > 0
}

/**
 * Creates a branded TemplateSource from a validated string
 */
export function createTemplateSource(value: string): BrandedTemplateSource {
  if (!isTemplateSource(value)) {
    throw new TypeError('Invalid template source: must be a non-empty string')
  }
  return brand<string, 'TemplateSource'>(value)
}

/**
 * Validates a project path for security (no path traversal, no null bytes)
 */
export function isProjectPath(value: unknown): value is ProjectPath {
  if (!isString(value)) {
    return false
  }

  // Check for null bytes
  if (value.includes('\0')) {
    return false
  }

  // Check for path traversal attempts
  const normalized = path.normalize(value)
  if (normalized.includes('..')) {
    return false
  }

  // Must be a valid path string
  return value.trim().length > 0
}

/**
 * Creates a branded ProjectPath from a validated string
 */
export function createProjectPath(value: string): ProjectPath {
  if (!isProjectPath(value)) {
    throw new TypeError('Invalid project path: contains invalid characters or path traversal')
  }
  return brand<string, 'ProjectPath'>(value)
}

/**
 * Validates a package name according to npm naming rules
 */
export function isPackageName(value: unknown): value is PackageName {
  if (!isString(value)) {
    return false
  }

  const trimmed = value.trim()

  // Length validation
  if (trimmed.length === 0 || trimmed.length > 214) {
    return false
  }

  // Cannot start with dot or underscore
  if (trimmed.startsWith('.') || trimmed.startsWith('_')) {
    return false
  }

  // Must match npm package name pattern
  // Allows lowercase letters, numbers, hyphens, dots, and underscores
  // Can have scope (@org/package)
  const packageNamePattern = /^(?:@[a-z\d][\w.\-]*\/)?[a-z\d](?:[a-z\d._\-]*[a-z\d])?$/
  if (!packageNamePattern.test(trimmed)) {
    return false
  }

  // Check against reserved names
  const reservedNames = [
    'node_modules',
    'favicon.ico',
    'package.json',
    'readme.md',
    'changelog.md',
    'license',
    'mit',
    'apache',
    'gpl',
    'bsd',
  ]

  const nameWithoutScope = trimmed.includes('/') ? trimmed.split('/')[1] : trimmed
  if (reservedNames.includes(nameWithoutScope?.toLowerCase() ?? '')) {
    return false
  }

  // Check against built-in Node.js modules
  const builtinModules = [
    'assert',
    'buffer',
    'child_process',
    'cluster',
    'crypto',
    'dgram',
    'dns',
    'domain',
    'events',
    'fs',
    'http',
    'https',
    'net',
    'os',
    'path',
    'punycode',
    'querystring',
    'readline',
    'stream',
    'string_decoder',
    'timers',
    'tls',
    'tty',
    'url',
    'util',
    'v8',
    'vm',
    'zlib',
  ]

  return !builtinModules.includes(trimmed)
}

/**
 * Creates a branded PackageName from a validated string
 */
export function createPackageName(value: string): PackageName {
  if (!isPackageName(value)) {
    throw new TypeError(
      'Invalid package name: must follow npm naming rules (lowercase, 214 chars max, no special chars)',
    )
  }
  return brand<string, 'PackageName'>(value)
}

/**
 * Type guard for TemplateSource interface
 */
export function isTemplateSourceObject(value: unknown): value is TemplateSource {
  if (!isObject(value)) {
    return false
  }

  // Validate required fields
  if (
    typeof value.type !== 'string' ||
    !['github', 'local', 'url', 'builtin'].includes(value.type)
  ) {
    return false
  }

  if (!isString(value.location) || value.location.trim().length === 0) {
    return false
  }

  // Validate optional fields if present
  if (value.ref !== undefined && !isString(value.ref)) {
    return false
  }

  if (value.subdir !== undefined && !isString(value.subdir)) {
    return false
  }

  return true
}

/**
 * Type guard for TemplateVariable interface
 */
export function isTemplateVariable(value: unknown): value is TemplateVariable {
  if (!isObject(value)) {
    return false
  }

  // Validate required fields
  if (!isString(value.name) || value.name.trim().length === 0) {
    return false
  }

  if (!isString(value.description)) {
    return false
  }

  if (
    typeof value.type !== 'string' ||
    !['string', 'boolean', 'number', 'select'].includes(value.type)
  ) {
    return false
  }

  // Validate optional fields if present
  if (value.required !== undefined && typeof value.required !== 'boolean') {
    return false
  }

  if (value.pattern !== undefined && !isString(value.pattern)) {
    return false
  }

  if (value.options !== undefined) {
    if (!Array.isArray(value.options)) {
      return false
    }
    if (!value.options.every(opt => isString(opt))) {
      return false
    }
  }

  return true
}

/**
 * Type guard for TemplateMetadata interface
 */
export function isTemplateMetadata(value: unknown): value is TemplateMetadata {
  if (!isObject(value)) {
    return false
  }

  // Validate required fields
  if (!isString(value.name) || value.name.trim().length === 0) {
    return false
  }

  if (!isString(value.description)) {
    return false
  }

  if (!isString(value.version) || value.version.trim().length === 0) {
    return false
  }

  // Validate optional fields if present
  if (value.author !== undefined && !isString(value.author)) {
    return false
  }

  if (value.tags !== undefined) {
    if (!Array.isArray(value.tags)) {
      return false
    }
    if (!value.tags.every(tag => isString(tag))) {
      return false
    }
  }

  if (value.variables !== undefined) {
    if (!Array.isArray(value.variables)) {
      return false
    }
    if (!value.variables.every(v => isTemplateVariable(v))) {
      return false
    }
  }

  if (value.dependencies !== undefined) {
    if (!Array.isArray(value.dependencies)) {
      return false
    }
    if (!value.dependencies.every(dep => isString(dep))) {
      return false
    }
  }

  if (value.nodeVersion !== undefined && !isString(value.nodeVersion)) {
    return false
  }

  return true
}

/**
 * Validates package manager type
 */
export function isPackageManager(value: unknown): value is 'npm' | 'yarn' | 'pnpm' | 'bun' {
  return typeof value === 'string' && ['npm', 'yarn', 'pnpm', 'bun'].includes(value)
}

/**
 * Validates project type
 */
export function isProjectType(
  value: unknown,
): value is 'typescript' | 'javascript' | 'react' | 'vue' | 'angular' | 'node' | 'unknown' {
  return (
    typeof value === 'string' &&
    ['typescript', 'javascript', 'react', 'vue', 'angular', 'node', 'unknown'].includes(value)
  )
}
